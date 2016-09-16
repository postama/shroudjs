redis = require('redis');
let client = redis.createClient();

module.exports = { getKey, setKey };

function getKey(k) {
    return new Promise((resolve, reject) => {
        client.hgetall(k, (err, obj) => {
            if (err) reject(err);
            resolve(obj);
        });
    });
}

function setKey(k, o) {
    return new Promise((resolve, reject) => {
        client.hmset(k, o, (err, obj) => {
            if (err) reject(err);
            resolve(obj);
        });
    });
}