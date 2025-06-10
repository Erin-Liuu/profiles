let window_flag = {
    debug: false,
}
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';



window['call_window_func'] = function (func_name, params) {
    if (window_func[func_name]) window_func[func_name](params)
}
let window_func = {}


const all_info = {
    text_obj: null
}

// require.config({
//     baseUrl: "",
//     paths: {
//         "jquery": "/include/jquery@3.3.1/jquery.min",
//     },
// });
// require([
//     'jquery',
// ], function (
// $,
// ) {
let scene = null;
let renderer = null;

let camera = null;
let cameraControl = null;

let preRender_funcs = {}

let skybox = null
let box = null
let trench = null
let backBox = null

let quat = null;
let group = new THREE.Group()
let textureLoader = new THREE.TextureLoader();
let clock = new THREE.Clock()

let font = null
let font_list = {}
const font_url = '../media/font/Microsoft_JhengHei_Regular.json'
let text_info = {
    size: 100,
    height: 20,

    curveSegments: 4,
    bevelThickness: 2,
    bevelSize: 1.5,
    bevelEnabled: true,
}

let gui = null
//消融效果參數
let dissolve_flag = false
let count = 0
let test_flag = false
const params = {
    edgeColor: 'rgb(0, 255, 255)',//0xd27b00,
    scale: 1,
    threshold: 0.0,
    edgeWidth: 0.03,
    edgeBrightness: 2.0
};

window_func["update_dissolve_effect"] = function (flag) {
    // console.log(all_info.text_obj);
    box.visible = true
    // all_info.text_obj.visible = true
    if (all_info.text_obj) {
        all_info.text_obj.material.opacity = 1
    }

    let value = all_info.text_obj?.material.userData.shader.uniforms.threshold.value
    // console.log(value);

    if (value > 0 && value < 1) return
    // view_deal(0, true)
    view_deal(0, flag)

    console.log(camera.position);
    console.log(cameraControl.target);
}


