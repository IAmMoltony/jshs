const fs = require('fs');

const data = fs.readFileSync('./jshs-config.json');
const config = JSON.parse(data);
module.exports = config;
