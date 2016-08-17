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

function handlePost(req, res, app){
  if (req.url !== "/api") return createError('404', res);

  function decrypt(data){
    let cryptoMessage = nacl.from_hex(data.message);
    let nonce = nacl.from_hex(data.nonce);
    let clientKey = nacl.from_hex(data.clientKey);
    let privateKey = nacl.from_hex(global.privateKey);
    let message = nacl.crypto_box_open(cryptoMessage, nonce, clientKey, privateKey);
  }

  let client = nacl.crypto_box_keypair();
  let server = nacl.crypto_box_keypair();
  let nonce = nacl.crypto_box_random_nonce();

  rawBody(req)
    .then(buff => req.body = JSON.parse(buff.toString()))
    .catch(err => createError(500, err))
    .then(decrypt)
    .then(() => {
      if(!req.body.task){
        throw createError(400, "no task field specified");
      }
      app.runTask(req.body.task);
    })
    .catch((e) => {
      createError(e);
    });

  res.writeHead(200, {
    'Content-Type':'application/json',
    'X-Powered-By':'cloak'
  });

  res.end(JSON.stringify({"test":"obj"}));
}

//All GETs should be for files
function handleGet(req, res, app){
  let publicFolderName = 'public';
  let filePath = `./${publicFolderName}${req.url}`;
  if (filePath == `./${publicFolderName}/`) filePath = `./${publicFolderName}/index.html`;
  console.log(filePath);
  if (filePath == `./${publicFolderName}/key.js`) return generateKeyFile(req, res, app);

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

function generateKeyFile(req, res, app) {
  let keypair = nacl.crypto_box_keypair();
  let publicKey = nacl.to_hex(keypair.boxPk);
  res.writeHead(200, {'Content-Type':'text/javascript'});
  global.privateKey = nacl.to_hex(keypair.boxSk);
  res.end(`let SERVER_KEY = "${publicKey}";`);
  //Save public and private key to DB.
}

function createError(res, code = 500, info = `Unspecified error: ${new Date()}`) {
  console.log(code);
  console.log(info);
}

exports.createApp = createApp;

function createApp(port) {
  //Set up server
  let server = http.createServer().listen(port);
  let app = {};
  server.on('request', handleRequest);

  function handleRequest(req, res) {
    req.on('error', handleError);

    if(req.method === 'GET') return handleGet(req, res, app);
    if(req.method === 'POST') return handlePost(req, res, app);

    function handleError(err){
      console.error(err);
      return createError('500', res);
    }
  }

  let _tasks = new Map();

  app.registerTask = registerTask.bind(null, _tasks);
  app.runTask = runTask.bind(null, _tasks);

  return app;
}


function registerTask(tasks, taskKey, taskValue){
  if(tasks.has(taskKey)) throw new Error(`task ${taskKey} is already registered`);
  if(typeof taskValue !== "function") throw new Error(`task ${taskKey} must reference a function`);
  tasks.set(taskKey, taskValue);
}

function runTask(tasks, taskKey){
  if(!tasks.has(taskKey)) throw new Error(`task ${taskKey} is not registered`);
  tasks.get(taskKey).call();
}
