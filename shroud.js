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

  let sender = nacl.crypto_box_keypair();
  let receiver = nacl.crypto_box_keypair();
  let nonce = nacl.crypto_box_random_nonce();

  //Encrypt
  let plainText = nacl.encode_utf8('This is a message');
  let cipherMsg = nacl.crypto_box(plainText, nonce, receiver.boxPk, sender.boxSk);

  //Decrypt
  let plainDecrypted = nacl.crypto_box_open(cipherMsg, nonce, sender.boxPk, receiver.boxSk);
  console.log(nacl.decode_utf8(plainDecrypted));

  rawBody(req)
    .then(buff => req.body = JSON.parse(buff.toString()))
    .catch(err => createError(500, err))
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
  res.writeHead(200, {'Content-Type':'text/javascript'});
  console.log(typeof keypair.boxPk);
  console.log(keypair.boxPk);
  let privateKey = nacl.decode_latin1(keypair.boxPk);
  res.end(`let SERVER_KEY = "${privateKey}"`);
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
