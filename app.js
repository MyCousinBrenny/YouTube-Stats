var apiKey = require('./key.js').apiKey;
var vidTest = 'Gkr8pipJzXA';
var parts = ['statistics', 'snippet', 'contentDetails'];
var itemArray = [];
var videoStats = [];
var nextToken = '';
var channelLinks = require('./key.js').channelLinks;

//Add conditional start to parse by channel username or vid Id
//Main app function in IIFE below - Functions broken out seperately for potential future uses
(async function () {
    
        console.log(channelLinks);
        let chanId = await channelId(apiKey, vidTest);
        let uploadPlaylist = "UU" + chanId.substring(2);

        do {
            var vids = await channelData(apiKey, uploadPlaylist, nextToken);
            nextToken = vids.nextPage;
            var vidsData = await videoData(apiKey, vids.itemArray, parts);
        } while (new Date(Math.min(...videoStats.map(vidDates =>
            new Date(vidDates.date)))) >= new Date((new Date().setDate(new Date().getDate() - 90))));
        
        console.log(last12Stats(vidsData));    
        console.log(last90Days(vidsData));
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

async function channelData(key, playlistId, tokenId) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/playlistItems" +
        `?key=${key}&playlistId=${playlistId}&part=contentDetails&maxResults=50&pageToken=${tokenId}`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let channelVids = await response.json();
    for(var key in channelVids.items) {
        itemArray[key] = channelVids.items[key].contentDetails.videoId;
    }
    let nextPage = channelVids.nextPageToken;

    return {'itemArray' : itemArray, 
        'nextPage' : nextPage};
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
    let keyNumber = 0;
    for(let key in vidsData.items) {
        if(videoStats.length > 0) {
            keyNumber = videoStats.length;
        } 
        videoStats.push({
            number: keyNumber,
            key: vidsData.items[key].id,
            title: vidsData.items[key].snippet.title,
            views: Number(vidsData.items[key].statistics.viewCount),
            likes: Number(vidsData.items[key].statistics.likeCount),
            comments: Number(vidsData.items[key].statistics.commentCount),
            date: vidsData.items[key].snippet.publishedAt,
            length: vidsData.items[key].contentDetails.duration
            })     
    };

    return(videoStats);
}

//Last 12 Stats calc removes the videos with the hightest and lowest views, then calc the average views, likes, and comments for the middle 10 videos
function last12Stats(stats) {
    let i = 0
    let last12Vids = [];
    stats.sort((a, b) => a.date - b.date);
    for(let key = 0; last12Vids.length < 12; key++){
        if (stats[key].length.includes('M')) {
            last12Vids[i] = stats[key];
            i++;
        }
    }
    last12Vids.sort((a, b) => a.views - b.views);    
    last12Vids.shift();
    last12Vids.pop();
    let avgViews = last12Vids.reduce((a, b) => a + b.views, 0) / last12Vids.length;
    let avgLikes = last12Vids.reduce((a, b) => a + b.likes, 0) / last12Vids.length;
    let avgComments = last12Vids.reduce((a, b) => a + b.comments, 0) / last12Vids.length;
    let result =[avgViews, avgLikes, avgComments];
    
    return result;
}

//Last 90 Dayss calcs the average views, likes, and comments for vids 15 to 90 days old. Next step is to remove any outliers 
function last90Days(stats) {
    let i = 0
    let last90Vids = [];
    let minDate = new Date();
    let maxDate = new Date();
    minDate.setDate(minDate.getDate() - 15);
    maxDate.setDate(maxDate.getDate() - 90);
    stats.sort((a, b) => a.date - b.date);
    for(let key in stats){
        if (stats[key].length.includes('M') && new Date(stats[key].date) <= minDate && new Date(stats[key].date) >= maxDate) {
            last90Vids[i] = stats[key];
            i++;
        } 
    } 
    let avgViews = last90Vids.reduce((a, b) => a + b.views, 0) / last90Vids.length;
    let avgLikes = last90Vids.reduce((a, b) => a + b.likes, 0) / last90Vids.length;
    let avgComments = last90Vids.reduce((a, b) => a + b.comments, 0) / last90Vids.length;

    return {
        'averageViews' : avgViews,
        'averageLikes' : avgLikes,
        'averageComments' : avgComments
    }
}

function parseId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(c\/)|(channel\/)|(@)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?^\/]*).*/;
    var match = url.match(regExp);

    return (match&&match[10].length>=0)? match[10] : false;
}
