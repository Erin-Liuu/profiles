var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/noise', (req, res) => {
    res.render('noise.html', {
        version: "v1.0",
    });
})

module.exports = router;