async function init() {
    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        console.log(keyCode);
        switch (keyCode) {
            case 66: //B
                console.log('B');
                weapon_deal(5, true)
                break;
            case 78: //N
                console.log('N');
                break;
            case 83: //S
                console.log('S');
                break;
            case 68: //D
                console.log('D');
                break;
            case 76: //L
                console.log('L');
                break;
            case 75: //K
                console.log('K');
                break;
            case 84: //T
                console.log('T');
                break;
            case 89: //Y
                console.log('Y');
                break;
            case 90: //Z
                test_flag = !test_flag
                // view_deal(0, test_flag)
                view_deal(0, true)
                break;
            default:
                break;
        }
    }

    scene = new THREE.Scene()

    // renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true })
    renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight) // 場景大小
    // renderer.setClearColor(0x000, 1.0) // 預設背景顏色
    renderer.setClearColor(0xffffff, 1.0) // 預設背景顏色
    // renderer.shadowMap.enable = true // 陰影效果
    // renderer.sortObjects = false; //渲染順序
    // renderer.localClippingEnabled = true;

    // 測試解析度調整
    // const renderer = new THREE.WebGLRenderer({canvas, antialias:true})
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    addEventListener('resize', onWindowResize)

    // 測試解析度調整 END

    // 將渲染器的 DOM 綁到網頁上
    // document.body.appendChild(renderer.domElement)
    document.getElementById("threeContainer").appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100000
    )


    // camera.position.set(100, 100, 100) // 相機位置
    camera.position.set(
        -60.62014792134313,
        42.690824096257764,
        455.4427305664552
    ) // 相機位置

    cameraControl = new OrbitControls(camera, renderer.domElement)
    cameraControl.enableDamping = true // 啟用阻尼效果
    cameraControl.dampingFactor = 0.25 // 阻尼系數
    // cameraControl.target.set(0, 0, 0)
    cameraControl.target.set(
        -36.70278459863517,
        49.89927575397669,
        -4.348869831157332
    )

    skybox = new THREE.CubeTextureLoader()
        .setPath('/media/img/skybox/sky/')
        .load([
            'right.jpg',
            'left.jpg',
            'top.jpg',
            'bottom.jpg',
            'front.jpg',
            'back.jpg',
        ]);
    // scene.background = skybox   //no material
    // console.log(skybox); 
    var textureLoader = new THREE.TextureLoader().setPath('/media/img/skybox/sky/')
    var texture0 = textureLoader.load('right.jpg');
    var texture1 = textureLoader.load('left.jpg');
    var texture2 = textureLoader.load('top.jpg');
    var texture3 = textureLoader.load('bottom.jpg');
    var texture4 = textureLoader.load('front.jpg');
    var texture5 = textureLoader.load('back.jpg');
    texture0.colorSpace = THREE.SRGBColorSpace
    texture1.colorSpace = THREE.SRGBColorSpace
    texture2.colorSpace = THREE.SRGBColorSpace
    texture3.colorSpace = THREE.SRGBColorSpace
    texture4.colorSpace = THREE.SRGBColorSpace
    texture5.colorSpace = THREE.SRGBColorSpace
    // console.log(texture5);
    // var materials = new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture0 })
    var materials = [
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture0 }),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture1 }),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture2 }),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture3 }),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture4 }),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: texture5 })
    ];
    let scalar = 100000
    var geometry = new THREE.BoxGeometry(scalar, scalar, scalar)
    box = new THREE.Mesh(
        geometry,
        materials
    )
    // let scalar = 100000
    // box.scale.setScalar(scalar);
    box.position.set(0, -100, 0)


    //距離
    let maxYDis = 0
    let minYDis = 0
    let temp_v = new THREE.Vector3()
    // let startPoint = new THREE.Vector3().copy(box.position)

    // startPoint.applyMatrix4(box.matrixWorld)
    // console.log(startPoint);
    let pos = geometry.attributes.position
    for (var k = 0; k < pos.array.length; k += 3) {
        let positionWC = temp_v.set(pos.array[k], pos.array[k + 1], pos.array[k + 2]).applyMatrix4(box.matrixWorld)
        let disY = positionWC.y
        maxYDis = Math.max(maxYDis, disY)
        minYDis = Math.min(minYDis, disY)
    }

    textureLoader = new THREE.TextureLoader()
    for (var k in box.material) {
        // console.log(k);
        // console.log(materials[k].onBeforeCompile);

        box.material[k].onBeforeCompile = function (shader) {
            shader.uniforms['edgeColor'] = { value: new THREE.Color(params.edgeColor) }
            shader.uniforms['edgeWidth'] = { value: 0.02 }
            shader.uniforms['edgeBrightness'] = { value: 2.0 }
            shader.uniforms['threshold'] = { value: params.threshold }
            shader.uniforms['mainTex'] = { value: box.material[k].map }
            shader.uniforms['noiseTex'] = { value: textureLoader.load('../media/img/noise.png') }//"https://i.postimg.cc/y8mHLC8Z/noise-2.png") }
            shader.uniforms['maxYDistance'] = { value: maxYDis }
            shader.uniforms['minYDistance'] = { value: minYDis }


            // let fs = shader.fragmentShader.split('void main() {')
            // let vs = shader.vertexShader.split('void main() {')
            // fs[0] += `
            // uniform float threshold;
            // uniform float edgeWidth;
            // uniform float edgeBrightness;
            // uniform vec3 edgeColor;

            // uniform sampler2D mainTex;      // 獲取紋理
            // uniform sampler2D noiseTex;    // 需要使用的噪点圖片

            // varying vec2 vUv;
            // void main() {
            //     vec4 color = texture2D(mainTex, vUv);

            //     vec4 noiseValue = texture2D(noiseTex, vUv);
            //     // 噪點圖片中該處點的顏色值(r, g, b, a)，r == g == b

            //     if(noiseValue.r < threshold)
            //     {
            //             discard;
            //     }

            //     if(noiseValue.r - edgeWidth < threshold){
            //             color = vec4(edgeColor, 1.0);
            //     }
            //     gl_FragColor += color;
            // `


            let fs = shader.fragmentShader.split('void main() {')
            let vs = shader.vertexShader.split('void main() {')

            fs[0] += `
                uniform float threshold;
                uniform float edgeWidth;
                uniform float edgeBrightness;
                uniform float maxYDistance;
                uniform float minYDistance;
                uniform vec3 edgeColor;

                uniform sampler2D mainTex;      // 獲取紋理
                uniform sampler2D noiseTex;    // 需要使用的噪点圖片

                varying vec2 vUv;
                varying vec3 positionWC;
                void main() {
                `
            vs[0] += `
                varying vec2 vUv;
                varying vec3 positionWC;
                void main() {
                    vUv = uv; 
                    positionWC = (modelMatrix * vec4(position, 1.0)).xyz;
                `
            fs = fs[0] + fs[1]
            vs = vs[0] + vs[1]

            fs = fs.split('}')
            fs[fs.length - 2] += `
                vec4 color = texture2D(mainTex, vUv);

                vec4 noiseValue = texture2D(noiseTex, vUv);
                // 噪點圖片中該處點的顏色值(r, g, b, a)，r == g == b

                float range = maxYDistance - minYDistance;
                float border = maxYDistance;
                float distance = abs(positionWC.y - border);
                
                float disEffect = mix(noiseValue.r, distance / range, 0.5);
                disEffect = clamp(disEffect, 0.0, 1.0);

                if(disEffect < threshold)  
                {
                        discard;
                }

                if(disEffect - edgeWidth < threshold){
                        color = vec4(edgeColor, 1.0);
                        gl_FragColor += color;
                }
                `
            fs = fs.join('}')

            shader.vertexShader = vs
            shader.fragmentShader = fs//fs[0] + fs[1]
            this.userData.shader = shader

        };
        box.material[k].needsUpdate = true;

    }
    console.log(box.material);
    // box = new THREE.Mesh(
    //     goemetry,
    //     materials
    // )
    // // let scalar = 100000
    // // box.scale.setScalar(scalar);
    // box.position.set(0, -100, 0)
    scene.add(box);
    console.log(box);
    box.updateMatrix()
    box.updateMatrixWorld()
    box.visible = false

    //背板
    let planeMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide,
        transparent: true,
        opacity: 1.0
    })
    backBox = new THREE.Mesh(
        new THREE.BoxGeometry(scalar * 1.2, scalar * 1.2, scalar * 1.2),
        planeMat
    )
    scene.add(backBox)

    let light = new THREE.AmbientLight(0xffffff, 3); // white light
    scene.add(light);

    var planeGeometry = new THREE.PlaneGeometry(1000, 1000)
    var planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    })
    let bottom_plane = new THREE.Mesh(planeGeometry, planeMaterial)
    bottom_plane.rotation.x = -0.5 * Math.PI // 使平面與 y 軸垂直，並讓正面朝上
    bottom_plane.position.set(0, 0, 0)
    // scene.add(bottom_plane);


    //js初始化
    let objs_for_init = {
        renderer, scene, camera, cameraControl,
    }
    // three_load_gltf.init(objs_for_init)


    if (window_flag.debug) {
        gui = new GUI()
        initGUI()
    }

    let text_obj = await add_text("Hello, I'm Evie")
    // text_obj.visible = false
    text_obj.material.transparent = true
    text_obj.material.opacity = 0

    console.log(text_obj);
    scene.add(text_obj)
    all_info.text_obj = text_obj

}
function initGUI() {
    // gui.addColor(params, "edgeColor");
    // gui.add(params, "scale", 0.1, 1);
    gui.add(params, "threshold", 0.0, 1.0).step(0.01);
}
function view_deal(type, flag) {
    switch (type) {
        case 0:
            dissolve_flag = true
            // visible = flag
            // trench.visible = flag
            // box.visible = flag
            // backBox.material.opacity = 1
            count = 0
            if (flag) {
                params.threshold = 1.0
            }
            else {
                params.threshold = 0.0
            }
            break
    }
}
async function add_text(text) {
    if (!font_list[font_url]) font = await load_font(font_url)
    console.log(font);

    let geometry = new TextGeometry(text, {
        font: font,
        size: text_info.size,
        height: text_info.height,
        curveSegments: text_info.curveSegments,
        bevelThickness: text_info.bevelThickness,
        bevelSize: text_info.bevelSize,
        bevelEnabled: true,
    });

    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

    let material = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        flatShading: true,
    });
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(centerOffset, 0, 0)

    // mesh.rotation.x = 0;
    // mesh.rotation.y = 0.5 * Math.PI;
    dissolve_effect(mesh)


    return mesh;
}
function load_font(font_url_) {
    return new Promise((resolve, reject) => {
        const text_loader = new FontLoader();
        text_loader.load(font_url_,
            function (font) {
                resolve(font)
            })
    })
}
function dissolve_effect(obj) {

    let temp_v = new THREE.Vector3()
    let startPoint = new THREE.Vector3().copy(obj.position)

    let maxDis = 0    //距離
    obj.traverse((o) => {
        if (o.isMesh) {
            let pos = o.geometry.attributes.position
            startPoint.applyMatrix4(o.matrixWorld)
            // console.log(startPoint);
            for (var k = 0; k < pos.array.length; k += 3) {
                let positionWC = temp_v.set(pos.array[k], pos.array[k + 1], pos.array[k + 2]).applyMatrix4(o.matrixWorld)
                let dis = positionWC.distanceTo(startPoint)
                maxDis = Math.max(maxDis, dis)
            }
        }
    })

    obj.traverse((o) => {
        if (o.isMesh) {
            // console.log(o.material);
            o.material.onBeforeCompile = function (shader) {
                // console.log(shader);
                // return
                shader.uniforms['edgeColor'] = { value: new THREE.Color(params.edgeColor) }
                shader.uniforms['edgeWidth'] = { value: 0.02 }
                shader.uniforms['edgeBrightness'] = { value: 2.0 }
                shader.uniforms['threshold'] = { value: params.threshold }
                shader.uniforms['mainTex'] = { value: o.material.map }
                shader.uniforms['noiseTex'] = { value: textureLoader.load('../media/img/noise.png') }//"https://i.postimg.cc/y8mHLC8Z/noise-2.png") }
                shader.uniforms['startPoint'] = { value: startPoint }
                shader.uniforms['maxDistance'] = { value: maxDis }

                let fs = shader.fragmentShader.split('void main() {')
                let vs = shader.vertexShader.split('void main() {')

                fs[0] += `
                    uniform float threshold;
                    uniform float edgeWidth;
                    uniform float edgeBrightness;
                    uniform float maxDistance;
                    uniform vec3 edgeColor;
                    uniform vec3 startPoint;

                    uniform sampler2D mainTex;      // 獲取紋理
                    uniform sampler2D noiseTex;    // 需要使用的噪点圖片

                    varying vec2 vUv;
                    varying vec3 positionWC;
                    void main() {
                    `
                vs[0] += `
                    attribute vec2 uv_;
                    varying vec2 vUv;
                    varying vec3 positionWC;
                    // varying vec3 vPos;
                    void main() {
                        vUv = uv_;
                        positionWC = (modelMatrix * vec4(position, 1.0)).xyz;
                    `
                fs = fs[0] + fs[1]
                vs = vs[0] + vs[1]

                fs = fs.split('}')
                fs[fs.length - 2] += `
                    vec4 color = texture2D(mainTex, vUv);

                    vec4 noiseValue = texture2D(noiseTex, vUv);
                    // 噪點圖片中該處點的顏色值(r, g, b, a)，r == g == b

                    float distance = distance(positionWC, startPoint);
                    
                    float disEffect = 1.0 - mix(noiseValue.r, distance / maxDistance, 0.5);
                    disEffect = clamp(disEffect, edgeWidth, 1.0);
                    if(disEffect < threshold)  //noiseValue.r
                    {
                            discard;
                    }

                    if(disEffect - edgeWidth < threshold){
                            color = vec4(edgeColor, 1.0);
                            gl_FragColor += color;
                    }
                    // gl_FragColor = vec4(vUv, 0, 1);
                    `
                fs = fs.join('}')
                // console.log(fs);

                shader.vertexShader = vs
                shader.fragmentShader = fs
                this.userData.shader = shader
            };
            // console.log(o);
            o.material.needsUpdate = true;
        }
    })
}

