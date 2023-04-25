import { apiKey } from './exports.js';
var parts = ['statistics', 'snippet', 'contentDetails'];
var itemArray = [];
var videoStats = [];
import { channelLinks } from './exports.js';
import { resultTemp } from './frontend.js';
import { grid } from './frontend.js';


//Main app function in IIFE below - Functions broken out seperately for potential future uses
    (async function () {
    

        let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        let [bodyText] = await chrome.scripting.executeScript({
            target:  {tabId: tab.id},
            func: () => {
                let body = document.body.innerHTML;
                return(body);
            }});
        console.log(bodyText);
        
        var response = await bodyText.result;
        var chanId = response.match(/,"externalChannelId":"([^".]*)/);
          
        var uploadPlaylist = "UU" + chanId[1].substring(2);
        var nextToken = '';
        do {
            var vids = await channelData(apiKey, uploadPlaylist, nextToken);
            nextToken = vids.nextPage;
            var vidsData = await videoData(apiKey, vids.itemArray, parts);
        } while (new Date(Math.min(...videoStats.map(vidDates =>
            new Date(vidDates.date)))) >= new Date((new Date().setDate(new Date().getDate() - 90))));
        
        let firstResults = last12Stats(vidsData);
        grid.innerHTML = ''; 
        const div = resultTemp.content.cloneNode(true)
        div.querySelector('[data-title]').textContent = firstResults.name;
        div.querySelector('[data-body]').textContent = '';
        for (const metric in firstResults.results) {
            let newDivTitle = document.createElement('div');
            newDivTitle.id = metric;
            newDivTitle.className = "dataBody metricTitle";
            newDivTitle.innerHTML = metric + " : ";
            let newDivValue = document.createElement('div');
            newDivValue.id = metric + "Value";
            newDivValue.className = "dataBody metricValue";
            newDivValue.innerHTML = firstResults.results[metric];

            div.querySelector('[data-body]').appendChild(newDivTitle);
            div.querySelector('[data-body]').appendChild(newDivValue);
        }
        grid.append(div);  
        //firstResult.innerHTML = `${firstResults.name}`;
        //document.getElementById("result1").innerHTML = firstResults.results;
        console.log(firstResults.name);
        console.log(firstResults.results);

})();

//Pulling channel ID from YouTube page and not using below functions anymore
/*async function channelIdFromVid(key, vidId) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?key=${key}&id=${vidId}&part=snippet`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let chanData = await response.json();

    return(chanData.items[0].snippet.channelId);
}*/

/*async function searchChannelId(key, chanName) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/search" +
        `?key=${key}&q=${chanName}&part=snippet`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let chanData = await response.json();

    return(chanData.items[0].snippet.channelId);
}*/

function channelId(tab, bodyText){
    console.log(tab);
    console.log("here");
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
    videoStats = [];
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
    
    return {
        name: "Last 12 Videos Stats",
        results : {
            "Average Views" : avgViews.toLocaleString("en", {maximumFractionDigits: 0}),
            "Average Likes" : avgLikes.toLocaleString("en", {maximumFractionDigits: 0}),
            "Average Comments" : avgComments.toLocaleString("en", {maximumFractionDigits: 0})
        }
    }
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
        name: "Last 90 Days Stat Calc",
        results: {
            "Average Views" : avgViews.toLocaleString(),
            "Average Likes" : avgLikes.toLocaleString(),
            "Average Comments" : avgComments.toLocaleString()
        }
    }
}

function parseId(url, group) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(c\/)|(channel\/)|(@)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?^\/]*).*/;
    var match = url.match(regExp);
    
    return (match&&match[group])? match[group] : false;
}
