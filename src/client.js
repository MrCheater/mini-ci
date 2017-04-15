require('./env');
var fs = require('fs');
var archiver = require('archiver');
var md5File = require('md5-file');
var jwt = require('jsonwebtoken');
var request = require('request');

var output = fs.createWriteStream('container.zip');
var archive = archiver('zip', {
    zlib: { level: 9 }
});

archive.on('error', function(err){
    throw err;
});

output.on('close', function () {
    var formData = {
      "container.zip": fs.createReadStream('container.zip'),
      "jwt": jwt.sign({
          totalBytes : archive.pointer(),
          hash : md5File.sync('container.zip')
        }, process.env.MINI_CI_SECRET)
    };
    request.post({
        url:process.env.MINI_CI_PROTOCOL + '://' + process.env.MINI_CI_HOST + ':' + process.env.MINI_CI_PORT,
        formData: formData
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log('Upload successful!  Server responded with:', body);
    });
});

archive.pipe(output);

archive.bulk([
    {
        expand: true,
        cwd: '.',
        src: ['./dist/**','./package.json', './node_modules/**', './static/**', './public/**']
    }
]);

archive.finalize();