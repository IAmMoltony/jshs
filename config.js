const fs = require("fs");
const path = require("path");

const data = fs.readFileSync("./jshs-config.json");
let config = JSON.parse(data);
config.fileRoot = config.fileRoot.replace("*DIRNAME*", path.join(__dirname));
module.exports = config;
