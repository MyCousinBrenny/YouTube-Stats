(async function channelIdFromYT() {
    let channelLinks = require('./key.js').channelLinks;
    for (let link in channelLinks) {
    let urlString = 'https://www.' + channelLinks[link];
    let response = await fetch(urlString);
    let htmlString = await response.text();
    let result = htmlString.match(/,"externalId":"([^".]*)/)

    console.log(result[1]);
    }
}());

