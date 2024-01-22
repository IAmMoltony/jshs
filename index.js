const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();
const port = 8000;

const sendFileOptions = {
    root: path.join(__dirname)
};

const onSendFile = err => {
    if (err)
        console.error('Error sending file', err);
};

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.sendFile('./public/dashboard.html', sendFileOptions, onSendFile);
});

app.get('/uploads', (req, res) => {
    res.sendFile('./public/uploads.html', sendFileOptions, onSendFile);
});

app.get('/list-uploads', (req, res) => {
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
        if (folder.includes('..')) {
            console.error(`someone tried to do directory traversal attack (folder is '${folder}')`);
            respObj.errCode = 1;
            res.send(JSON.stringify(respObj));
            return;
        }
    }

    let uploadsBase = './uploads';
    if (folder != undefined) {
        uploadsBase += `/${folder}`;
    }

    // find files in the folder
    fs.readdirSync(uploadsBase).forEach(file => {
        const realName = `${uploadsBase}/${file}`;
        const stat = fs.statSync(realName);
        const isDir = stat.isDirectory();
        const mimeType = mime.lookup(file);
        const fileObject = {
            name: file,
            isDir: isDir,
            mimeType: mimeType
        };
        respObj.files.push(fileObject);
    });

    res.send(JSON.stringify(respObj));
});

app.get('/js/:jsFile', (req, res) => {
    res.sendFile(`./js/${req.params.jsFile}`, sendFileOptions, onSendFile);
});

app.get('/style.css', (req, res) => {
    res.sendFile('./style.css', sendFileOptions, onSendFile);
});

app.get('/rawFile', (req, res) => {
    let name;
    const folder = req.query.folder;
    if (folder != undefined) {
        name = `${folder}/${req.query.name}`;
    } else {
        name = req.query.name;
    }
    name = `./uploads/${name}`;
    if (name.includes('..')) {
        res.status(400).send('directory traversal attack');
        return;
    }
    if (!fs.existsSync(name)) {
        res.status(404).send(`file '${name}' not found`);
        return;
    }

    res.sendFile(`${name}`, sendFileOptions, onSendFile);
});

app.get('/viewFile', (req, res) => {
    const mimeType = mime.lookup(req.query.name);
    const splitType = mimeType.split('/');
    if (splitType[0] == 'audio') {
        res.sendFile('./public/file-audio.html', sendFileOptions, onSendFile);
    } else if (splitType[0] == 'video') {
        res.sendFile('./public/file-video.html', sendFileOptions, onSendFile);
    } else {
        res.sendFile('./public/file-plain.html', sendFileOptions, onSendFile);
    }
});

app.listen(port, () => {
    console.log(`jshs is running on port ${port}`);
});
