const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const upload = require('./upload');
const bodyParser = require('body-parser');
const mv = require('mv');
const config = require('./config');
const statsApi = require('./stats');
const childProc = require('child_process');

console.log('config:', config);

const app = express();
const port = 8000;

const sendFileOptions = {
    root: path.join(__dirname)
};

const sendUploadOptions = {
    root: config.fileRoot
};

const onSendFile = err => {
    if (err)
        console.error('Error sending file', err);
};

app.set('view engine', 'ejs');
app.use(bodyParser());

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard', {});
});

app.get('/uploads', (req, res) => {
    res.render('uploads', {});
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
            console.error('Error statting file:', err);
            return;
        }
        const isDir = stat.isDirectory();
        const mimeType = mime.lookup(file) || '@unknown@';
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
    name = `${config.uploadsFolder}/${name}`;
    if (name.includes('..')) {
        res.status(400).send('directory traversal attack');
        return;
    }
    if (!fs.existsSync(name)) {
        res.status(404).send(`file '${name}' not found`);
        return;
    }

    res.sendFile(`${name}`, sendUploadOptions, onSendFile);
});

app.get('/viewFile', (req, res) => {
    const mimeType = mime.lookup(req.query.name);
    const splitType = mimeType ? mimeType.split('/') : ['invalid', 'invalid'];
    if (splitType[0] == 'audio') {
        res.render('file-audio', {});
    } else if (splitType[0] == 'video') {
        res.render('file-video', {});
    } else if (splitType[0] == 'image') {
        res.render('file-image', {});
    } else {
        res.render('file-plain', {});
    }
});

app.get('/uploadPage', (req, res) => {
    res.render('upload', {});
});

app.get('/getStats', (req, res) => {
    statsApi.getDiskSpace(space => {
        let unameExec = 'uname -a';
        if (process.platform == 'win32')
            unameExec = 'ver';
        childProc.exec('uname -a', (err, stdout, stderr) => {
            if (err) {
                console.err('failed to run uname', err);
                return;
            }

            const diskSpace = space;
            const runningOn = stdout;
            const statsJson = {
                diskSpace: diskSpace,
                runningOn: runningOn
            };
            res.json(statsJson);
        });
    });
});

app.get('/stats', (req, res) => {
    res.render('stats', {});
});

app.post('/upload', upload.single('file'), (req, res) => {
    const folder = req.body.folder;
    if (folder) {
        const realFolder = `${config.uploadsFolder}/${folder}`;
        if (folder.includes('..')) {
            res.status(400).send('directory traversal attack???');
            return;
        }

        mv(`${config.uploadsFolder}/${req.file.filename}`, `${realFolder}/${req.file.filename}`, {mkdirp: true}, err => {
            if (err)
                console.error('Error moving file into folder:', err);
        });
    }
    res.redirect('/uploadPage?uploadOk=yes');
});

app.listen(port, () => {
    console.log(`jshs is running on port ${port}`);
});
