
let home_iframe = document.getElementById("home_iframe")

$(document).ready(function () {
    dom_listen()
})

function dom_listen() {
    $(".timeline-item").hover(function () {
        let index = $(this).index(".timeline-item") * 1
        // console.log(index);

        $(".skill-description").removeClass("active");
        let target = $(".skill-description").eq(index)
        target.addClass("active")
    })

    $(".main-menu a").on("click", function () {
        let index = $(this).index(".main-menu a") * 1

        $(".main-menu a").removeClass("active");
        const target = $(".main-menu a").eq(index)
        const topOffset = target.getBoundingClientRect().top + window.scrollY;
        // target.scrollIntoView({ behavior: "smooth" })
        window.scrollTo({ top: topOffset, behavior: "smooth" });

        target.addClass("active")
    })

    $("#home_iframe").on("load", function () {
        let iframeDoc = $("#home_iframe").contents(); // 取得 iframe 內部的 document
        setTimeout(function () {
            if (
                home_iframe
                && home_iframe.contentWindow
                && home_iframe.contentWindow.call_window_func
            ) {
                home_iframe.contentWindow.call_window_func("update_dissolve_effect", true)
            }
        }, 500)

        iframeDoc.on("mouseenter", function (event) {
            if (
                home_iframe
                && home_iframe.contentWindow
                && home_iframe.contentWindow.call_window_func
            ) {
                home_iframe.contentWindow.call_window_func("update_dissolve_effect", true)
            }
        });
    });
    // $("#home_iframe").hover(function () {
    //     if (
    //         home_iframe
    //         && home_iframe.contentWindow
    //         && home_iframe.contentWindow.call_window_func
    //     ) {
    //         home_iframe.contentWindow.call_window_func("update_dissolve_effect", true)
    //     }

    // })
}