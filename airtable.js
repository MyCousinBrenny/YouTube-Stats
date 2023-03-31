var apiKey = '';
var table = base.getTable("Channel Stats");
var channelField = table.getField("YT Link");
var l12Views = table.getField("Last 12 - Avg Views");
var l12Likes = table.getField("Last 12 - Avg Likes");
var l12Comments = table.getField("Last 12 - Avg Comments");
var l90Views = table.getField("Last 90 Days - Avg Views");
var l90Likes = table.getField("Last 90 Days - Avg Likes");
var l90Comments = table.getField("Last 90 Days - Avg Comments");
var lastCalc = table.getField("Last Calc Date");
var videoStats = [];
var bucket = table.getField("Rate Card");

var parts = ['statistics', 'snippet', 'contentDetails'];
//Grabs urls from AirTable table
var query = await table.selectRecordsAsync({ fields: [channelField.id, lastCalc.id, bucket.id] });

//Parse out the channel name
var bareItems = query.records
    .map((record) => ({
        record: record,
        channelId: record.getCellValueAsString(channelField.id),
        lastCalcDate: record.getCellValue(lastCalc.id),
        bucket: record.getCellValueAsString(bucket.id)
    }))
    .filter((item) => item.channelId);

//Determine channel id from name, grab videos, and calculate the stats
for (let channel in bareItems) {
    var chanId;
    var vidsData = [];
    if (new Date(bareItems[channel].lastCalcDate) <= new Date(new Date().setDate(new Date().getDate() - 20)) && bareItems[channel].bucket.substring(0, 5) == 'Added') {
    } else {
        continue;
    }
    /*deprecated with new method of pulling direct from YT
    if (bareItems[channel].channelId[1] == 'channel/') {
        chanId = bareItems[channel].channelId[0];
    } else if (bareItems[channel].channelId[1] == false) {
        continue;
    } else {
        chanId = await channelId(apiKey, bareItems[channel].channelId[0])
    };*/
    chanId = await channelId(bareItems[channel].channelId)
    var uploadPlaylist = "UU" + chanId.substring(2);
    var nextToken = '';
    do {
        var vidDates = [];
        var vids = await channelData(apiKey, uploadPlaylist, nextToken);
        nextToken = vids.nextPage;
        vidsData.push(...await videoData(apiKey, vids.itemArray, parts));
        for (let dates in vidsData) {
            vidDates.push(new Date(vidsData[dates].date));
        }
        var oldestVid = vidDates[vidDates.length - 1];
    } while (oldestVid >= new Date(new Date().setDate(new Date().getDate() - 90)));

    let workingSet = [bareItems[channel].record.id, { last12: last12Stats(vidsData) }, { last90: last90Days(vidsData) }];
    let records = workingSet.map(() => ({
        id: workingSet[0],
        fields: {
            [l12Views.id]: workingSet[1].last12.averageViews,
            [l12Likes.id]: workingSet[1].last12.averageLikes,
            [l12Comments.id]: workingSet[1].last12.averageComments,
            [l90Views.id]: workingSet[2].last90.averageViews,
            [l90Likes.id]: workingSet[2].last90.averageLikes,
            [l90Comments.id]: workingSet[2].last90.averageComments,
            [lastCalc.id]: new Date()
        }
    }));

    await table.updateRecordsAsync(records);
}

output.text("Operation complete.");

//Deprecated this parseID as channelId not coming from url string anymore
//function parseId(url) {
//    var regExp = /^.*((youtu.be\/)|(v\/)|(.com\/)|(c\/)|(channel\/)|(@)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?^\/]*).*/;
//    var match = url.match(regExp);
//    
//    return [(match&&match[11].length>=0)? match[11] : false, (match&&match[11].length>=0)? match[6] : false];
//}

/*Deprecated this channelId and pulling direct from YT client code
async function channelId(key, chanName) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/search" +
        `?key=${key}&q=${chanName}&part=snippet`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }
    let chanData = await response.json();

    return (chanData.items[0].snippet.channelId);
}*/

async function channelId(chanLink) {
    let urlString;
    switch(chanLink.substring(0, 3)) {
        case 'you':
           urlString = 'https://www.' + chanLink;
           break;
        case 'www':
           urlString = 'https://' + chanLink;
           break;
        case 'htt':
            urlString = chanLink;
    }
    //let urlString = 'https://www.' + chanLink;
    let response = await remoteFetchAsync(urlString);
    let htmlString = await response.text();
    let result = htmlString.match(/,"externalId":"([^".]*)/);

    return result[1];
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
    var itemArray = [];
    for (var vids in channelVids.items) {
        itemArray[vids] = channelVids.items[vids].contentDetails.videoId;
    }
    let nextPage = channelVids.nextPageToken;

    return {
        'itemArray': itemArray,
        'nextPage': nextPage
    };
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
    for (let key in vidsData.items) {
        if (videoStats.length > 0) {
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
    return (videoStats);
}

//Last 12 Stats calc removes the videos with the hightest and lowest views, then calc the average views, likes, and comments for the middle 10 videos
function last12Stats(stats) {
    let i = 0
    let last12Vids = [];
    stats.sort((a, b) => a.date - b.date);
    for (let key = 0; last12Vids.length < 12; key++) {
        try {
            if (stats[key].length.includes('M')) {
                last12Vids[i] = stats[key];
                i++;
            }
        } catch (error) {
            break;
        }
    }
    last12Vids.sort((a, b) => a.views - b.views);
    last12Vids.shift();
    last12Vids.pop();
    let avgViews = last12Vids.reduce((a, b) => a + b.views, 0) / last12Vids.length;
    let avgLikes = last12Vids.reduce((a, b) => a + b.likes, 0) / last12Vids.length;
    let avgComments = last12Vids.reduce((a, b) => a + b.comments, 0) / last12Vids.length;

    return {
        'averageViews': avgViews,
        'averageLikes': avgLikes,
        'averageComments': avgComments
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
    for (let key in stats) {
        if (stats[key].length.includes('M') && new Date(stats[key].date) <= minDate && new Date(stats[key].date) >= maxDate) {
            last90Vids[i] = stats[key];
            i++;
        }
    }
    let avgViews = last90Vids.reduce((a, b) => a + b.views, 0) / last90Vids.length;
    let avgLikes = last90Vids.reduce((a, b) => a + b.likes, 0) / last90Vids.length;
    let avgComments = last90Vids.reduce((a, b) => a + b.comments, 0) / last90Vids.length;

    return {
        'averageViews': avgViews,
        'averageLikes': avgLikes,
        'averageComments': avgComments
    }
}