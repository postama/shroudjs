'use strict';

let shroud = require("./shroud.js");
const port = 8124;
let app = shroud.newApp(port);
app.test = logTest;
console.log(`Shroud Server Started on port ${port}`);

function logTest(){
  console.log('test');
}
