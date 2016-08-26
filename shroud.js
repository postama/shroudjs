"use strict";

//requires
let http = require('http');
let qs = require('querystring');
let crypto = require('crypto');
let nacl_factory = require('js-nacl');
let rawBody = require('raw-body');
/*jshint -W079 */
let Promise = require('bluebird');
let path = require('path');
let fs = Promise.promisifyAll(require('fs'));

//instantiate NACL
let nacl;
nacl_factory.instantiate(n => nacl = n);

let keystore = {};

//Structure
// SPK: Server Public Key in hex
// Value: {
//   Server Private Key : XYZ in hex
//   Last Time Used: Date() in date
//   Client Public Key : ABC in hex
// }

function handlePost(req, res, app){
  if (req.url !== "/api") return createError('404', res);

  function decrypt(data){
    let cryptoMessage = nacl.from_hex(data.message);
    let nonce = nacl.from_hex(data.nonce);
    let serverKey = data.serverKey;
    if(!(serverKey in keystore)) throw new Error('Key missing');
    let keys = keystore[serverKey];
    let SSK = keys.SSK;
    let CPK = data.clientKey;
    let LA = new Date();
    keystore[serverKey] = {SSK:SSK, CPK:CPK, LA:LA};
    let clientKey = nacl.from_hex(CPK);
    let privateKey = nacl.from_hex(SSK);
    let message = nacl.crypto_box_open(cryptoMessage, nonce, clientKey, privateKey);
    req.SPK =  data.serverKey;
    req.body = JSON.parse(nacl.decode_utf8(message));
    req.task = req.body.task;
    delete req.body.task;
    return req;
  }

  function encrypt(data){
    let resultsFromTask = data[0];
    let SPK = data[1];
    let message = nacl.encode_utf8(JSON.stringify(resultsFromTask));
    let nonce = nacl.crypto_box_random_nonce();
    if(!(SPK in keystore)) throw new Error('Key missing');
    let keys = keystore[SPK];
    let cipherMsg = nacl.crypto_box(message, nonce, nacl.from_hex(keys.CPK), nacl.from_hex(keys.SSK));

    let requestObject = {
      message: nacl.to_hex(cipherMsg),
      nonce: nacl.to_hex(nonce)
    };

    return JSON.stringify(requestObject);
  }

  let client = nacl.crypto_box_keypair();
  let server = nacl.crypto_box_keypair();
  let nonce = nacl.crypto_box_random_nonce();

  rawBody(req)
    .then(buff => req.body = JSON.parse(buff.toString()))
    .then(decrypt)
    .then((req) => {
      if(!req.task) throw {status:400, message:"no task field specified"};
      return app[req.task](req.body).then((results)=> [results, req.SPK]);
    })
    .then(encrypt)
    .then((data) => {
      res.writeHead(200, {
        'Content-Type':'application/json',
        'X-Powered-By':'cloak'
      });
      res.end(data);
    })
    .catch((e) => {
      createError(res, e.status, e.message, e);
    });
}

//All GETs should be for files
function handleGet(req, res){
  let publicFolderName = 'public';
  let filePath = `./${publicFolderName}${req.url}`;
  if (filePath == `./${publicFolderName}/`) filePath = `./${publicFolderName}/index.html`;
  if (filePath == `./${publicFolderName}/key.js`) return generateKeyFile(req, res);

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
      if(err.code == 'ENOENT') return createError(res, '404');
      return createError('500', res);
    });
}

function generateKeyFile(req, res) {
  let keypair = nacl.crypto_box_keypair();
  let publicKey = nacl.to_hex(keypair.boxPk);
  res.writeHead(200, {'Content-Type':'text/javascript'});

  keystore[publicKey] = {SSK:nacl.to_hex(keypair.boxSk), LA:new Date()};

  res.end(`let SERVER_KEY = "${publicKey}";`);
  //Save public and private key to DB.
}

function createError(res, code = 500, info = `Unspecified error: ${new Date()}`, error = undefined) {
  if(error) console.error(error);
  res.writeHead(code, {
    'Content-Type':'application/json',
    'X-Powered-By':'cloak'
  });
  res.end(JSON.stringify({msg:info}));
}

function handleRequest(req, res) {
  req.on('error', handleError.bind(null, res));
  if(req.method === 'GET') return handleGet(req, res);
  if(req.method === 'POST') return handlePost(req, res, getApp());
}

function handleError(res, err){
  console.error(err);
  return createError('500', res);
}

exports.newApp = newApp;


function getApp(){
  if(appStore.app) return appStore.app;
  throw new Error(`No app created`);
}

let appStore = {};

function newApp(port){
  if(appStore.app) throw new Error(`App already running`);
  appStore.app = createApp(port);
  return getApp();
}

function createApp(port) {
  //Set up server
  let server = http.createServer().listen(port);
  let store = {};
  let handler = {
    get: (target, name) => {
      if(name in target){
        return function(body){
          return Promise.resolve(target[name].call(null, body));
        };
      } else {
        throw new Error(`task ${name} is not registered`);
      }
    },
    set: (target, name, value) => {
      if(name in target){
        throw new Error(`task ${name} is already registered`);
      }
      if(typeof value !== "function"){
        throw new Error(`task ${name} must reference a function`);
      }
      target[name] = value;
      return true;
    }
  };

  server.on('request', handleRequest);
  return new Proxy(store, handler);
}
