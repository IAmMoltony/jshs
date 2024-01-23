const checkDiskSpace = require('check-disk-space').default;
const config = require('./config');
const getFolderSize = require('get-folder-size');

//checkDiskSpace(config.uploadsFolder)
 //   .then(spc => console.log(spc));

const statsApi = {
    getDiskSpace: cb => {
        checkDiskSpace(`${config.fileRoot}/${config.uploadsFolder}`)
            .then(space => cb(space));
    },

    getUploadSize: cb => {
        getFolderSize(config.uploadsFolder, (err, size) => {
            if (err)
                throw err;

            cb(size);
        });
    }
};

module.exports = statsApi;
