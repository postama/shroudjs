module.exports = { getKey, setKey, setKeystore }

function getKey(k) {
    return Promise.resolve(keystore.getKey(k));
}

function setKey(k, o) {
    return Promise.resolve(keystore.setKey(k, o)).then(() => o);
}

let keystore;

function setKeystore(keystoreInput) {
    if (!keystoreInput) {
        console.log('The basic in memory store is not intended to be used in production');
        keystoreInput = require('./basic-keystore');
    }
    keystore = keystoreInput;
}