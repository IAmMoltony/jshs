const strFileSize = bytes => {
    if (bytes == 0)
        return "0 B";

    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