function render() {
    let delta = clock.getDelta()
    // const ts = performance.now();
    // count++

    // console.log(delta);
    // console.log(ts);
    requestAnimationFrame(render)
    for (var k in preRender_funcs) preRender_funcs[k]()

    if (dissolve_flag) {
        let sign = 1
        if (params.threshold == 1) sign = -1
        count++

        let v = params.threshold + (count / 500) * sign
        for (var k in box.material) {
            if (box.material[k].userData.shader) {
                let shader = box.material[k].userData.shader
                // shader.uniforms.threshold.value = params.threshold
                shader.uniforms.threshold.value = v
            }
        }
        if (all_info.text_obj)
            all_info.text_obj.traverse((o) => {
                if (o.isMesh && o.material.userData.shader) {
                    o.material.userData.shader.uniforms.threshold.value = v
                }
            })


        if (v < 0) {
            dissolve_flag = false
            params.threshold = 0
        }
        else if (v > 1) {
            dissolve_flag = false
            params.threshold = 1
        }
    }

    // let shader
    // for (var k in box.material) {
    //     if (box.material[k].userData.shader) {
    //         shader = box.material[k].userData.shader
    //         // console.log(k);
    //         // console.log(shader);
    //         // shader.uniforms.threshold.value = params.threshold
    //         // if (params.threshold == 1) sign = -1
    //         shader.uniforms.threshold.value = params.threshold + (count / 300) * sign
    //     }
    // }
    // if (shader && shader.uniforms.threshold.value >= 1)
    //     backBox.material.opacity -= count / 10000



    cameraControl.update() // 需設定 update
    renderer.render(scene, camera)
}

init()
render()
// })
