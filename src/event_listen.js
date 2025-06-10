import * as THREE from 'three';

import { MOUSE_TYPE, POINT_TYPE, TOUCH_TYPE } from './event_listen_constants.js'


let scene = null;
let camera = null;
let renderer = null;

let collection = {}
let enabled_collection = {}

function init(option) {
    scene = option.scene
    camera = option.camera
    renderer = option.renderer

    // start_listen()
}

class build {
    constructor({
        dom = renderer.domElement,
        type = MOUSE_TYPE.DOWN, //MOUSE_TYPE.LEFT_CLICK,
        enabled = false,
        objects = null,
        callback = function () { }
    }) {
        this.dom = dom
        this.type = type
        this.enabled = enabled
        this.objects = objects
        this.callback = callback

        this.destroyed = false

        if (!collection[this.type]) collection[this.type] = []
        collection[this.type].push(this)

        this.toggle(this.enabled)
        this.start_listen()
    }
    start_listen() {
        let that = this
        let typeIndex = Math.floor(that.type / Object.keys(MOUSE_TYPE).length)

        // console.log(typeIndex);
        if (typeIndex == 0) {
            that.downListen = function (event) {
                if (event.button == 0) {
                    let x = event.offsetX
                    let y = event.offsetY
                    for (var k in enabled_collection[MOUSE_TYPE.DOWN]) {
                        let d = enabled_collection[MOUSE_TYPE.DOWN][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.upListen = function (event) {
                if (event.button == 0) {
                    for (var k in enabled_collection[MOUSE_TYPE.UP]) {
                        let d = enabled_collection[MOUSE_TYPE.UP][k]
                        if (d.enabled && !d.objects)
                            d.callback(event)
                    }
                }
            }
            that.moveListen = function (event) {
                if (event.button == 0) {
                    let x = event.offsetX
                    let y = event.offsetY
                    for (var k in enabled_collection[MOUSE_TYPE.MOVE]) {
                        let d = enabled_collection[MOUSE_TYPE.MOVE][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.dom.addEventListener('mousedown', that.downListen)
            that.dom.addEventListener('mouseup', that.upListen)
            that.dom.addEventListener('mousemove', that.moveListen)
        }
        else if (typeIndex == 1) {
            that.downListen = function (event) {
                if (event) {
                    let x = event.offsetX
                    let y = event.offsetY
                    for (var k in enabled_collection[POINT_TYPE.DOWN]) {
                        let d = enabled_collection[POINT_TYPE.DOWN][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.upListen = function (event) {
                if (event) {
                    let x = event.offsetX
                    let y = event.offsetY
                    for (var k in enabled_collection[POINT_TYPE.UP]) {
                        let d = enabled_collection[POINT_TYPE.UP][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.moveListen = function (event) {
                if (event) {
                    let x = event.offsetX
                    let y = event.offsetY
                    for (var k in enabled_collection[POINT_TYPE.MOVE]) {
                        let d = enabled_collection[POINT_TYPE.MOVE][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.dom.addEventListener('pointerdown', that.downListen)
            that.dom.addEventListener('pointerup', that.upListen)
            that.dom.addEventListener('pointermove', that.moveListen)
        }
        else if (typeIndex == 2) {
            that.downListen = function (event) {
                if (event) {
                    let x = event.touches[0].clientX
                    let y = event.touches[0].clientY
                    for (var k in enabled_collection[TOUCH_TYPE.DOWN]) {
                        let d = enabled_collection[TOUCH_TYPE.DOWN][k]

                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.upListen = function (event) {
                if (event) {
                    for (var k in enabled_collection[TOUCH_TYPE.UP]) {
                        let d = enabled_collection[TOUCH_TYPE.UP][k]
                        if (d.enabled && !d.objects)
                            d.callback(event)
                    }
                }
            }
            that.moveListen = function (event) {
                if (event) {
                    let x = event.touches[0].clientX
                    let y = event.touches[0].clientY
                    for (var k in enabled_collection[TOUCH_TYPE.MOVE]) {
                        let d = enabled_collection[TOUCH_TYPE.MOVE][k]
                        if (d.enabled && !d.objects)
                            d.callback(event, x, y)
                    }
                }
            }
            that.dom.addEventListener('touchstart', that.downListen)
            that.dom.addEventListener('touchend', that.upListen)
            that.dom.addEventListener('touchmove', that.moveListen)
        }
    }
    toggle(flag) {
        if (this.enabled == flag) return;
        this.enabled = flag
        enabled_update(this.type)
    }
    destroy() {
        let that = this
        this.destroyed = true
        // destroy_update(this.type)
        let typeIndex = Math.floor(this.type / Object.keys(MOUSE_TYPE).length)

        // console.log('remove');
        // console.log(typeIndex);
        if (typeIndex == 0) {
            this.dom.removeEventListener('mousedown', that.downListen)
            this.dom.removeEventListener('mouseup', that.upListen)
            this.dom.removeEventListener('mousemove', that.moveListen)
        }
        else if (typeIndex == 1) {
            this.dom.removeEventListener('pointerdown', that.downListen)
            this.dom.removeEventListener('pointerup', that.upListen)
            this.dom.removeEventListener('pointermove', that.moveListen)
        }
        else if (typeIndex == 2) {
            this.dom.removeEventListener('touchstart', that.downListen)
            this.dom.removeEventListener('touchend', that.upListen)
            this.dom.removeEventListener('touchmove', that.moveListen)
        }
    }
}

function enabled_update(type) {
    enabled_collection[type] = []
    for (var k in collection[type]) {
        if (collection[type][k].enabled) {
            enabled_collection[type].push(collection[type][k])
        }
    }
}
function destroy_update(type) {
    if (!collection[type]) return;

    for (var i = collection[type].length - 1; i >= 0; i--) {
        if (collection[type][i].destroyed) {
            collection[type][i] = null
            collection[type].splice(i, 1)
        }
    }
}


export {
    init,
    build,
};