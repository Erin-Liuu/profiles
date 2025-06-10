import * as draw_manage from './draw_manage.js'

all_init()
function all_init() {
    dom_listen()
    init()
    function init() {
        let objs_for_init = {
            document,
        };

        draw_manage.init(objs_for_init)

        let that = document.getElementById('control_add')
        draw_manage.set_listen_func(that)

        //TODO多人協作
    }

    function dom_listen() {
        //塗鴉
        $("#control_add").on('change', function () {
            draw_manage.set_listen_func(this)
        })
        $("#draw_color").on('change', function () {
            draw_manage.draw_color_func(this)
        })
        $("#draw_lineWidth").on('change', function () {
            draw_manage.draw_lineWidth_func(this)
        })
        $("#add_pen").on('click', function () {
            $(".add_shape").val('-1');
            $(".add_shape").trigger('change')
            draw_manage.addCanvasInit()
        })
        $(".add_shape").on('change', function () {
            draw_manage.draw_shape_func(this)
            draw_manage.addShapeInit()
        })
        $("#undo").on('click', function () {
            draw_manage.undo_canvas_func()
        })
        $("#clear").on('click', function () {
            draw_manage.clear_canvas_func()
        })


        $("#toggleBtn").on("click", function () {
            $("#sidePanel").toggleClass("collapsed");

            // 切換箭頭圖示
            if ($("#sidePanel").hasClass("collapsed")) {
                $(".toggle-img").css("transform", "rotate(180deg)");
            } else {
                $(".toggle-img").css("transform", "rotate(0deg)");
            }
        })
    }
}
