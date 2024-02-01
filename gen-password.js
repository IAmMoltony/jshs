const fs = require("fs");
const crypto = require("crypto");
const sha256 = require("sha256");

if (process.argv.length != 3) {
    console.error("Usage: node gen-password.js <new password>");
    process.exit(1);
}

const password = process.argv[2];
const salt = crypto.randomBytes(64).toString("base64");
const saltedPassword = password + salt;
const hashedPassword = sha256(saltedPassword).toString("base64");
const json = {
    salt: salt,
    password: hashedPassword
};
fs.writeFileSync("password.json", JSON.stringify(json));
console.log("Password saved successfully.");
