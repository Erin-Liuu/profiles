var express = require('express');
var router = express.Router();

var fs = require('fs');
// const path = require('path');
// // const axios = require("axios");
const formidable = require('formidable');
const $global = require("../util/global.js");
const ERROR_CODE = {
    FILE_WRONG: 0, // 上傳流程錯誤 (formidable)
    NONE_FILE: 1, // 空檔案(大小為0)
    SYSTEM_WRONG: 2, // 系統流程錯誤 (fs)
    COMPRESS_WRONG: 3, // 解壓縮流程錯誤 (compress)
    PROCESS_WRONG: 4, // 不符合設定的流程 (ex. zip檔中檔案格式有誤)
    GEOJSON_WRONG: 5, // geojson解析出錯
    SHAPEFILE_WRONG: 6, // shapefile解析出錯
    WRONG_FILE_TYPE: 7, // 錯誤的檔案格式，通常會在前端就可以擋掉
    WRONG_FILE_CONTENT: 8, // 檔案內容有誤，像是圖標的excel中資料不合格式
    GLB_TO_IMG_WRONG: 9, // glb生成圖片錯誤
    EXCEL_WRONG: 10, // excel解析出錯
}
$global.set('ERROR_CODE', ERROR_CODE)

const image_deal = require('../util/image_deal_upload.js')


router.post('/upload_draw_image', async function (req, res) {
    let data = req.body.data
    const list_length = req.body.list_length
    // 二進制
    const base64Data = data.replace(/^data:image\/png;base64,/, "");
    const binaryData = Buffer.from(base64Data, 'base64');

    const dir = './upload/temp/drawImage/'

    image_deal.upload(binaryData, dir, list_length).then(function (result) {
        if (!result.success) {
            res.send({ success: false })
        } else {
            res.send({ success: true, data: { url: result.url } })
        }
    })
})
router.post('/clean_draw_image', function (req, res) {
    const path = req.body.data

    image_deal.clean_files(path).then(function () {
        res.send({})
    })
})

module.exports = router;