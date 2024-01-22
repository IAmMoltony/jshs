const getQueryParam = name => {
    const usp = new URLSearchParams(window.location.search);
    return usp.get(name);
};
