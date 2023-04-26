
chrome.tabs.onUpdated.addListener(async tab => {
    console.log("updated");
    console.log(tab);
    await chrome.scripting.executeScript({
      target: {tabId: tab},
      files: ['app.js']
    }).then(() => console.log("script injected"));

    
  });

