'use strict';

let shroud = require("./shroud.js");
const port = 8124;
let app = shroud.createApp(port);
app.registerTask('Test', logTest);

console.log(`Shroud Server Started on port ${port}`);

function logTest(){
  console.log('test');
}
