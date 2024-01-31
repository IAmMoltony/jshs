(() => {
    const pFileName = document.querySelector("#fileName");
    let fileNameText = getQueryParam("name");
    if (getQueryParam("folder") != undefined) {
        fileNameText = `${getQueryParam("folder")}/${fileNameText}`;
    }
    pFileName.innerText = fileNameText;

    let backHref = "/files";
    if (getQueryParam("folder") != undefined) {
        backHref = `/files?startFolder=${getQueryParam("folder")}`;
    }
    const backLink = document.querySelector("#viewfileBackLink");
    backLink.setAttribute("href", backHref);
})();

const getRawFileUrl = () => {
    let rawFileUrl = `/rawFile?name=${getQueryParam("name")}`;
    if (getQueryParam("folder") != undefined) {
        rawFileUrl += `&folder=${getQueryParam("folder")}`;
    }
    return rawFileUrl;
};
