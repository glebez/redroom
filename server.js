'use strict';

const server = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

const port = 4200;

function serverHandler(request, response) {
    const uri = url.parse(request.url).pathname;
    let filename = path.join(process.cwd(), uri);

    const isWin = !!process.platform.match(/^win/);
    console.log('request');
    if (filename && filename.toString().indexOf(isWin ? '\\uploadFile' : '/uploadFile') != -1 && request.method.toLowerCase() == 'post') {
        console.log('uploadRequest');
        uploadFile(request, response);
        return;
    }

    fs.exists(filename, function(exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }

        if (filename.indexOf('favicon.ico') !== -1) {
            return;
        }

        if (fs.statSync(filename).isDirectory() && !isWin) {
            filename += '/index.html';
        } else if (fs.statSync(filename).isDirectory() && !!isWin) {
            filename += '\\index.html';
        }

        fs.readFile(filename, 'binary', function(err, file) {
            if (err) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write(err + '\n');
                response.end();
                return;
            }

            let contentType;

            if (filename.indexOf('.html') !== -1) {
                contentType = 'text/html';
            }

            if (filename.indexOf('.js') !== -1) {
                contentType = 'application/javascript';
            }

            if (contentType) {
                response.writeHead(200, {
                    'Content-Type': contentType
                });
            } else response.writeHead(200);

            response.write(file, 'binary');
            response.end();
        });
    });
}

let app;

app = server.createServer(serverHandler);

app = app.listen(port, process.env.IP || "0.0.0.0", function() {
    const addr = app.address();

    if (addr.address == '0.0.0.0') {
        addr.address = 'localhost';
    }

    app.address = addr.address;

    console.log("Server listening at", 'http://' + addr.address + ":" + addr.port);
});

function uploadFile(request, response) {
    // parse a file upload
    const mime = require('mime');
    const formidable = require('formidable');
    const util = require('util');
    const cloudinary = require('cloudinary');
    const cloudinaryConfig = require('./cloudinaryConfig');

    cloudinary.config(cloudinaryConfig);
    console.log(cloudinaryConfig);

    const form = new formidable.IncomingForm();

    form.keepExtensions = true;
    form.maxFieldsSize = 10 * 1024 * 1024;
    form.maxFields = 1000;
    form.multiples = false;

    form.parse(request, function(err, fields, files) {
        cloudinary.v2.uploader.upload(files.file.path,
          { resource_type: "video", format: "webm", effect: "reverse" },
          function(err, result) {
            if (err) {
              console.log(err);
              response.writeHead(400);
              response.write(JSON.stringify(err));
              response.end();
              return;
            }
            let url = result.url;
            // const lastSlash = url.lastIndexOf('/');
            // url = url.slice(0, lastSlash) + '/e_reverse' + url.slice(lastSlash);
            response.writeHead(200, getHeaders('Content-Type', 'application/json'));
            response.write(JSON.stringify({
                fileURL: url
            }));
            response.end();
          }
        );

        // const fileName = file.split('path:')[1].split('\',')[0].split(dir)[1].toString().replace(/\\/g, '').replace(/\//g, '');
        // const fileURL = 'http://' + app.address + ':' + port + '/uploads/' + fileName;
        //
        // console.log('fileURL: ', fileURL);

    });
}

function getHeaders(opt, val) {
    try {
        const headers = {};
        headers["Access-Control-Allow-Origin"] = "http://redroom.online";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = true;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";

        if (opt) {
            headers[opt] = val;
        }

        return headers;
    } catch (err) {
        console.log(err);
        return {};
    }
}
