var express = require('express');
var fs = require('fs');
var router = express.Router();


router.get('/graffiti_wall', function (req, res) {
    res.render('graffiti_wall.html', {
        ver: '1.0',
    });
})


module.exports = router;
