/* @flow */

"use strict";

//requires
let http = require('http');

/*jshint -W079 */
let Promise = require('bluebird');
let {handleRequest} = require('./handlers')

//TODO allow use of redis as a keystore
let keystore = {};

//TODO plug in error handling
//TODO folder route handlers task:folder.x
//TODO all route handlers: app.all


//Structure
// SPK: Server Public Key in 64
// Value: {
//   Server Secret Key : in Uint8Array
//   Last Time Used: Date() in date
//   Client Public Key : ABC in Uint8Array
// }

module.exports = {newApp, getApp};

let app;

function getApp() {
  if (app) return app;
  throw new Error(`No app created`);
}

function newApp(port) {
  if (app) throw new Error(`App already running`);
  app = createApp(port);
  return getApp();
}

function createApp(port) {
  //Set up server
  let server = http.createServer(handleRequest.bind(null, keystore)).listen(port);
  let store = {};
  let handler = {
    get: (target, name) => {
      if (name in target) {
        return function (body) {
          return Promise.resolve(target[name].call(null, body));
        };
      } else {
        throw new Error(`task ${name} is not registered`);
      }
    },
    set: (target, name, value) => {
      if (name in target) {
        throw new Error(`task ${name} is already registered`);
      }
      if (typeof value !== "function") {
        throw new Error(`task ${name} must reference a function`);
      }
      target[name] = value;
      return true;
    }
  };

  return new Proxy(store, handler);
}
