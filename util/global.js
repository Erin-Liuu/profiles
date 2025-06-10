// PUBLIC
var global = {};
// 
exports.set = (key, val) => {
    // console.log("global set");
    var flag;
    if (!global[key]) {
        flag = 0;
    } else {
        flag = 1
    }
    global[key] = val;
    // console.log(global);
    return flag
}
exports.get = (key) => {
    // console.log("global get");
    // console.log(global);
    return global[key];
}
