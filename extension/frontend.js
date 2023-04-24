export const grid = document.querySelector('.grid');
export const resultTemp = document.getElementById('result-template');
  
for (let i = 0; i < 2; i++) {
    grid.append(resultTemp.content.cloneNode(true))
}

await chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'report_back') {
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse(document.all[0].outerHTML);
    }
});
