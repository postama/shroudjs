module.exports = { getKey, setKey, setKeystore }

function getKey(k) {
    return keystore.getKey(k);
}

function setKey(k, o) {
    return keystore.setKey(k, o);
}

let keystore;

function setKeystore(keystoreInput) {
    if (!keystoreInput) {
        console.log('The basic in memory store is not intended to be used in production');
        keystoreInput = require('./basic-keystore');
    }
    keystore = keystoreInput;
}