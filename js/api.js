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
    },

    renameFile: (folder, fileName, newName, cb) => {
        if (!fileName) {
            cb("Please specify the file name");
            return;
        }
        if (!newName) {
            cb("Please specify the new name");
            return;
        }

        let params = `?filename=${fileName}&newName=${newName}`;
        if (folder)
            params += `&folder=${folder}`;

        fetch(`/rename${params}`)
            .then(resp => resp.text())
            .then(data => cb(data))
            .catch(err => console.error("Failed to rename file:", err));
    },

    dlFile: (folder, fileName) => {
        if (!fileName) {
            console.error("Please specify file name");
            return;
        }

        let params = `?name=${fileName}&download=yes`;
        if (folder)
            params += `&folder=${folder}`;

        fetch(`/rawFile${params}`)
            .then(resp => resp.blob())
            .then(data => {
                const a = document.createElement("a");
                a.href = window.URL.createObjectURL(data);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            })
            .catch(err => console.error("Failed to download file:", err));
    },

    unzipFile: (folder, fileName, cb) => {
        if (!fileName) {
            console.error("Please specify file name");
            return;
        }

        let params = `?zipName=${fileName}`;
        if (folder)
            params += `&folder=${folder}`;

        fetch(`/unzip${params}`)
            .then(resp => resp.text())
            .then(data => cb(data))
            .catch(err => console.error("Failed to unzip file:", err));
    }
};
