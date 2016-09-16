redis = require('redis');

module.exports = {setup};


function setup(opts){
    let client = redis.createClient(opts);
    return {getKey: getKey.bind(null, client), setKey: setKey.bind(null, client)}
}

function getKey(client, k) {
    return new Promise((resolve, reject) => {
        client.hgetall(k, (err, obj) => {
            if (err) reject(err);
            resolve(obj);
        });
    });
}

function setKey(client, k, o) {
    return new Promise((resolve, reject) => {
        client.hmset(k, o, (err, obj) => {
            if (err) reject(err);
            resolve(obj);
        });
    });
}