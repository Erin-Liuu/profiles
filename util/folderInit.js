var fs = require('fs')

init = function () {
    var prom = new Promise((resolve, reject) => {

        let check_urls = [
            './config',
            './log',
            // './coverage',
            // './data',
            './include',
            // './lib',
            './media',
            './media/img',
            './media/font',
            './media/audio',
            './model',
            // './router',
            // './src',
            // './styles',
            // './upload',
            // './util',
            // './views',
        ]

        for (var k in check_urls) {
            if (!fs.existsSync(check_urls[k])) {
                fs.mkdirSync(check_urls[k]);
            }
        }





        //初始檔案判斷
        var initialFiles = [
            // './include/cesium@1.114.0/Build/CesiumUnminified/index.js',
        ]
        let lack_files = []
        for (var k in initialFiles) {
            if (!fs.existsSync(initialFiles[k])) {
                lack_files.push('Need ' + initialFiles[k])
            }
        }
        if (lack_files.length) {
            console.log(lack_files.join("\n"));
            console.log('檔案已放在雲端硬碟，路徑：');
            process.exit(1);
        }

        var default_file_check = [
            {
                url: './config/ip.settle.json',
                content: `
                {
                    "allow": [
                        "*.*.*.*",
                        "1"
                    ]
                }
                `
            },
            {
                url: './config/pg.settle.json',
                content: `
                {
                    "online": {
                        "user": "postgres",
                        "host": "localhost",
                        "password": "",
                        "database": "account_module",
                        "port": 5432,
                        "idleTimeoutMillis": 3000
                    },
                    "offline": {
                        "user": "postgres",
                        "host": "localhost",
                        "password": "",
                        "database": "account_module",
                        "port": 5432,
                        "idleTimeoutMillis": 3000
                    }
                }
                `
            },
            {
                url: './config/connectInfo.json',
                content: `
                {
                    "dev": {
                        "main": {
                            "host": "127.0.0.1",
                            "port": "8081"
                        },
                        "db": {
                            "host": "127.0.0.1",
                            "port": "8081"
                        },
                        "api": {
                            "host": "127.0.0.1",
                            "port": "8083"
                        }
                    },
                    "prod": {
                        "main": {
                            "host": "114.32.59.211",
                            "port": "8081"
                        },
                        "db": {
                            "host": "114.32.59.211",
                            "port": "8081"
                        },
                        "api": {
                            "host": "114.32.59.211",
                            "port": "8083"
                        }
                    }
                }`
            },
            {
                url: './config/login.sim.json',
                content: `
                {
                    "tk": {
                        "secret_key": "a",
                        "payload": {
                            "user_id": "",
                            "user_name": "",
                            "user_type": 0
                        }
                    }
                }
                `
            },
            {
                url: `./config/tk.json`,
                content: `{
                    "todb": "",
                    "apptk": "tk"
                }`
            },
            {
                url: `./config/sys.info.json`,
                content: `{
                    "version": "1.0"
                }`
            },
        ]


        var proms = []
        for (var k in default_file_check) {
            var prom_ = new Promise((resolve, reject) => {
                var url = default_file_check[k].url
                var content = default_file_check[k].content
                fs.exists(url, function (exists) {
                    if (!exists) {
                        fs.writeFile(url, content, (err) => {
                            if (err) {
                                throw err;
                            }
                            resolve()
                        });
                    }
                    else {
                        resolve()
                    }
                });
            })

            proms.push(prom_)
        }

        Promise.allSettled(proms).then(function (res) {
            // console.log(res);
            resolve()
        })

        // resolve()
    });

    return prom
}
exports.init = init;
// init()