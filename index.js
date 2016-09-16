'use strict';

let shroud = require("./shroud/shroud.js");
const port = 8124;
shroud.newApp(port);
shroud.getApp().test = logTest;
console.log(`Shroud Server Started on port ${port}`);

function logTest(body){
  return 'from Server';
}
