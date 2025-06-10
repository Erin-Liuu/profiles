import * as THREE from 'three';

import * as event_listen from './event_listen.js'
import { MOUSE_TYPE, POINT_TYPE, TOUCH_TYPE } from './event_listen_constants.js';

let scene = null;
let scene_for_three_group = null;
let camera = null;
let cameraControl = null;
let document = null;
let drawing_dom = null;

let drawingCanvas = null
let drawingContext = null
let add_canvas_control = null
let add_shape_control = null

var TYPE = -1;
var SHAPETYPE = -1;   // 0:圓形, 1:矩形
var colorNow = [0, 0, 0];
var lineWidth = 1.5;
var undoStack = []

//同步用
let temp_info = {
    drawStartPos: new THREE.Vector2(),
    movePos: new THREE.Vector2(),
}
let draw_cb = function () { }

let draw_list = []
const file_limit = 10
// const expires = 1 / 24 / 60
const expires = 400   // 設置天數過期(最大)
const dir_path = './upload/temp/drawImage/'

function json_post(url, data) {
    data._csrf = $("#_csrf").val()
    var jxhr = $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(data),

        timeout: 3 * 60 * 1000,
    });
    return jxhr;
}

function init(option) {
    scene = option.scene
    scene_for_three_group = option.scene_for_three_group
    camera = option.camera
    cameraControl = option.cameraControl
    document = option.document
    drawing_dom = document.getElementById('touchArea')
}
function set_listen_func(that) {
    end_draw()

    var val = $(that).val() * 1
    if (val == 0) TYPE = MOUSE_TYPE
    else if (val == 1) TYPE = POINT_TYPE
    else if (val == 2) TYPE = TOUCH_TYPE

    start_draw()
    addCanvasInit()

    //暫存圖檔初始
    var cookieData = Cookies.get('draw_list');
    console.log('draw_init');
    console.log(cookieData);
    if (cookieData) {
        draw_list = cookieData.split(',')
        const img = new Image();
        img.src = '.' + dir_path + draw_list[draw_list.length - 1];  //最新
        img.onload = function () {
            drawingContext.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
        };
    }
}
function draw_color_func(that) {
    var hex = $(that).val().split('')
    var r = parseInt(hex[1] + hex[2], 16)
    var g = parseInt(hex[3] + hex[4], 16)
    var b = parseInt(hex[5] + hex[6], 16)

    colorNow = [r, g, b];
    let color = new THREE.Color(`rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`)

    console.log(colorNow);
    if (add_canvas_control.info.using) {
        add_canvas_control.info.color = `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`
    }
    if (add_shape_control.info.using) {
        add_shape_control.info.color = `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`
    }
}
function draw_lineWidth_func(that) {
    lineWidth = $(that).val()

    console.log(lineWidth);
    if (add_canvas_control.info.using) {
        add_canvas_control.info.lineWidth = lineWidth
    }
    if (add_shape_control.info.using) {
        add_shape_control.info.lineWidth = lineWidth
    }
}
function draw_shape_func(that) {
    var val = $(that).val() * 1
    SHAPETYPE = val
}
function clear_canvas_func() {
    // undoStack = []
    if (drawingCanvas) {
        drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
        //暫存圖檔
        save_image()
    }
    draw_cb({ type: "clear" })
}
function undo_canvas_func() {
    if (undoStack.length > 1) {
        undoStack.pop();
        let prevState = undoStack[undoStack.length - 1]
        // console.log('pop');
        // console.log(undoStack);
        drawingContext.putImageData(prevState, 0, 0);
        //暫存圖檔
        save_image()

        draw_cb({ type: "undo" })
    }
    else {
        undoStack = []
        clear_canvas_func()
    }
}

