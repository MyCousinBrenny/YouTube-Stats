var tempURL = chrome.runtime.getURL("index.html");

async function temps() {
    var templates = document.createElement('DIV');
    templates.innerHTML = await (await fetch(tempURL)).text();
    document.body.appendChild(templates);
    return templates;
}

console.log(temps());
//var insertDiv = temps().getElementById('popupDiv');
