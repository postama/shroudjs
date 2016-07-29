"use strict";

//requires
let http = require('http');
let qs = require('querystring');
let crypto = require('crypto');
let nacl_factory = require('js-nacl');
let Promise = require('bluebird');
let path = require('path');
let fs = Promise.promisifyAll(require('fs'));

//instantiate NACL
let nacl;
nacl_factory.instantiate(n => nacl = n);

//Set up server
const serverPort = 8124;

let server = http.createServer().listen(serverPort);

server.on('request', handleRequest);

function handleRequest(req, res) {
  req.on('error', handleError);

  if(req.method === 'GET') return handleGet(req, res);
  if(req.method === 'POST') return handlePost(req, res);

  function handleError(err){
    console.error(err);
    return createError('500', res);
  }
}

function handlePost(req, res){
  if (req.url !== "/api") return createError('404', res);

  let sender = nacl.crypto_box_keypair();
  let receiver = nacl.crypto_box_keypair();
  let nonce = nacl.crypto_box_random_nonce();

  //Encrypt
  let plainText = nacl.encode_utf8('This is a message');
  let cipherMsg = nacl.crypto_box(plainText, nonce, receiver.boxPk, sender.boxSk);

  //Decrypt
  let plainDecrypted = nacl.crypto_box_open(cipherMsg, nonce, sender.boxPk, receiver.boxSk);
  console.log(nacl.decode_utf8(plainDecrypted));

  res.writeHead(200, {
    'Content-Type':'application/json',
    'X-Powered-By':'cloak'
  });
  res.end(JSON.stringify({"test":"obj"}));
}

//All GETs should be for files
function handleGet(req, res){
  let publicFolderName = 'public';
  let filePath = `./${publicFolderName}${req.url}`;
  if (filePath == `./${publicFolderName}/`) filePath = `./${publicFolderName}/index.html`;

  let extName = path.extname(filePath);

  let contentType;
  switch(extName){
    case '.js': contentType = 'text/javascript'; break;
    default: contentType = 'text/html'; break;
  }

  fs.readFileAsync(filePath)
    .then(content => {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(content, 'utf-8');
    })
    .catch(err => {
      if(err.code == 'ENOENT') return createError('404', res);
      return createError('500', res);
    });

}

function createError(code, res, info){

}
