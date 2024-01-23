const checkDiskSpace = require('check-disk-space').default;
const config = require('./config');

//checkDiskSpace(config.uploadsFolder)
 //   .then(spc => console.log(spc));

const statsApi = {
    getDiskSpace: cb => {
        checkDiskSpace(config.uploadsFolder)
            .then(space => cb(space));
    }
};

module.exports = statsApi;
