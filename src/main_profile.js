
let home_iframe = document.getElementById("home_iframe")

$(document).ready(function () {
    dom_listen()
})

function dom_listen() {
    $(".about-description").eq(2).addClass("active")
    $(".timeline-dot").eq(2).addClass("active")
    $(".timeline-item").hover(function () {
        let index = $(this).index(".timeline-item") * 1
        // console.log(index);

        $(".about-description").removeClass("active");
        let target = $(".about-description").eq(index)
        target.addClass("active")
        $(".timeline-dot").removeClass("active");
        let target_ = $(".timeline-dot").eq(index)
        target_.addClass("active")
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

    $(".copy_email").on("click", function (e) {
        e.preventDefault();
        const email = "kccmewal@gmail.com";

        navigator.clipboard.writeText(email).then(() => {
            alert("信箱已複製到剪貼簿！");
        }).catch(err => {
            console.error("複製失敗", err);
        });
    })

    $(window).on('scroll', function () {
        const triggerTop = $('#about').offset().top;
        const triggerbottom = triggerTop + $('#about').outerHeight();
        const scrollTop = $(window).scrollTop();
        const header = $('.nav-links');

        if (scrollTop >= triggerTop - 50 && scrollTop <= triggerbottom) {
            header.css('color', 'black');
        } else {
            header.css('color', 'white');
        }
    });

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
}