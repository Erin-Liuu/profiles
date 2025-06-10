import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as Cesium from 'cesium'


window['call_window_func'] = function (func_name, params) {
    if (window_func[func_name]) window_func[func_name](params)
}
let window_func = {}
var pos = [
    [121.78809029367667, 25.147088806820324],
    [121.7883699673747, 25.14765905227325],

    [121.78491397124876, 25.148362763213854],


    [121.78591652536392, 25.146785039116693],
    [121.7863983791101, 25.145802327127726],
    [121.78555953933437, 25.146348189271016],



    [121.79402395080145, 25.1440129444624],
    [121.79492174756689, 25.14151872860261],
    [121.79263737232344, 25.141954930194462],
    [121.79135711345823, 25.144855488463854],
    [121.79527879555334, 25.142875279379112],

]
window['get_ais_pos_info'] = function (_pos_arr) { pos = _pos_arr; }


// require.config({
//     baseUrl: "",
//     paths: {
//         "jquery": "/include/jquery@3.3.1/jquery.min",
//         "Cesium": '/node_modules/cesium/Build/Cesium/Cesium',
//     },
// });
// require([
//     'jquery',
//     'Cesium'
// ], function (
//     $,
//     Cesium,
// ) {
let scene = null;
let renderer = null;

let camera = null;
let cameraControl = null;


let quat = null;
let group = new THREE.Group()

let canvasW, canvasH, scale
let canvas, geoCanvas, shipCanvas, pre_shipCanvas
let ctx, gctx, spctx

let geoData = null
let radarScan = null
let images = []
// let pos = []

let scan_update = false
const all_info = {
    sweepAngle: 270,  //掃描角度
    sweepSpeed: 0.8,   //掃描速度(度每毫秒)
    sweepSize: 25   //掃描寬度
}

let loader = new THREE.FileLoader();
function load_json(url) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            // onLoad callback
            function (data) {
                data = JSON.parse(data)
                resolve({ success: true, data })
            },
            // onProgress callback
            function (xhr) {
                //// console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                // resolve({ success: false })
            },
            // onError callback
            function (err) {
                console.error('An error happened');
                resolve({ success: false })
            }
        );
    })
}

// const center_point = Cesium.Cartesian3.fromDegrees(121.7892478369434, 25.14995702553833)

//地圖預設中心
let geoLon = 121.7892478369434
let geoLat = 25.14995702553833
let center_m_inverse
const width = window.parent.innerWidth * 4
const height = window.parent.innerHeight * 4
// const width = 2500 
// const height = 3200



