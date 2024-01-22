(() => {
    const pFileName = document.querySelector('#fileName');
    let fileNameText = getQueryParam('name');
    if (getQueryParam('folder') != undefined) {
        fileNameText = `${getQueryParam('folder')}/${fileNameText}`;
    }
    pFileName.innerText = fileNameText;
})();

const getRawFileUrl = () => {
    let rawFileUrl = `/rawFile?name=${getQueryParam('name')}`;
    if (getQueryParam('folder') != undefined) {
        rawFileUrl += `&folder=${getQueryParam('folder')}`;
    }
    return rawFileUrl;
}
