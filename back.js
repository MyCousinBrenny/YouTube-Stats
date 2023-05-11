chrome.action.onClicked.addListener(tab => {
    chrome.tabs.reload();
    chrome.action.setPopup({
        popup: "index.html"
    });
    
});  
    