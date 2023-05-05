chrome.action.onClicked.addListener(tab => {

    chrome.action.setPopup({
        popup: "index.html"
    });

    chrome.tabs.onUpdated.addListener(tab => {
        chrome.runtime.sendMessage({
            change: "page_changed", 
        })
        console.log("message sent on load");
    });

    /*chrome.scripting.executeScript({
        target: {tabId: tab.id}, 
        files: ["app.js"]});
    console.log("loaded JS");*/

    /*chrome.scripting.insertCSS({
        target: {tabId: tab.id}, 
        files: ["theme.css"]});
    console.log("loaded CSS");*/

});

chrome.tabs.onUpdated.addListener(tab => {
    chrome.runtime.sendMessage({
        change: "page_changed", 
    });
    console.log("message sent");

});