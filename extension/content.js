var tempURL = chrome.runtime.getURL("index.html");

async function temps() {
    var templates = document.createElement('template');
    templates.innerHTML = await (await fetch(tempURL)).text();
    var parse = new DOMParser();
    var doc = parse.parseFromString(templates, "text/html");
    return doc;
}

console.log(temps().all);
//var insertDiv = temps().getElementById('popupDiv');
