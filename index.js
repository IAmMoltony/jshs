const express = require("express");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const bodyParser = require("body-parser");
const mv = require("mv");
const config = require("./config");
const statsApi = require("./stats");
const childProc = require("child_process");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const AdmZip = require("adm-zip");
const multer = require("multer");
const crypto = require("crypto");
const sha256 = require("sha256");

if (!fs.existsSync("./password.json")) {
    throw new Error("password.json not found. Please generate a password.");
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, config.uploadsFolder);
    },
    filename: (_req, file, cb) => {
        cb(null, Buffer.from(file.originalname, "latin1").toString("utf8")); // workaround so that non-english names work properly
    }
});

const upload = multer({storage: storage});

const app = express();
const port = config.port;

const sessionIdPlain = crypto.randomBytes(128);
const sessionId = sha256(sessionIdPlain).toString("base64");

const passwordInfo = JSON.parse(fs.readFileSync("./password.json"));

const sendFileOptions = {
    root: path.join(__dirname)
};

const sendUploadOptions = {
    root: config.fileRoot
};

const onSendFile = err => {
    if (err)
        console.error("Error sending file", err);
};

const getColorTheme = req => {
    const theme = req.cookies.jshsTheme;
    return theme || "light";
};

const isMobileUser = req => {
    const ua = req.get("User-Agent");
    const isMobile = /Mobi|Android/i.test(ua);
    return isMobile;
};

const validatePassword = password => {
    const salted = password + passwordInfo.salt;
    const hashed = sha256(salted).toString("base64");
    return hashed == passwordInfo.password;
};

const checkSessionCookie = req => {
    if (!req.cookies.jshsSession)
        return false;
    return sha256(req.cookies.jshsSession).toString("base64") == sessionId;
};

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.redirect("/dashboard");
});

app.post("/login", (req, res) => {
    const password = req.body.password;
    if (validatePassword(password)) {
        res.cookie("jshsSession", sessionIdPlain, {httpOnly: true});
        res.redirect("/dashboard");
    } else {
        res.redirect("/loginPage?failed=yes");
    }
});

app.get("/loginPage", (req, res) => {
    if (checkSessionCookie(req)) {
        // user is already logged in
        res.redirect("/dashboard");
        return;
    }
    res.render("login", {isMobile: isMobileUser(req)});
});

app.get("/dashboard", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }
    res.render("dashboard", {isMobile: isMobileUser(req)});
});

app.get("/files", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }
    res.render("files", {isMobile: isMobileUser(req)});
});

app.get("/list-uploads", (req, res) => {
    let folder = req.query.folder; // if no folder this is undefined
    let respObj = {
        files: [],
        // err code values
        // 0: ok
        // 1: directory traversal
        errCode: 0
    };

    if (folder != undefined) {
        // check folder
        if (folder.includes("..")) {
            respObj.errCode = 1;
            res.json(respObj);
            return;
        }
    }

    if (!checkSessionCookie(req)) {
        // user isn't logged in
        respObj.errCode = 2;
        res.json(respObj);
        return;
    }

    let uploadsBase = config.uploadsFolder;
    if (folder != undefined) {
        uploadsBase += `/${folder}`;
    }

    // find files in the folder
    fs.readdirSync(uploadsBase).forEach(file => {
        const realName = `${uploadsBase}/${file}`;
        let stat;
        try {
            stat = fs.statSync(realName);
        } catch (err) {
            console.error("Error statting file:", err);
            return;
        }
        const isDir = stat.isDirectory();
        const mimeType = mime.lookup(file) || "@unknown@";
        const sz = stat.size;
        const fileObject = {
            name: file,
            isDir: isDir,
            mimeType: mimeType,
            size: sz
        };
        respObj.files.push(fileObject);
    });

    res.json(respObj);
});

app.get("/style.css", (req, res) => {
    if (getColorTheme(req) == "dark") {
        res.sendFile("./css/style-dark.css", sendFileOptions, onSendFile);
    } else {
        res.sendFile("./css/style.css", sendFileOptions, onSendFile);
    }
});

app.get("/rawFile", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    let name;
    const folder = req.query.folder;
    if (folder != undefined) {
        name = `${folder}/${req.query.name}`;
    } else {
        name = req.query.name;
    }
    name = `${config.uploadsFolder}/${name}`;
    if (name.includes("..")) {
        res.status(400).send("directory traversal attack");
        return;
    }
    if (!fs.existsSync(name)) {
        res.status(404).send(`file '${name}' not found`);
        return;
    }

    const isDownload = req.query.download;
    if (isDownload) {
        const fileName = req.query.name;
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    }

    res.sendFile(`${name}`, sendUploadOptions, onSendFile);
});

app.get("/viewFile", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    const mimeType = mime.lookup(req.query.name);
    const splitType = mimeType ? mimeType.split("/") : ["invalid", "invalid"];
    if (splitType[0] == "audio") {
        res.render("file-audio", {isMobile: isMobileUser(req)});
    } else if (splitType[0] == "video") {
        res.render("file-video", {isMobile: isMobileUser(req)});
    } else if (splitType[0] == "image") {
        res.render("file-image", {isMobile: isMobileUser(req)});
    } else {
        res.render("file-plain", {colorTheme: getColorTheme(req), isMobile: isMobileUser(req)});
    }
});

