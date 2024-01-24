const jshsApi = {
    getUploads: (dir, cb) => {
        let url = "";
        if (dir != undefined) {
            url = `/list-uploads?folder=${dir}`;
        } else {
            url = "/list-uploads";
        }

        fetch(url)
            .then(resp => resp.json())
            .then(dt => cb(dt))
            .catch(err => console.error("Failed to get uploads:", err));
    },

    rawFile: (dir, name, cb) => {
        let url = "";
        if (dir != undefined) {
            url = `/rawFile?name=${name}&folder=${dir}`;
        } else {
            url = `/rawFile?name=${name}`;
        }

        fetch(url)
            .then(resp => resp.text())
            .then(data => cb(data))
            .catch(err => console.error("Failed to get raw file:", err));
    },

    getNavbar: cb => {
        fetch("/navbar")
            .then(resp => resp.text())
            .then(data => cb(data))
            .catch(err => console.error("Failed to get navbar:", err));
    },

    getStats: cb => {
        fetch("/getStats")
            .then(resp => resp.text())
            .then(data => cb(data))
            .catch(err => console.error("Failed to get stats:", err));
    }
};
