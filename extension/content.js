var tempURL = chrome.runtime.getURL("index.html");
console.log(tempURL);

async function temps() {
    var templates = document.createElement('template');
    templates.innerHTML = await (await fetch(tempURL)).text();
    return templates;
}
console.log(temps());