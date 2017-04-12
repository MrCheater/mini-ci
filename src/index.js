#!/usr/bin/env node
var fs = require('fs');
var archiver = require('archiver');
var request = require('superagent');
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);

if((argv._.length === 1)) {
  var remoteUrl = argv._[0]



  var output = fs.createWriteStream('container.zip');
  var archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');



    request
      .post(remoteUrl)
      .set('Accept', 'application/json')

  });

  archive.on('error', function(err){
    throw err;
  });

  archive.pipe(output);
  archive.bulk([
    { expand: true, cwd: '.', src: ['./dist/**', './package.json', './node_modules/**'], dest: '.'}
  ]);
  archive.finalize();
}