/*eslint-env node*/
'use strict';
var folderInit = require('./util/folderInit.js')
// const pgControl = require('./util/pg.controller.js');
folderInit.init().then(function () {
    (function () {
        require('dotenv').config();
        var express = require('express');
        var compression = require('compression');
        var fs = require('fs');
        // var url = require('url');
        // const http = require('http');
        // var request = require('request');
        // var schedule = require('node-schedule');
        var bodyParser = require('body-parser');
        // 
        // var formidable = require('formidable');
        // var path = require('path');
        // let ejs = require('ejs');
        let $global = require('./util/global');
        // var gzipHeader = Buffer.from('1F8B08', 'hex');

        var session = require('express-session');

        let yargs = require('yargs').options({
            'port': {
                // 'default': 9999,
                'default': process.env.PORT || 20080,
                'description': 'Port to listen on.'
            },
            'public': {
                'type': 'boolean',
                'description': 'Run a public server that listens on all interfaces.'
            },
        });
        let argv = yargs.argv;




        // eventually this mime type configuration will need to change
        // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
        // *NOTE* Any changes you make here must be mirrored in web.config.
        var mime = express.static.mime;
        mime.define({
            'application/json': ['czml', 'json', 'geojson', 'topojson'],
            'application/wasm': ['wasm'],
            'image/crn': ['crn'],
            'image/ktx': ['ktx'],
            'model/gltf+json': ['gltf'],
            'model/gltf-binary': ['bgltf', 'glb'],
            'application/octet-stream': ['b3dm', 'pnts', 'i3dm', 'cmpt', 'geom', 'vctr'],
            'text/plain': ['glsl']
        }, true);


        var app = express();
        // const server0 = http.createServer(app);
        app.set('view engine', 'ejs'); //使用ejs作為動態模板
        app.use(compression());
        // 添加 body-parser 中间件就可以了
        app.use(bodyParser.urlencoded({
            extended: false
        }));
        app.use(bodyParser.json());
        app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });


        app.use(session({
            secret: 'secret', // 對session id 相關的cookie 進行簽名
            resave: true,
            saveUninitialized: false, // 是否儲存未初始化的會話
            cookie: {
                maxAge: 1000 * 60 * 30, // 設定 session 的有效時間，單位毫秒
            },
        }));

        // function checkGzipAndNext(req, res, next) {
        //     var reqUrl = url.parse(req.url, true);
        //     var filePath = reqUrl.pathname.substring(1);

        //     var readStream = fs.createReadStream(filePath, {
        //         start: 0,
        //         end: 2
        //     });
        //     readStream.on('error', function (err) {
        //         next();
        //     });

        //     readStream.on('data', function (chunk) {
        //         if (chunk.equals(gzipHeader)) {
        //             res.header('Content-Encoding', 'gzip');
        //         }
        //         next();
        //     });
        // }

        // var knownTilesetFormats = [/\.b3dm/, /\.pnts/, /\.i3dm/, /\.cmpt/, /\.glb/, /\.geom/, /\.vctr/, /tileset.*\.json$/];
        // app.get(knownTilesetFormats, checkGzipAndNext);

        const appRouter = require('./router/app.router');
        const testRouter = require('./router/test.router');
        const fileRouter = require('./router/file.router');
        app.use('/app', appRouter);
        app.use('/test', testRouter);
        app.use('/file', fileRouter);


        if (argv.static) {
            //直接讀取靜態位置
            app.use(express.static(__dirname));
        } else {
            app.use('/data', express.static(__dirname + '/data'));
            app.use('/include', express.static(__dirname + '/include'));
            app.use('/media', express.static(__dirname + '/media'));
            app.use('/src', express.static(__dirname + '/src'));
            app.use('/node_modules', express.static(__dirname + '/node_modules'));
            app.use('/model', express.static(__dirname + '/model'));
            app.use('/font', express.static(__dirname + '/font'));
            app.use('/styles', express.static(__dirname + '/styles'));
            app.use('/css', express.static(__dirname + '/css'));
            app.use('/upload', express.static(__dirname + '/upload'));
            app.use('/view/template/graph/', express.static(__dirname + '/view/template/graph/'));
            app.use('/template', express.static(__dirname + '/views/template'));
            app.use('/util', express.static(__dirname + '/util'));
            app.use('/view/template/material/', express.static(__dirname + '/view/template/material/'));
        }

        app.engine('html', require('express-art-template'));

        const HOST = '0.0.0.0'; // 強制外部可連線

        var server = app.listen(argv.port, HOST, function () {
            console.log('Server running at http://%s:%d/', 'localhost', server.address().port);
        })
        // var server = app.listen(argv.port, argv.public ? undefined : 'localhost', function () {
        //     // var server = server0.listen(argv.port, argv.public ? undefined : 'localhost', function () {
        //     if (argv.public) {
        //         console.log('development server running publicly.  Connect to http://localhost:%d/', server.address().port);
        //     } else {
        //         console.log('development server running locally.  Connect to http://localhost:%d/', server.address().port);
        //     }
        // });

        server.on('error', function (e) {
            if (e.code === 'EADDRINUSE') {
                console.log('Error: Port %d is already in use, select a different port.', argv.port);
                console.log('Example: node server.js --port %d', argv.port + 1);
            } else if (e.code === 'EACCES') {
                console.log('Error: This process does not have permission to listen on port %d.', argv.port);
                if (argv.port < 1024) {
                    console.log('Try a port number higher than 1024.');
                }
            }
            console.log(e);
            process.exit(1);
        });

        server.on('close', function () {
            console.log('development server stopped.');
        });

        var isFirstSig = true;
        process.on('SIGINT', function () {
            if (isFirstSig) {
                console.log('Cesium development server shutting down.');
                server.close(function () {
                    process.exit(0);
                });
                isFirstSig = false;
            } else {
                console.log('Cesium development server force kill.');
                process.exit(1);
            }
        });

        let socket_io = null
        function socket_init() {
            var prom = new Promise((resolve, reject) => {
                socket_io = require('socket.io')(server, {
                    cors: {
                        origin: '*',
                    }
                });

                resolve(0)
                // io.sockets.on('connection', function (socket) {
                // })
            });
            return prom;
        }


        socket_init().then(function () {
            socket_io.sockets.on('connection', function (socket) {
                console.log('A user connected');

                socket.on('send_draw_message', (data) => {
                    socket.broadcast.emit('receive_draw_message', data); // 送給其他 client（不含自己）
                });
            })
        })

    })();
})