'use strict';

let shroud = require("./shroud/shroud.js");
shroud.newApp({port:8124});
shroud.getApp().test = logTest;

function logTest(body){
  return 'from Server';
}
