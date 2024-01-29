const express = require("express");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const upload = require("./upload");
const bodyParser = require("body-parser");
const mv = require("mv");
const config = require("./config");
const statsApi = require("./stats");
const childProc = require("child_process");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();
const port = config.port;

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

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.redirect("/dashboard");
});

app.get("/dashboard", (_req, res) => {
    res.render("dashboard", {});
});

app.get("/uploads", (_req, res) => {
    res.render("uploads", {});
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
            console.error(`someone tried to do directory traversal attack (folder is '${folder}')`);
            respObj.errCode = 1;
            res.json(respObj);
            return;
        }
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
        res.sendFile("./style-dark.css", sendFileOptions, onSendFile);
    } else {
        res.sendFile("./style.css", sendFileOptions, onSendFile);
    }
});

app.get("/rawFile", (req, res) => {
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
    const mimeType = mime.lookup(req.query.name);
    const splitType = mimeType ? mimeType.split("/") : ["invalid", "invalid"];
    if (splitType[0] == "audio") {
        res.render("file-audio", {});
    } else if (splitType[0] == "video") {
        res.render("file-video", {});
    } else if (splitType[0] == "image") {
        res.render("file-image", {});
    } else {
        res.render("file-plain", {});
    }
});

app.get("/uploadPage", (_req, res) => {
    res.render("upload", {});
});

app.get("/getStats", (_req, res) => {
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

app.get("/stats", (_req, res) => {
    res.render("stats", {});
});

app.get("/settings", (req, res) => {
    res.render("settings", {colorTheme: getColorTheme(req)});
});

app.post("/upload", upload.single("file"), (req, res) => {
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

    console.log(`Renaming file ${realFolder}/${filename} to ${realFolder}/${newName}`);

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
    const selectedTheme = req.body.usTheme;

    // check if it's a real theme
    if (selectedTheme != "light" && selectedTheme != "dark") {
        console.log("Invalid theme", selectedTheme);
        res.redirect("/settings?usInvalidTheme=yes");
        return;
    }

    // set theme cookie
    const expireTime = new Date();
    expireTime.setFullYear(expireTime.getFullYear() + 1);

    res.cookie("jshsTheme", selectedTheme, {
        expires: expireTime,
        httpOnly: true,
    });

    res.redirect("/settings");
});

app.use("/hljs", express.static("./highlightjs"));
app.use("/js", express.static("./js"));
app.use("/img", express.static("./img"));

app.listen(port, () => {
    console.log(`jshs is running on port ${port}`);
});
