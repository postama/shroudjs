'use strict';

let shroud = require("./shroud/shroud.js");
let keystore = require("./shroud-redis-keystore/redis-keystore.js").setup();
shroud.newApp({ port: 8124, keystore: keystore });
shroud.getApp().test = logTest;

function logTest(body) {
  return 'from Server';
}