require('./env');
var fs = require('fs');
var md5File = require('md5-file');
var jwt = require('jsonwebtoken');
var express = require('express');
var multer = require('multer');
var extract = require('extract-zip');
var pm2 = require('pm2');

function unzipAndStart(file) {
    extract(file.path, {dir: '.'}, function (err) {
        if(err) {
            console.error(err);
            return
        }
        pm2.connect(function(err) {
            if (err) {
                console.error(err);
                return
            }
            pm2.start({
                script : 'dist/index.js',
                name : 'server'
            }, function(err, apps) {
                pm2.disconnect();   // Disconnects from PM2
                if (err) {
                    throw err
                }
            });
        });
    })
}

var app = express();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '.')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname)
    }
});

var upload = multer({ storage: storage });

app.post('/', upload.single('container.zip'), function (req, res) {
    const {totalBytes, hash} = jwt.verify(req.body.jwt, process.env.MINI_CI_SECRET);
    if(
        (req.file.size === totalBytes) &&
        (md5File.sync(req.file.path) === hash)
    ) {
        res.status(200).send('ok')
        unzipAndStart(req.file)
    } else {
        res.status(401).send('error')
    }
});

app.listen(process.env.MINI_CI_PORT, process.env.MINI_CI_HOST, function () {
    console.log('Example app listening on port ' + process.env.MINI_CI_PORT);
});