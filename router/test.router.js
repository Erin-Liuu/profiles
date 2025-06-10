var express = require('express');
var fs = require('fs');
var router = express.Router();

let player_id = 0;

router.get('/graffiti_wall', function (req, res) {
    res.render('graffiti_wall.html', {
        ver: '1.0',
        player_id: player_id + 1,
    });
    player_id = (player_id + 1) % 99;
})


module.exports = router;
