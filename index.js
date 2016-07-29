'use strict';

let shroud = require("./shroud.js");

let app = shroud.createApp(8124);
app.registerTask('Test', logTest);

function logTest(){
  console.log('test');
}
