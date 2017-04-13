#!/usr/bin/env node
var fs = require('fs');
var archiver = require('archiver');
var request = require('superagent');
var argv = require('minimist')(process.argv.slice(2));
var md5File = require('md5-file')
var jwt = require('jsonwebtoken')
var express = require('express')

var containerPath = 'container.zip'

process.env.MINI_CI_SECRET = process.env.MINI_CI_SECRET || 'MINI_CI_SECRET'
process.env.MINI_CI_PORT = process.env.MINI_CI_PORT || '9876'
process.env.MINI_CI_HOST = process.env.MINI_CI_HOST || 'localhost'
process.env.MINI_CI_PROTOCOL = process.env.MINI_CI_PROTOCOL || 'http'

console.log(argv)

if(argv._[0] === 'client') {
  var output = fs.createWriteStream(containerPath);
  var archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function () {
    var totalBytes = archive.pointer();

    //tTimeout(function () {
      var hash = md5File.sync(containerPath)


      request
        .post(process.env.MINI_CI_PROTOCOL + '://' + process.env.MINI_CI_HOST + ':' + process.env.MINI_CI_PORT)
        .set('MINI_CI_JWT', jwt.sign({
          totalBytes : totalBytes,
          hash : hash
        }, process.env.MINI_CI_SECRET))
        .pipe(fs.createReadStream(containerPath))
    //}, 1000)

  });

  archive.on('error', function(err){
    throw err;
  });

  archive.pipe(output);
  try {
  archive.bulk([
    { expand: true, cwd: '.', src: ['./dist/**', './package.json', './node_modules/**'], dest: '.'}
  ]);
  } catch (error) {}
  archive.finalize();
} else if(argv._[0] === 'server') {
  var express = require('express');
  var app = express();

  app.post('/', function(req, res) {
    console.log('OK')
    console.log(req.headers)

    res.send('OK');
  });

  app.listen(process.env.MINI_CI_PORT, function () {
    console.log('Example app listening on port ' + process.env.MINI_CI_PORT);
  });
} else {
  throw new Error()
}