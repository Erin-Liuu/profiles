var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/main_profile', (req, res) => {
    res.render('main_profile.html', {
        version: "v1.0",
    });
})

module.exports = router;