class add_obj_control {
    constructor({
        init = function () { },
        update = function () { },
        end = function () { },
        clear = function () { },
        down_func = function () { },
        move_func = function () { },
        up_func = function () { },
    }) {
        let that = this;
        this.down_func = down_func
        this.move_func = move_func
        this.up_func = up_func
        this.init = function () {
            init(that)
        }
        this.update = function () {
            update(that)
        }
        this.end = function () {
            end(that)
        }
        this.clear = function () {
            clear(that)
        }

        this.info = {}

        // console.log(TYPE);
        this.mouse_down = new event_listen.build({
            dom: drawing_dom,
            type: TYPE.DOWN,
            enabled: false,
            callback: function (event, x, y) {
                console.log('mouse_down');

                that.down_func(that, event, x, y)
            }
        })
        this.mouse_move = new event_listen.build({
            dom: drawing_dom,
            type: TYPE.MOVE,
            enabled: false,
            callback: function (event, x, y) {
                that.move_func(that, event, x, y)
            }
        })
        this.mouse_up = new event_listen.build({
            dom: drawing_dom,
            type: TYPE.UP,
            enabled: false,
            callback: function (event) {
                that.up_func(that, event)
            }
        })

        //同時執行
        // MOUSE_TYPE
        this.mouse_down0 = new event_listen.build({
            dom: drawing_dom,
            // type: MOUSE_TYPE.DOWN,
            type: TOUCH_TYPE.DOWN,
            enabled: false,
            callback: function (event, x, y) {
                that.down_func(that, event, x, y)
            }
        })
        this.mouse_move0 = new event_listen.build({
            dom: drawing_dom,
            // type: MOUSE_TYPE.MOVE,
            type: TOUCH_TYPE.MOVE,
            enabled: false,
            callback: function (event, x, y) {
                that.move_func(that, event, x, y)
            }
        })
        this.mouse_up0 = new event_listen.build({
            dom: drawing_dom,
            // type: MOUSE_TYPE.UP,
            type: TOUCH_TYPE.UP,
            enabled: false,
            callback: function (event) {
                that.up_func(that, event)
            }
        })

        //同時執行
        // MOUSE_TYPE
        this.mouse_down1 = new event_listen.build({
            dom: drawing_dom,
            type: MOUSE_TYPE.DOWN,
            // type: TOUCH_TYPE.DOWN,
            enabled: false,
            callback: function (event, x, y) {
                that.down_func(that, event, x, y)
            }
        })
        this.mouse_move1 = new event_listen.build({
            dom: drawing_dom,
            type: MOUSE_TYPE.MOVE,
            // type: TOUCH_TYPE.MOVE,
            enabled: false,
            callback: function (event, x, y) {
                that.move_func(that, event, x, y)
            }
        })
        this.mouse_up1 = new event_listen.build({
            dom: drawing_dom,
            type: MOUSE_TYPE.UP,
            // type: TOUCH_TYPE.UP,
            enabled: false,
            callback: function (event) {
                that.up_func(that, event)
            }
        })
    }
}

