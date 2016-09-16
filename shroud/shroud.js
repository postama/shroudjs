/* @flow */

"use strict";

//requires
let http = require('http');

/*jshint -W079 */
let {handleRequest} = require('./handlers');
let proxy = require('./proxy');
let {setKeystore} = require('./keystore');

//TODO plug in error handling
//TODO folder route handlers task:folder.x
//TODO all route handlers: app.all


module.exports = {newApp, getApp};

let app;

function getApp() {
  if (app) return app;
  throw new Error(`No app created`);
}

function newApp(opts) {
  if (app) throw new Error(`App already running`);
  app = _createApp(opts);
  return getApp();
}

function _createApp({port, keystore}) {
  console.log(`Shroud Server Starting on port ${port}`);
  setKeystore(keystore);
  let server = http.createServer(handleRequest).listen(port);
  return new Proxy({}, proxy());
}
