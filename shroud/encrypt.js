/* @flow */
let atob = require('atob');
let btoa = require('btoa');
let nacl_factory = require('js-nacl');

//instantiate NACL
let nacl;
nacl_factory.instantiate(n => nacl = n);

//Local modules
let {getKey, setKey} = require('./keystore.js');
//Exports
module.exports = { encrypt, decrypt, from64, to64, generateKeyFile }

function encrypt([resultsFromTask, SPK]) {
  let message = nacl.encode_utf8(JSON.stringify(resultsFromTask));
  let nonce = nacl.crypto_box_random_nonce();
  return getKey(SPK)
    .then(keys => {
      let cipherMsg = nacl.crypto_box(message, nonce, from64(keys.CPK), from64(keys.SSK));
      let requestObject = {
        message: to64(cipherMsg),
        nonce: to64(nonce)
      };
      return JSON.stringify(requestObject);
    });
}

function decrypt({message, nonce, SPK, clientKey}) {
  return getKey(SPK)
    .then(keys => {
      keys.LA = new Date();
      keys.CPK = clientKey;
      return keys;
    })
    .then(setKey.bind(null, SPK))
    .then((keys) => {
      message = nacl.crypto_box_open(from64(message), from64(nonce), from64(keys.CPK), from64(keys.SSK));
      let body = JSON.parse(nacl.decode_utf8(message));
      let task = body.task;
      delete body.task;
      return { SPK, body, task }
    });
}

function from64(base64String) {
  return new Uint8Array(atob(base64String).split("").map(c => c.charCodeAt(0)));
}

function to64(bytes) {
  return btoa(String.fromCharCode.apply(null, bytes))
}

function generateKeyFile(req, res) {
  let {boxPk, boxSk} = nacl.crypto_box_keypair();
  let publicKey = to64(boxPk);
  setKey(publicKey, { SSK: to64(boxSk), LA: new Date() });
  return publicKey;
}