function start_draw() {

    add_canvas_control = new add_obj_control({
        init: function (that) {
            that.mouse_down.toggle(true)
            that.mouse_down0.toggle(true)
            that.mouse_down1.toggle(true)

            that.info = {
                // position_left: [],
                // position_left1: [],
                // left_show: false,
                // position_move: [],
                // position_move1: [],
                // move_show: false,
                drawingCanvas: null,
                drawingContext: null,
                material: null,
                paint: false,
                undoStack: [],
                drawStartPos: new THREE.Vector2(),
                color: `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`,
                lineWidth: lineWidth,

                using: true,
            }

            // that.info.material = new THREE.MeshBasicMaterial({
            //     color: 0xa9a9a9,
            // });

            // let mesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), that.info.material);
            // mesh.position.y = 40
            // scene.add(mesh);

            // console.log(that.mouse_down);
            //canvas setup
            // that.info.drawingCanvas = that.mouse_down.dom
            // that.info.drawingContext = that.info.drawingCanvas.getContext('2d');

            // const drawingCanvas = that.info.drawingCanvas
            if (!drawingCanvas) {
                drawingCanvas = that.mouse_down.dom
                drawingContext = drawingCanvas.getContext('2d');

                drawingCanvas.width = window.parent.innerWidth //window.innerWidth
                drawingCanvas.height = window.parent.innerHeight
                drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            }
            // that.info.drawingContext.fillStyle = '#A9A9A9';
            // that.info.drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            // that.info.material.map = new THREE.CanvasTexture(drawingCanvas);
        },
        down_func: function (that, event, x, y) {
            that.info.drawStartPos.set(x, y)
            // if (!that.info.color) that.info.color = `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`
            // console.log(that.info.drawStartPos);
            that.info.paint = true;
            drawingContext.beginPath();

            that.mouse_move.toggle(true)
            that.mouse_up.toggle(true)

            that.mouse_move0.toggle(true)
            that.mouse_up0.toggle(true)

            that.mouse_move1.toggle(true)
            that.mouse_up1.toggle(true)

            draw_cb({ type: "pen", data: { paint: true, x, y } })
        },
        move_func: function (that, event, x, y) {
            if (that.info.paint) {
                // let drawingContext = that.info.drawingContext
                // console.log(that.info.drawingContext);
                drawingContext.moveTo(that.info.drawStartPos.x, that.info.drawStartPos.y);
                drawingContext.strokeStyle = that.info.color;
                drawingContext.lineWidth = that.info.lineWidth;
                drawingContext.lineTo(x, y);
                drawingContext.stroke();
                // reset drawing start position to current position.
                that.info.drawStartPos.set(x, y);
                // need to flag the map as needing updating.
                // that.info.material.map.needsUpdate = true;

                draw_cb({ type: "pen", data: { paint: true, x, y, color: that.info.color, lineWidth: that.info.lineWidth } })
            }
        },
        up_func: async function (that, event) {
            that.info.paint = false;
            drawingContext.closePath()
            // saveState
            const image = drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
            undoStack.push(image);
            // console.log(undoStack);
            that.mouse_move.toggle(false)
            that.mouse_up.toggle(false)

            that.mouse_move0.toggle(false)
            that.mouse_up0.toggle(false)

            that.mouse_move1.toggle(false)
            that.mouse_up1.toggle(false)

            draw_cb({ type: "pen", data: { paint: false } })

            //暫存圖檔
            save_image()
        },
        clear: function (that) {
            that.mouse_down.toggle(false)
            that.mouse_move.toggle(false)
            that.mouse_up.toggle(false)

            that.mouse_down0.toggle(false)
            that.mouse_move0.toggle(false)
            that.mouse_up0.toggle(false)

            that.mouse_down1.toggle(false)
            that.mouse_move1.toggle(false)
            that.mouse_up1.toggle(false)

            // if (that.info.using) {
            //     that.info.using = false

            //     // if (that.info.polygon_left)
            //     // pic_group.remove(that.info.polygon_left);
            //     // if (that.info.polygon_move)
            //     // pic_group.remove(that.info.polygon_move);
            // }
            // drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
        },
        end: function (that) {
            that.clear()
            that.mouse_down.destroy()
            that.mouse_move.destroy()
            that.mouse_up.destroy()

            that.mouse_down0.destroy()
            that.mouse_move0.destroy()
            that.mouse_up0.destroy()

            that.mouse_down1.destroy()
            that.mouse_move1.destroy()
            that.mouse_up1.destroy()
        }
    })

    add_shape_control = new add_obj_control({
        init: function (that) {
            that.mouse_down.toggle(true)
            that.mouse_down0.toggle(true)
            that.mouse_down1.toggle(true)

            that.info = {
                // position_left: [],
                // position_left1: [],
                // left_show: false,
                // position_move: [],
                // position_move1: [],
                // move_show: false,
                tempCanvas: null,
                tempCtx: null,
                preImageData: null,
                material: null,
                mesh: null,
                paint: false,
                undoStack: [],
                drawStartPos: new THREE.Vector2(),
                movePos: new THREE.Vector2(),
                color: `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`,
                lineWidth: lineWidth,


                using: true,
            }

            if (!drawingCanvas) {
                drawingCanvas = that.mouse_down.dom
                drawingContext = drawingCanvas.getContext('2d');

                drawingCanvas.width = window.parent.innerWidth
                drawingCanvas.height = window.parent.innerHeight

                drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            }
            that.info.tempCanvas = document.createElement('canvas')
            const tempCanvas = that.info.tempCanvas
            tempCanvas.width = window.parent.innerWidth;
            tempCanvas.height = window.parent.innerHeight;

            that.info.tempCtx = tempCanvas.getContext('2d');
            that.info.tempCtx.drawImage(drawingCanvas, 0, 0);
            // that.info.material = new THREE.MeshBasicMaterial();


        },
        down_func: function (that, event, x, y) {
            that.info.drawStartPos.set(x, y)
            // if (!that.info.color) that.info.color = `rgb(${colorNow[0]}, ${colorNow[1]}, ${colorNow[2]})`
            // console.log(that.info.drawStartPos);
            that.info.preImageData = drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
            that.info.paint = true;
            // drawingContext.beginPath();
            that.info.tempCtx.clearRect(0, 0, that.info.tempCanvas.width, that.info.tempCanvas.height)
            that.info.tempCtx.beginPath();

            that.mouse_move.toggle(true)
            that.mouse_up.toggle(true)

            that.mouse_move0.toggle(true)
            that.mouse_up0.toggle(true)

            that.mouse_move1.toggle(true)
            that.mouse_up1.toggle(true)

            draw_cb({ type: "shape", data: { paint: true, x, y } })
        },
        move_func: function (that, event, x, y) {
            let movePos = that.info.movePos.set(x, y)
            const centerX = (movePos.x + that.info.drawStartPos.x) / 2
            const centerY = (movePos.y + that.info.drawStartPos.y) / 2
            const radiusX = movePos.distanceTo(that.info.drawStartPos) / 2
            const rotation = 0;  // 旋轉角度
            const startAngle = 0; // 起始角度
            const endAngle = Math.PI * 2
            let width = Math.abs(movePos.x - that.info.drawStartPos.x)
            let height = Math.abs(movePos.y - that.info.drawStartPos.y)
            if (that.info.paint) {
                const tempCtx = that.info.tempCtx
                tempCtx.clearRect(0, 0, that.info.tempCanvas.width, that.info.tempCanvas.height)
                tempCtx.strokeStyle = that.info.color
                tempCtx.fillStyle = that.info.color
                tempCtx.lineWidth = that.info.lineWidth
                if (SHAPETYPE == 0) {
                    tempCtx.ellipse(centerX, centerY, radiusX, radiusX, rotation, startAngle, endAngle)
                }
                else if (SHAPETYPE == 1) {
                    if (that.info.drawStartPos.y < centerY) {
                        if (that.info.drawStartPos.x < centerX)
                            tempCtx.rect(that.info.drawStartPos.x, that.info.drawStartPos.y, width, height);
                        else
                            tempCtx.rect(movePos.x, that.info.drawStartPos.y, width, height);

                    }
                    else {
                        if (that.info.drawStartPos.x < centerX)
                            tempCtx.rect(that.info.drawStartPos.x, movePos.y, width, height);
                        else
                            tempCtx.rect(movePos.x, movePos.y, width, height);

                    }
                    // tempCtx.rect(centerX, centerY, width, height);  //左上角
                }
                tempCtx.stroke()
                tempCtx.closePath()
                tempCtx.beginPath();

                //歷史資訊
                // console.log(that.info.preImageData);
                drawingContext.putImageData(that.info.preImageData, 0, 0)
                drawingContext.drawImage(that.info.tempCanvas, 0, 0)

                draw_cb({ type: "shape", data: { paint: true, x, y, shape_type: SHAPETYPE, color: that.info.color, lineWidth: that.info.lineWidth } })
            }
        },
        up_func: function (that, event) {
            that.info.paint = false;
            that.info.tempCtx.closePath()
            drawingContext.drawImage(that.info.tempCanvas, 0, 0)
            // saveState
            undoStack.push(drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));

            that.mouse_move.toggle(false)
            that.mouse_up.toggle(false)

            that.mouse_move0.toggle(false)
            that.mouse_up0.toggle(false)

            that.mouse_move1.toggle(false)
            that.mouse_up1.toggle(false)

            //暫存圖檔
            save_image()

            draw_cb({ type: "shape", data: { paint: false } })
        },
        clear: function (that) {
            that.mouse_down.toggle(false)
            that.mouse_move.toggle(false)
            that.mouse_up.toggle(false)

            that.mouse_down0.toggle(false)
            that.mouse_move0.toggle(false)
            that.mouse_up0.toggle(false)

            that.mouse_down1.toggle(false)
            that.mouse_move1.toggle(false)
            that.mouse_up1.toggle(false)
            // drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            // if (that.info.using) {
            //     that.info.using = false

            //     // if (that.info.polygon_left)
            //     // pic_group.remove(that.info.polygon_left);
            //     // if (that.info.polygon_move)
            //     // pic_group.remove(that.info.polygon_move);
            // }
        },
        end: function (that) {
            that.clear()
            that.mouse_down.destroy()
            that.mouse_move.destroy()
            that.mouse_up.destroy()

            that.mouse_down0.destroy()
            that.mouse_move0.destroy()
            that.mouse_up0.destroy()

            that.mouse_down1.destroy()
            that.mouse_move1.destroy()
            that.mouse_up1.destroy()
        }
    })
}
function end_draw() {
    undoStack = []
    if (add_canvas_control) add_canvas_control.end()
    if (add_shape_control) add_shape_control.end()
}
async function save_image() {
    const dataUrl = drawingCanvas.toDataURL();
    let res = await json_post('/file/upload_draw_image', { data: dataUrl, list_length: draw_list.length })
    // console.log(res);
    draw_list.push(res.data.url)

    // console.log(draw_list);
    clean_image() //清除檢查
}
async function clean_image() {
    if (draw_list.length <= file_limit) {
        Cookies.set('draw_list', draw_list, { expires: expires });

    } else {
        // console.log('clean_draw_image');
        // console.log(dir_path + draw_list[0]);
        await json_post('/file/clean_draw_image', { data: dir_path + draw_list[0] })
        draw_list = draw_list.slice(1)

        // console.log(draw_list);
        clean_image()
    }
}

