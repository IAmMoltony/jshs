(() => {
    const pFileName = document.querySelector('#fileName');
    let fileNameText = getQueryParam('name');
    if (getQueryParam('folder') != undefined) {
        fileNameText = `${getQueryParam('folder')}/${fileNameText}`;
    }
    pFileName.innerText = fileNameText;
})();
