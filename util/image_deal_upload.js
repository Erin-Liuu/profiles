const fs = require('fs')
// const General = require("./calculate/General.js")
const Cesium = require('cesium')

function upload(data, dir, list_length) {
    return new Promise(async function (resolve, reject) {
        //過期圖片檢查
        const files = fs.readdirSync(dir);
        if (files.length > list_length) {
            const fileStats = await Promise.all(
                files.map(async (file) => {
                    const filePath = dir + file;
                    fs.unlinkSync(filePath);
                    // const stats = fs.statSync(filePath);
                    // return { filePath, mtime: stats.mtime };
                })
            );

            // 新到舊
            // fileStats.sort((a, b) => b.mtime - a.mtime);
            // // console.log(fileStats);
            // const filesToDelete = fileStats.slice(list_length - 1);
            // for (var k in filesToDelete) {
            //     fs.unlinkSync(filesToDelete[k].filePath);
            // }
        }

        var d_ = new Date();
        let new_name_pre = 'draw_uplaod_'
        // var newFileName = new_name_pre + (((d_.getTime()) / 1000).toFixed(0) * 1);
        var newFileName = new_name_pre + d_.getTime();

        const fileName = dir + newFileName + '.png'
        fs.writeFile(fileName, data, err => {
            if (err) {
                resolve({ success: false })
            } else {
                resolve({ success: true, url: newFileName + '.png' })
            }
        })

    })
}
function clean_files(path) {
    return new Promise(async function (resolve, reject) {
        if (fs.existsSync(path)) {
            if (fs.statSync(path).isDirectory()) {
            } else {
                // console.log(path);
                fs.unlinkSync(path);
            }
        }
        resolve()
    })
}

module.exports = {
    upload,
    clean_files
}