all_init()
function all_init() {
    // let index = []
    // let scale_ = []
    // let rotate_ = []
    let vessel = {}

    let preRender_funcs = {};


    init()
    render()

    async function init() {
        {
            geoCanvas = document.getElementById("geoMap");
            gctx = geoCanvas.getContext("2d");
            canvas = document.getElementById("radar");
            ctx = canvas.getContext("2d");

            shipCanvas = document.getElementById("ship");
            spctx = shipCanvas.getContext("2d");


            $("#lon").val(geoLon)
            $("#lat").val(geoLat)
            $("#map_center_lon").text(geoLon.toFixed(4))
            $("#map_center_lat").text(geoLat.toFixed(4))

            canvasW = width //m 
            canvasH = height //m
            scale = 1.0

            let res = await load_json("../data/ship_coastal/Polygon_0353.json")
            geoData = res.data
            // console.log(geoData);
        }

        // radar_focus_scan()

        //船點效果
        let imageURL = [
            `../media/img/ship_shape/ship1.png`,
            `../media/img/ship_shape/ship2.png`,
            `../media/img/ship_shape/ship3.png`
        ]

        let imagesLoaded = 0
        function loadImages(sources, callback) {
            for (var i = 0; i < sources.length; i++) {
                var img = new Image();
                img.onload = function () {
                    imagesLoaded++;
                    if (imagesLoaded == sources.length) {
                        callback(images); // 完成加載
                    }
                };
                img.src = sources[i];
                images.push(img);     //儲存圖片
            }
        }
        loadImages(imageURL, function (images) {
            // console.log(images);
            radar_focus_scan()
            // ship_location(images)

            radar_update_pos()
        });


        dom_listen()
    }
    function dom_listen() {
        document.addEventListener("keydown", onDocumentKeyDown, false);
        function onDocumentKeyDown(event) {
            var keyCode = event.which;
            // console.log(keyCode);
            let step = 0.0004

            switch (keyCode) {
                case 87: //W
                    move(step, 0);
                    break;
                case 65: //A
                    move(0, -step);
                    break;
                case 83: //S
                    move(-step, 0);
                    break;
                case 68: //D
                    move(0, step);
                    break;
            }

            $("#map_center_lon").text(geoLon.toFixed(4))
            $("#map_center_lat").text(geoLat.toFixed(4))
        }
        function move(up, right) {
            if (
                geoLon + right < 121.7584 ||
                geoLat + up < 25.145
            ) return

            scan_update = true
            geoLon += right
            geoLat += up
        }
        $("#map_center_origin").on("click", function () {
            scan_update = true
            geoLon = 121.7892478369434
            geoLat = 25.14995702553833
        })
        $("#location").on("change", function () {
            scan_update = true
            geoLon = $("#lon").val() * 1
            geoLat = $("#lat").val() * 1
        })
        $("#scale").on("change", function () {
            scan_update = true
            scale = $(this).val() * 1

            canvasW *= scale
            canvasH *= scale
        })
    }
    function radar_update_pos() {
        const center_point = Cesium.Cartesian3.fromDegrees(geoLon, geoLat)
        const center_m = Cesium.Transforms.eastNorthUpToFixedFrame(center_point)   //以 center_point 為中心的局部參考框架，（ENU）坐標系建立
        center_m_inverse = Cesium.Matrix4.inverse(center_m, new Cesium.Matrix4())

        geoCanvas.width = width / 4
        geoCanvas.height = height / 4
        // canvas.width = width / 4
        // canvas.height = height / 4
        shipCanvas.width = width / 4
        shipCanvas.height = height / 4


        let hueStart = 120
        let hueEnd = 170
        let hueDiff = Math.abs(hueEnd - hueStart)
        let saturation = 50 + 10
        let lightness = 40 + 10

        let gradient = ctx.createLinearGradient(250, 0, 0, 0)
        let padding = 14
        // radar.style.marginLeft = radar.style.marginTop = (-diameter / 2) - padding + 'px';
        gradient.addColorStop(0, 'hsla( ' + hueStart + ', ' + saturation + '%, ' + lightness + '%, 0.6 )');
        gradient.addColorStop(1, 'hsla( ' + hueEnd + ', ' + saturation + '%, ' + lightness + '%, 0.1 )');


        for (var k1 in geoData) {
            let coordinates = geoData[k1].geometry.coordinates[0]
            // gctx.globalCompositeOperation = 'lighter';
            gctx.beginPath()
            // ctx.moveTo(0, 0);
            for (var k2 in coordinates) {
                let lon = coordinates[k2][0]
                let lat = coordinates[k2][1]
                // console.log(lat);
                let origin_p = Cesium.Cartesian3.fromDegrees(lon, lat)
                // let position = new THREE.Vector3(
                //     p.x - center_point.x,
                //     p.y - center_point.y,
                //     p.z - center_point.z,
                // )
                // let origin_p = new THREE.Vector3(p.x, p.y, p.z)
                // console.log(center_point.x);
                // console.log(p.x);
                let p1 = Cesium.Matrix4.multiplyByPoint(center_m_inverse, origin_p, new Cesium.Cartesian3())
                // console.log(origin_p);
                // console.log(p1);   //東北向移動量值


                //畫布座標: 原點左上 0 ~ width/height(px)
                let canvasX = (p1.x / canvasW + 0.5) * canvas.width
                let canvasY = (-p1.y / canvasH + 0.5) * canvas.height
                // if (canvasX >= 0 && canvasX <= canvas.width && canvasY >= 0 && canvasY <= canvas.height) {
                // console.log(canvasX);
                // ctx.fillStyle = "rgb(0 0 200 / 50%)";
                // ctx.fillRect(canvasX, canvasY, 50, 50);

                if (k2 == 0) {
                    gctx.moveTo(canvasX, canvasY);
                }
                else {
                    gctx.lineTo(canvasX, canvasY);
                }

            }
            gctx.closePath();
            // gctx.fillStyle = 'hsla( 0, 0%, 0%, 0.01 )';
            // gctx.fillRect(0, 0, geoCanvas.width, geoCanvas.height);

            // gctx.fillStyle = gradient
            // gctx.fill()
            gctx.lineWidth = 2;
            // gctx.shadowColor = 'red';
            // gctx.shadowBlur = 7;
            gctx.filter = "blur(1.2px)";

            gctx.strokeStyle = gradient
            gctx.stroke()
        }
    }
    function radar_focus_scan() {
        // if (radarScan) window.cancelAnimationFrame(radarScan)
        const center_point = Cesium.Cartesian3.fromDegrees(geoLon, geoLat)
        const center_m = Cesium.Transforms.eastNorthUpToFixedFrame(center_point)   //以 center_point 為中心的局部參考框架，（ENU）坐標系建立
        center_m_inverse = Cesium.Matrix4.inverse(center_m, new Cesium.Matrix4())

        geoCanvas.width = width / 4
        geoCanvas.height = height / 4
        canvas.width = width / 4
        canvas.height = height / 4
        shipCanvas.width = width / 4
        shipCanvas.height = height / 4


        let hueStart = 120
        let hueEnd = 170
        let hueDiff = Math.abs(hueEnd - hueStart)
        let saturation = 50 + 10
        let lightness = 40 + 10

        let gradient = ctx.createLinearGradient(250, 0, 0, 0)
        let padding = 14
        // radar.style.marginLeft = radar.style.marginTop = (-diameter / 2) - padding + 'px';
        // gradient.addColorStop(0, 'hsla( ' + hueStart + ', ' + saturation + '%, ' + lightness + '%, 0.6 )');
        // gradient.addColorStop(1, 'hsla( ' + hueEnd + ', ' + saturation + '%, ' + lightness + '%, 0.1 )');
        let deg = 1
        let sum = 10 / deg
        for (var k = 0; k < sum; k++) {
            let deg_step = k * 1 / sum
            gradient.addColorStop(deg_step, `hsla(${(hueEnd - hueStart) * deg_step + hueStart} , ${saturation}%, 50%, ${deg_step * 0.8})`);
        }
        // gradient.addColorStop(0, `hsla(${hueStart}, ${saturation}%, ${lightStart}%, 0.9)`);
        // gradient.addColorStop(0.5, `hsla(${(hueStart + hueEnd) / 2}, ${saturation}%, 50%, 0.5)`);
        // gradient.addColorStop(1, `hsla(${hueEnd}, ${saturation - 30}%, ${lightEnd}%, 0.1)`);


        // for (var k1 in geoData) {
        //     let coordinates = geoData[k1].geometry.coordinates[0]
        //     // gctx.globalCompositeOperation = 'lighter';
        //     gctx.beginPath()
        //     // ctx.moveTo(0, 0);
        //     for (var k2 in coordinates) {
        //         let lon = coordinates[k2][0]
        //         let lat = coordinates[k2][1]
        //         // console.log(lat);
        //         let origin_p = Cesium.Cartesian3.fromDegrees(lon, lat)
        //         // let position = new THREE.Vector3(
        //         //     p.x - center_point.x,
        //         //     p.y - center_point.y,
        //         //     p.z - center_point.z,
        //         // )
        //         // let origin_p = new THREE.Vector3(p.x, p.y, p.z)
        //         // console.log(center_point.x);
        //         // console.log(p.x);
        //         let p1 = Cesium.Matrix4.multiplyByPoint(center_m_inverse, origin_p, new Cesium.Cartesian3())
        //         // console.log(origin_p);
        //         // console.log(p1);   //東北向移動量值


        //         //畫布座標: 原點左上 0 ~ width/height(px)
        //         let canvasX = (p1.x / canvasW + 0.5) * canvas.width
        //         let canvasY = (-p1.y / canvasH + 0.5) * canvas.height
        //         // if (canvasX >= 0 && canvasX <= canvas.width && canvasY >= 0 && canvasY <= canvas.height) {
        //         // console.log(canvasX);
        //         // ctx.fillStyle = "rgb(0 0 200 / 50%)";
        //         // ctx.fillRect(canvasX, canvasY, 50, 50);

        //         if (k2 == 0) {
        //             gctx.moveTo(canvasX, canvasY);
        //         }
        //         else {
        //             gctx.lineTo(canvasX, canvasY);
        //         }

        //     }
        //     gctx.closePath();
        //     // gctx.fillStyle = 'hsla( 0, 0%, 0%, 0.01 )';
        //     // gctx.fillRect(0, 0, geoCanvas.width, geoCanvas.height);

        //     // gctx.fillStyle = gradient
        //     // gctx.fill()
        //     gctx.lineWidth = 2;
        //     // gctx.shadowColor = 'red';
        //     // gctx.shadowBlur = 7;
        //     gctx.filter = "blur(1.2px)";

        //     gctx.strokeStyle = gradient
        //     gctx.stroke()
        // }



        var centerX = canvas.width / 2
        var centerY = canvas.height / 2
        //外框

        let diameter = 500
        let radius = diameter / 2
        let lineWidth = 2

        let rings = 4
        let sweepAngle = 270
        let sweepSize = all_info.sweepSize
        let sweepSpeed = all_info.sweepSpeed

        // ctx.globalCompositeOperation = 'lighter';
        // renderGrid()    //線
        // renderRings()
        // if (!radarScan) renderSweep()
        renderSweep()
        // renderScanLines()
        // ctx.globalCompositeOperation = 'darker';

        preRender_funcs['radar_sweep'] = renderSweep

        function renderGrid() {
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, canvas.height);
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);

            //斜線 y = x + c1, y = -x + c2 且通過圓心
            let c1 = centerY - centerX
            let c2 = centerY + centerX
            let slope = 1.0
            ctx.moveTo(0, 0 * slope + c1);
            ctx.lineTo(canvas.width, canvas.width * slope + c1);
            ctx.moveTo(canvas.width, canvas.width * -slope + c2);
            ctx.lineTo(0, 0 * -slope + c2);

            // ctx.strokeStyle = 'hsla( ' + ( ( hueStart + hueEnd ) / 2) + ', ' + saturation + '%, ' + lightness + '%, .03 )';
            ctx.strokeStyle = 'hsla( ' + ((hueStart + hueEnd) / 2) + ', ' + saturation + '%, ' + lightness + '%, .2 )';
            ctx.stroke();
        };
        function renderRings() {
            for (var i = 0; i < rings; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, ((radius - (lineWidth / 2)) / rings) * (i + 1), 0, 2 * Math.PI, false);
                // ctx.strokeStyle = 'hsla(' + (hueEnd - (i * (hueDiff / rings))) + ', ' + saturation + '%, ' + lightness + '%, 0.1)';
                ctx.strokeStyle = 'hsla(' + (hueEnd - (i * (hueDiff / rings))) + ', ' + saturation + '%, ' + lightness + '%, 0.5)';
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            };
        }
        function renderSweep() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            // ctx.globalCompositeOperation = 'lighter';


            // ctx.rotate(Math.PI / 2);


            // ctx.globalCompositeOperation = 'destination-out';
            // ctx.fillStyle = 'rgb( 90, 90, 90. 0.1)';
            gctx.fillStyle = 'hsla( 0, 0%, 0%, 0.01 )';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // // ctx.drawImage(geoCanvas, 0, 0);
            // ctx.drawImage(shipCanvas, 0, 0);
            ship_location(images)



            renderGrid()    //線
            renderRings()
            // renderScanLines()

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(sweepAngle * Math.PI / 180);
            // ctx.beginPath();
            // ctx.moveTo(0, 0);
            let deg = 1
            let sum = sweepSize * 2 / deg
            let startDeg = -sweepSize * Math.PI / 180
            for (var k = 0; k < sum; k++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                let deg_step = k * 1 / sum
                let radian = deg * Math.PI / 180
                ctx.arc(0, 0, radius, startDeg + radian * k, startDeg + radian * (k * 1 + 1), false);
                ctx.closePath();
                let color = `hsla(${(hueEnd - hueStart) * deg_step + hueStart} , ${saturation}%, 50%, ${deg_step * 0.8})`;
                ctx.fillStyle = color;
                ctx.fill();
            }
            // ctx.arc(0, 0, radius, -sweepSize * Math.PI / 180, sweepSize * Math.PI / 180, false);
            // ctx.closePath();
            // ctx.fillStyle = gradient;
            // ctx.fill();
            ctx.restore();

            sweepAngle += sweepSpeed;
            sweepAngle = sweepAngle % 360
            all_info.sweepAngle = sweepAngle


            // ctx.rotate(-Math.PI / 2);

            // radarScan = window.requestAnimationFrame(renderSweep);
            // window['render1'] = renderSweep
        }
        function renderScanLines() {
            ctx.beginPath();
            for (var i = 0; i < diameter; i += 2) {
                ctx.moveTo(0, i + .5);
                ctx.lineTo(diameter, i + .5);
            };
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'hsla( 0, 0%, 0%, .02 )';
            ctx.globalCompositeOperation = 'source-over';
            ctx.stroke();
        };
        return renderSweep
    }


    function ship_location(images) {
        spctx.clearRect(0, 0, shipCanvas.width, shipCanvas.height);

        // if (!scan_update) {
        // pos = []
        // for (var k = 0; k < 7; k++) {
        //     let minLon = 121.784
        //     let maxLon = 121.793
        //     let minLat = 25.1487
        //     let maxLat = 25.158
        //     pos.push([Math.random() * (maxLon - minLon) + minLon, Math.random() * (maxLat - minLat) + minLat])
        // }
        // }

        // console.log(pos);
        // console.log("=====");

        for (var k in pos) {
            let lon = pos[k][0]
            let lat = pos[k][1]
            // console.log(lon, lat);
            let origin_p = Cesium.Cartesian3.fromDegrees(lon, lat)
            let p1 = Cesium.Matrix4.multiplyByPoint(center_m_inverse, origin_p, new Cesium.Cartesian3())

            let canvasX = (p1.x / canvasW + 0.5) * canvas.width
            let canvasY = (-p1.y / canvasH + 0.5) * canvas.height

            // let radius = 8
            // spctx.shadowColor = 'white';
            // spctx.shadowBlur = radius - 2; // 模糊半徑
            // var gradient = spctx.createRadialGradient(canvasX, canvasY, 1, canvasX, canvasY, radius);  //中心點(x, y) 起始/結束半徑 2->radius
            // //白色到透明的徑向過度效果
            // gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            // gradient.addColorStop(1, 'rgba(0, 255, 0, 0.0)');

            // spctx.fillStyle = gradient;
            // // spctx.fillStyle = 'white';
            // spctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
            // spctx.closePath();
            // spctx.fill();


            //不規則形狀圖片

            // let px = 10 //Math.random() * 10
            // let py = 15 //Math.random() * 15
            // spctx.translate(canvasX, canvasY);  //畫布中心

            // spctx.beginPath()
            // spctx.moveTo(px, py)
            // spctx.lineTo(px + 5, py + 10)
            // spctx.lineTo(px + 10, py - 20)
            // spctx.lineTo(px - 18, py - 12)

            // spctx.fillStyle = 'white';
            // spctx.fill();
            // spctx.translate(-canvasX, -canvasY);
            let min = Math.ceil(0);
            let max = Math.floor(images.length);
            // // if (!scan_update) {
            // index.push(Math.floor(Math.random() * (max - min)) + min)
            // // console.log(i);
            // scale_.push(5 + 5 * Math.random())
            // rotate_.push(Math.PI * Math.random() * 2)
            // //船點更新...
            // // }
            const deg = Math.atan2(canvasY - 0.5 * canvas.height, canvasX - 0.5 * canvas.width) * 180 / Math.PI;
            if (!vessel[k]) {
                vessel[k] = {
                    angle: deg,
                    opacity: 1,
                    index: Math.floor(Math.random() * (max - min)) + min,
                    scale: 5 + 5 * Math.random(),
                    rotate: Math.PI * Math.random() * 2
                }
            } else {
                vessel[k].deg = deg
                if (Math.abs(vessel[k].deg - all_info.sweepAngle) <= all_info.sweepSpeed + all_info.sweepSize + 1) {
                    vessel[k].opacity = 0.7
                }
                vessel[k].opacity *= 0.99
            }
            // console.log(vessel);
            // console.log(vessel[k].deg);

            if (k == 0) {
                // console.log(vessel[k].deg);
                // console.log(all_info.sweepAngle);
                // console.log(vessel[k].opacity);

                // console.log('===============');
            }


            spctx.save()
            spctx.globalAlpha = vessel[k].opacity
            // spctx.clearRect(0, 0, shipCanvas.width, shipCanvas.height);
            spctx.translate(canvasX, canvasY)  //旋轉中心
            spctx.rotate(vessel[k].rotate);
            spctx.filter = `hue-rotate(0deg) grayscale(0%) brightness(50%))`;  //色相、灰度、
            spctx.drawImage(images[vessel[k].index], -vessel[k].scale * 0.5, -vessel[k].scale * 0.5, vessel[k].scale, vessel[k].scale)
            // recolor
            // spctx.fillStyle = 'white'
            // spctx.globalCompositeOperation = "source-in"
            // spctx.fillRect(-scale_[k] * 0.5, -scale_[k] * 0.5, scale_[k], scale_[k])
            spctx.restore()
        }
        // gctx.drawImage(shipCanvas, 0, 0);
        // spctx.globalAlpha = 1.0;
        ctx.drawImage(shipCanvas, 0, 0);

    }

    function render() {
        requestAnimationFrame(render)

        for (var k in preRender_funcs) {
            preRender_funcs[k]()
        }

        if (scan_update) {
            radar_update_pos()
            ship_location(images)
            scan_update = false
        }
    }

    // window['render_scan'] = radar_focus_scan()
    // window['render'] = function () {
    //     if (scan_update) {
    //         radar_update_pos()
    //         ship_location(images)
    //         scan_update = false
    //     }
    // }
}


// })
