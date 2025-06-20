import * as draw_manage from './draw_manage.js'

let shape_type_control = 0   //0圓 1矩形

console.log(location);
const socket = io(location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://profiles-12ch.onrender.com',
    {
        transports: ['websocket', 'polling']
    }
);

all_init()
function all_init() {
    const player_id = window['player_id']

    dom_listen()
    init()
    function init() {
        let objs_for_init = {
            document,
        };

        draw_manage.init(objs_for_init)

        let that = document.getElementById('control_add')
        draw_manage.set_listen_func(that)
        $(".tool-label").eq(0).addClass("active")

        //TODO多人協作
        socket.on('receive_draw_message', (_data) => {
            // console.log(_data);

            draw_manage.update_draw_info(_data)
        })

        draw_manage.set_draw_cb(function (_data) {
            // console.log("data");
            // console.log(_data);
            socket.emit('send_draw_message', _data)
        })
    }

    function dom_listen() {
        $(".tool-item").on("click", function () {
            let index = $(this).index(".tool-item") * 1

            $(".tool-item-container").removeClass("active")
            let target = $(".tool-item-container").eq(index)
            if (index != 0) target.addClass("active")

            if (index < 2) {   //畫筆或形狀
                $(".tool-label").removeClass("active")
                let target_ = $(".tool-label").eq(index)
                target_.addClass("active")
            }
        })

        //塗鴉
        $("#draw_color").on('change', function () {
            draw_manage.draw_color_func(this)

            let color = $(this).val()
            $(".color-picker-wrapper").css("background", color)
        })
        $("#draw_lineWidth").on('change', function () {
            let lineWidth = $(this).val()
            console.log(lineWidth);

            draw_manage.draw_lineWidth_func(this)

            $(".pen-size-display").css("width", lineWidth * 1.5 + "px")
            $(".pen-size-display").css("height", lineWidth * 1.5 + "px")
        })
        $("#add_pen").on('click', function () {
            draw_manage.addCanvasInit()
        })
        $("#add_shape").on('click', function () {
            $(".shape-option").removeClass("active")
            let that = $(".shape-option").eq(shape_type_control)
            that.addClass("active")

            draw_manage.draw_shape_func(that)
            draw_manage.addShapeInit()
        })
        $(".shape-option").on('click', function () {
            $(".shape-option").removeClass("active")
            $(this).addClass("active")

            let index = $(this).val() * 1
            shape_type_control = index
            draw_manage.draw_shape_func(this)
            draw_manage.addShapeInit()
        })
        $("#undo").on('click', function () {
            draw_manage.undo_canvas_func()
        })
        $("#clear").on('click', function () {
            draw_manage.clear_canvas_func()
        })
    }
}
