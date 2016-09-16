//Structure
// SPK: Server Public Key in 64
// Value: {
//   Server Secret Key : in Uint8Array
//   Last Time Used: Date() in date
//   Client Public Key : ABC in Uint8Array
// }

module.exports = { getKey, setKey }

let keystore = {}

function getKey(key) {
    if(!(key in keystore)) throw new Error('Key missing');
    return Object.assign({}, keystore[key])
}

function setKey(key, values) {
    keystore[key] = values;
}

