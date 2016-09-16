module.exports = function () {
    return {
        get: (target, name) => {
            if (name in target) {
                return function (body) {
                    return Promise.resolve(target[name].call(null, body));
                };
            } else {
                throw new Error(`task ${name} is not registered`);
            }
        },
        set: (target, name, value) => {
            if (name in target) {
                throw new Error(`task ${name} is already registered`);
            }
            if (typeof value !== "function") {
                throw new Error(`task ${name} must reference a function`);
            }
            target[name] = value;
            return true;
        }
    };
}