function addCanvasInit() {
    if (add_shape_control) add_shape_control.clear()
    add_canvas_control.init()
}
function addShapeInit() {
    if (add_canvas_control) add_canvas_control.clear()
    if (SHAPETYPE * 1 !== -1) add_shape_control.init()
}

function update_draw_info({ type, data }) {
    switch (type) {
        case "pen":
            var { paint, x, y, color, lineWidth } = data
            if (paint) {
                if (!color) {  //down
                    drawingContext.beginPath();
                    temp_info.drawStartPos.set(x, y)
                } else {
                    drawingContext.moveTo(temp_info.drawStartPos.x, temp_info.drawStartPos.y);
                    drawingContext.strokeStyle = color;
                    drawingContext.lineWidth = lineWidth;
                    drawingContext.lineTo(x, y);
                    drawingContext.stroke();
                    // reset drawing start position to current position.
                    temp_info.drawStartPos.set(x, y);
                }
            }
            else {
                drawingContext.closePath()
                temp_info.drawStartPos.set(0, 0);
                // saveState
                const image = drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
                undoStack.push(image);

                //暫存圖檔
                save_image()
            }
            break;
        case "shape":
            if (!temp_info.tempCanvas) {
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = window.parent.innerWidth;
                tempCanvas.height = window.parent.innerHeight;

                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(drawingCanvas, 0, 0);

                temp_info.tempCanvas = tempCanvas
                temp_info.tempCtx = tempCtx
            }

            var { paint, x, y, shape_type, color, lineWidth } = data
            if (paint) {
                if (!color) {  //down
                    temp_info.drawStartPos.set(x, y)
                    temp_info.preImageData = drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)

                    temp_info.tempCtx.clearRect(0, 0, temp_info.tempCanvas.width, temp_info.tempCanvas.height)
                    temp_info.tempCtx.beginPath();
                } else {
                    let movePos = temp_info.movePos.set(x, y)
                    const centerX = (movePos.x + temp_info.drawStartPos.x) / 2
                    const centerY = (movePos.y + temp_info.drawStartPos.y) / 2
                    const radiusX = movePos.distanceTo(temp_info.drawStartPos) / 2
                    const rotation = 0;  // 旋轉角度
                    const startAngle = 0; // 起始角度
                    const endAngle = Math.PI * 2
                    let width = Math.abs(movePos.x - temp_info.drawStartPos.x)
                    let height = Math.abs(movePos.y - temp_info.drawStartPos.y)

                    const tempCtx = temp_info.tempCtx
                    tempCtx.clearRect(0, 0, temp_info.tempCanvas.width, temp_info.tempCanvas.height)
                    tempCtx.strokeStyle = color
                    tempCtx.fillStyle = color
                    tempCtx.lineWidth = lineWidth
                    if (shape_type == 0) {
                        tempCtx.ellipse(centerX, centerY, radiusX, radiusX, rotation, startAngle, endAngle)
                    }
                    else if (shape_type == 1) {
                        if (temp_info.drawStartPos.y < centerY) {
                            if (temp_info.drawStartPos.x < centerX)
                                tempCtx.rect(temp_info.drawStartPos.x, temp_info.drawStartPos.y, width, height);
                            else
                                tempCtx.rect(movePos.x, temp_info.drawStartPos.y, width, height);

                        }
                        else {
                            if (temp_info.drawStartPos.x < centerX)
                                tempCtx.rect(temp_info.drawStartPos.x, movePos.y, width, height);
                            else
                                tempCtx.rect(movePos.x, movePos.y, width, height);

                        }
                        // tempCtx.rect(centerX, centerY, width, height);  //左上角
                    }
                    tempCtx.stroke()
                    tempCtx.closePath()
                    tempCtx.beginPath();

                    //歷史資訊
                    // console.log(temp_info.preImageData);
                    drawingContext.putImageData(temp_info.preImageData, 0, 0)
                    drawingContext.drawImage(temp_info.tempCanvas, 0, 0)
                }
            }
            else {
                temp_info.tempCtx.closePath()
                drawingContext.drawImage(temp_info.tempCanvas, 0, 0)
                // saveState
                undoStack.push(drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));

                //暫存圖檔
                save_image()
            }
            break;
        case "undo":
            if (undoStack.length > 1) {
                undoStack.pop();
                let prevState = undoStack[undoStack.length - 1]
                drawingContext.putImageData(prevState, 0, 0);

                //暫存圖檔
                save_image()
            }
            break;
        case "clear":
            drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            break;
    }
}
function set_draw_cb(_draw_cb) {
    draw_cb = _draw_cb
}

export {
    addCanvasInit,
    addShapeInit,

    init,
    // build,
    set_listen_func,
    draw_color_func,
    draw_lineWidth_func,
    draw_shape_func,
    undo_canvas_func,
    clear_canvas_func,

    update_draw_info,
    set_draw_cb,
};