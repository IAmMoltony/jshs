const getFileType = mime => {
    if (mime == "@unknown@")
        return "Other/Unknown";

    const mimeSplit = mime.split('/');
    const type = mimeSplit[0];
    const subType = mimeSplit[1];

    switch (type) {
        case "text":
            switch (subType) {
                case "css":
                    return "CSS";
                case "csv":
                    return "CSV spreadsheet";
                case "html":
                    return "HTML document";
                case "calendar":
                    return "iCalendar";
                case "javascript":
                    return "JavaScript source";
                case "plain":
                    return "Plain text";
                case "xml":
                    return "XML document";
            }
            return "Text";
        case "audio":
            switch (subType) {
                case "vnd.microsoft.icon":
                    return "Icon file";
            }
            return `${subType.toUpperCase()} audio`;
        case "image":
            return `${subType.toUpperCase()} image`;
        case "video":
            return `${subType.toUpperCase()} video`;
        case "application":
            switch (subType) {
                case "x-abiword":
                    return "AbiWord document";
                case "x-freearc":
                    return "Archive document";
                case "vnd.amazon.ebook":
                    return "Kindle eBook";
                case "octet-stream":
                    return "Binary file";
                case "x-bzip":
                    return "Bzip archive";
                case "x-bzip2":
                    return "Bzip2 archive";
                case "x-cdf":
                    return "CD audio";
                case "x-csh":
                    return "C-Shell script";
                case "msword":
                case "vnd.openxmlformats-officedocument.wordprocessingml.document":
                    return "Microsoft Word document";
                case "vnd.ms-fontobject":
                    return "Microsoft Embedded OpenType font";
                case "epub+zip":
                    return "Electronic publication";
                case "gzip":
                    return "Gzip archive";
                case "java-archive":
                    return "Java archive";
                case "json":
                    return "JSON file";
                case "ld+json":
                    return "JSON-LD file";
                case "vnd.apple.installer+xml":
                    return "Apple installer package";
                case "vnd.oasis.opendocument.presentation":
                    return "OpenDocument presentation";
                case "vnd.oasis.opendocument.spreadsheet":
                    return "OpenDocument spreadsheet";
                case "vnd.oasis.opendocument.text":
                    return "OpenDocument text";
                case "ogg":
                    return "OGG file";
                case "pdf":
                    return "Adobe PDF";
                case "x-httpd-php":
                    return "PHP source";
                case "vnd.ms-powerpoint":
                case "vnd.openxmlformats-officedocument.presentationml.presentation":
                    return "Microsoft PowerPoint presentation";
                case "vnd.rar":
                    return "RAR archive";
                case "rtf":
                    return "Rich Text Format document";
                case "x-sh":
                    return "Shell script";
                case "x-tar":
                    return "Tape archive";
                case "vnd.visio":
                    return "Microsoft Visio document";
                case "xhtml+xml":
                    return "XHTML document";
                case "vnd.ms-excel":
                case "vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    return "Microsoft Excel spreadsheet";
                case "xml":
                    return "XML document";
                case "vnd.mozilla.xul+xml":
                    return "Mozilla XUL";
                case "zip":
                    return "ZIP archive";
                case "x-7z-compressed":
                    return "7-zip archive";
            }
            break;
        case "font":
            return `${subType.toUpperCase()} font`;
    }

    return "Other/Unknown";
};
