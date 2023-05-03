chrome.action.onClicked.addListener(tab => {

    chrome.scripting.executeScript({
        target: {tabId: tab.id}, 
        files: ["content.js"]});
    console.log("loaded JS");

    chrome.scripting.insertCSS({
        target: {tabId: tab.id}, 
        files: ["theme.css"]});
    console.log("loaded CSS");
    
});