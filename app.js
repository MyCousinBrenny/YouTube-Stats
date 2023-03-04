var apiKey = require('./key.js');
var vidTest = 'Gkr8pipJzXA';
var parts = ['statistics', 'snippet', 'contentDetails'];
var itemArray = [];

//Main app function in IIFE below - Functions broken out seperately for potential future uses
(async function () {
    let chanId = await channelId(apiKey, vidTest);
    let uploadPlaylist = "UU" + chanId.substring(2);
    let vids = await channelData(apiKey, uploadPlaylist);
    let vidsData = await videoData(apiKey, vids, parts);
    last12Stats(vidsData);
})();

async function channelId(key, vidId) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?key=${key}&id=${vidId}&part=snippet`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let chanData = await response.json();
    return(chanData.items[0].snippet.channelId);
}

async function channelData(key, playlistId) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/playlistItems" +
        `?key=${key}&playlistId=${playlistId}&part=contentDetails&maxResults=50`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
}
    let channelVids = await response.json();
    for(var key in channelVids.items) {
        itemArray[key] = channelVids.items[key].contentDetails.videoId;
    }
    return itemArray;
}

async function videoData(key, vidIds, parts) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?key=${key}&id=${vidIds.join()}&part=${parts.join()}`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let vidsData = await response.json();
    for(let key in vidsData.items) {
        itemArray[key] = {
            number: key,
            key: vidsData.items[key].id,
            title: vidsData.items[key].snippet.title,
            views: Number(vidsData.items[key].statistics.viewCount),
            likes: Number(vidsData.items[key].statistics.likeCount),
            comments: Number(vidsData.items[key].statistics.commentCount),
            date: vidsData.items[key].snippet.publishedAt,
            length: vidsData.items[key].contentDetails.duration
            }     
    };
    return(itemArray);
}

//Last 12 Stats calc removes the videos with the hightest and lowest views, then calc the average views, likes, and comments for the middle 10 videos
function last12Stats(stats) {
    //console.log(stats);
    let last12Vids = [];
    for(let key = 0; last12Vids.length < 12; key++){
        if (stats[key].length.includes('M')) {
            last12Vids[key] = stats[key];
        } else {
            continue;
        }  
    }
    console.log(last12Vids);   
   
    stats.sort((a, b) => a - b.views);

    stats.shift();
    stats.pop();
    let avgViews = stats.reduce((a, b) => a + b.views, 0) / stats.length;
    let avgLikes = stats.reduce((a, b) => a + b.likes, 0) / stats.length;
    let avgComments = stats.reduce((a, b) => a + b.comments, 0) / stats.length;
    console.log(avgViews);
    console.log(avgLikes);
    console.log(avgComments);
}