app.get("/uploadPage", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    res.render("upload", {isMobile: isMobileUser(req)});
});

app.get("/getStats", (req, res) => {
    if (!checkSessionCookie(req)) {
        return;
    }

    statsApi.getDiskSpace(space => {
        let unameExec = "uname -a";
        if (process.platform == "win32") {
            unameExec = "ver";
        }

        childProc.exec(unameExec, (err, stdout) => {
            if (err) {
                console.err("failed to run uname", err);
                return;
            }
            statsApi.getUploadSize(size => {
                const diskSpace = space;
                const runningOn = stdout;
                const statsJson = {
                    diskSpace: diskSpace,
                    runningOn: runningOn,
                    uploadSize: size
                };
                res.json(statsJson);
            });
        });
    });
});

app.get("/stats", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    res.render("stats", {isMobile: isMobileUser(req)});
});

app.get("/settings", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    res.render("settings", {colorTheme: getColorTheme(req), isMobile: isMobileUser(req)});
});

app.post("/upload", upload.single("file"), (req, res) => {
    if (!checkSessionCookie(req)) {
        res.status(401).send("Auth required");
        return;
    }

    const folder = req.body.folder;
    if (folder) {
        const realFolder = `${config.uploadsFolder}/${folder}`;
        if (folder.includes("..")) {
            res.status(400).send("directory traversal attack???");
            return;
        }

        mv(`${config.uploadsFolder}/${req.file.filename}`, `${realFolder}/${req.file.filename}`, {mkdirp: true}, err => {
            if (err)
                console.error("Error moving file into folder:", err);
        });
    }
    res.redirect("/uploadPage?uploadOk=yes");
});

app.get("/rename", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.status(401).send("Auth required");
        return;
    }

    const folder = req.query.folder;
    const realFolder = folder ? `${config.uploadsFolder}/${folder}` : config.uploadsFolder;
    const filename = req.query.filename;
    const newName = req.query.newName;

    if (!filename) {
        res.status(400).send("Filename argument not set");
        return;
    }

    if (!newName) {
        res.status(400).send("New name argument not set");
        return;
    }

    if (filename.includes("/")) {
        res.status(400).send("Filename must not contain slashes");
        return;
    }

    if (newName.includes("/")) {
        res.status(400).send("New name must not contain slashes");
        return;
    }

    if (folder) {
        if (folder.includes("..")) {
            res.status(400).send("Directory traversal attack i think");
            return;
        }
    }

    mv(`${realFolder}/${filename}`, `${realFolder}/${newName}`, err => {
        if (err) {
            console.error("Failed to move file", err);
            res.send(422).send("Could not rename file. Please check the logs.");
            return;
        }

        res.send("Okay");
    });
});

app.post("/setTheme", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.redirect("/loginPage");
        return;
    }

    const selectedTheme = req.body.usTheme;

    // check if it's a real theme
    if (selectedTheme != "light" && selectedTheme != "dark") {
        console.log("Invalid theme", selectedTheme);
        res.redirect("/settings?usInvalidTheme=yes");
        return;
    }

    // expire in a year
    const expireTime = new Date();
    expireTime.setFullYear(expireTime.getFullYear() + 1);

    // set cookie
    res.cookie("jshsTheme", selectedTheme, {
        expires: expireTime,
        httpOnly: true,
    });

    res.redirect("/settings");
});

app.get("/unzip", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.status(401).send("Auth required");
        return;
    }

    const folder = req.query.folder;
    const realFolder = folder ? `${config.uploadsFolder}/${folder}` : config.uploadsFolder;
    const zipName = req.query.zipName;

    if (!zipName) {
        res.status(400).send("Zip name argument not set");
        return;
    }

    if (zipName.includes("/")) {
        res.status(400).send("Zip name must not contain slashes");
        return;
    }

    const realFile = `${realFolder}/${zipName}`;
    if (realFile.includes("..")) {
        res.status(400).send("Directory traversal attack");
        return;
    }

    const name = path.parse(realFile).name;
    const outFolder = `${realFolder}/${name}`;
    if (fs.existsSync(outFolder)) {
        res.status(409).send("Zip folder already exists");
        return;
    }
    fs.mkdirSync(outFolder);

    const zip = new AdmZip(realFile);
    zip.extractAllTo(outFolder);

    res.send("OK");
});

app.get("/delete", (req, res) => {
    if (!checkSessionCookie(req)) {
        res.status(401).send("Auth required");
        return;
    }

    const folder = req.query.folder;
    const realFolder = folder ? `${config.uploadsFolder}/${folder}` : config.uploadsFolder;
    const name = req.query.filename;
    
    if (!name) {
        res.status(400).send("File name argument not set");
        return;
    }

    if (name.includes("/")) {
        res.status(400).send("File name nust not contain slashes");
        return;
    }

    if (folder) {
        if (folder.includes("..")) {
            res.status(400).send("dir traversal atk");
            return;
        }
    }

    const realName = `${realFolder}/${name}`;

    // delete it
    fs.rmSync(realName, {recursive: true, force: true});
    res.send("OK");
});

app.use("/js", express.static("./js"));
app.use("/img", express.static("./img"));

app.listen(port, () => {
    console.log(`jshs is running on port ${port}`);
});
