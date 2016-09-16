let path = require('path');
let Promise = require('bluebird');
let fs = Promise.promisifyAll(require('fs'));
let rawBody = require('raw-body');

let {encrypt, decrypt, from64, to64, generateKeyFile} = require('./encrypt');

module.exports = {handleRequest};

let app;

function handlePost(req, res) {
  if(!app) app = require('./shroud').getApp();
  if (req.url !== "/api") return createError(res, 404);

  rawBody(req)
    .then(buff => JSON.parse(buff.toString()))
    .then(decrypt)
    .then(data => {
      if (!data.task) throw { status: 400, message: "no task field specified" };
      return app[data.task](data.body).then((results) => [results, data.SPK]);
    })
    .then(encrypt)
    .then((data) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Powered-By': 'cloak'
      });
      res.end(data);
    })
    .catch((e) => {
      createError(res, e.status, e.message, e);
    });
}

//All GETs should be for files
function handleGet(req, res) {
  let publicFolderName = 'public';
  let filePath = `./${publicFolderName}${req.url}`;
  if (filePath == `./${publicFolderName}/`) filePath = `./${publicFolderName}/index.html`;
  if (filePath == `./${publicFolderName}/key.js`) {
    let publicKey = generateKeyFile();
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    res.end(`let SERVER_KEY = "${publicKey}";`);
    return;
  }

  let extName = path.extname(filePath);

  let contentType;
  switch (extName) {
    case '.js': contentType = 'text/javascript'; break;
    default: contentType = 'text/html'; break;
  }

  fs.readFileAsync(filePath)
    .then(content => {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    })
    .catch(err => {
      if (err.code == 'ENOENT') return createError(res, 404);
      return createError(res, 500);
    });
}

function createError(res, code = 500, info = `Unspecified error: ${new Date().toString()}`, error = undefined) {
  if (error) console.error(error);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'X-Powered-By': 'cloak'
  });
  res.end(JSON.stringify({ msg: info }));
}

function handleRequest(req, res) {
  req.on('error', handleError.bind(null, res));
  res.on('error', handleError.bind(null, res));
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
}

function handleError(res, err) {
  console.error(err);
  return createError(res, 500);
}