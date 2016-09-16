/* @flow */
let atob = require('atob');
let btoa = require('btoa');
let nacl_factory = require('js-nacl');

//instantiate NACL
let nacl;
nacl_factory.instantiate(n => nacl = n);

module.exports = { encrypt, decrypt, from64, to64, generateKeyFile }

function encrypt(keystore, [resultsFromTask, SPK]) {
    let message = nacl.encode_utf8(JSON.stringify(resultsFromTask));
    let nonce = nacl.crypto_box_random_nonce();
    if (!(SPK in keystore)) throw new Error('Key missing');
    let keys = keystore[SPK];
    let cipherMsg = nacl.crypto_box(message, nonce, keys.CPK, keys.SSK);

    let requestObject = {
        message: to64(cipherMsg),
        nonce: to64(nonce)
    };

    return JSON.stringify(requestObject);
}

function decrypt(keystore, {message, nonce, SPK, clientKey}) {
    if (!(SPK in keystore)) throw new Error('Key missing');
    let keys = keystore[SPK];
    keys.LA = new Date();
    keys.CPK = from64(clientKey);
    message = nacl.crypto_box_open(from64(message), from64(nonce), keys.CPK, keys.SSK);
    let body = JSON.parse(nacl.decode_utf8(message));
    let task = body.task;
    delete body.task;
    return { SPK, body, task }
}

function from64(base64String) {
  return new Uint8Array(atob(base64String).split("").map(c => c.charCodeAt(0)));
}

function to64(bytes) {
  return btoa(String.fromCharCode.apply(null, bytes))
}

function generateKeyFile(keystore, req, res) {
  let {boxPk, boxSk} = nacl.crypto_box_keypair();
  let publicKey = to64(boxPk);
    //Save public and private key to DB.
  keystore[publicKey] = { SSK: boxSk, LA: new Date() };
  return publicKey;
}