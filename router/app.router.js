require('dotenv').config();
var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/main_profile', (req, res) => {
    res.render('main_profile.html', {
        version: "v1.0",
    });
})

router.post("/weather", async (req, res) => {
    try {
        const apiKey = process.env.API_KEY
        // const response = await fetch("https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=" + apiKey + "&StationId=466940&WeatherElement=", {
        const response = await fetch("https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-049?Authorization=" + apiKey, {
        // const response = await fetch("https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-B0075-002?Authorization=" + apiKey + "&StationID=C6B01", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.send({ success: true, data })

    } catch (error) {
        console.log(error);

    }
});

module.exports = router;