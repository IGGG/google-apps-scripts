function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error('invalid token.');
  }
  
  /* Load Spread Sheet */
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'announcer';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  var body = e.parameter.text.slice(e.parameter.trigger_word.length).trim();
  var timestamp = e.parameter.timestamp;
  var channelId = e.parameter.channel_id;
  var text = '';
  var _ = Underscore.load();
  switch (e.parameter.trigger_word) {
    case '$tweet?':
      const rowNum = sheet.getLastRow() + 1;
      setTweetRequest(sheet, _.extend(e.parameter, {body: body, num: rowNum}));
      text = 'set tweet request: ' + rowNum;
      break;
    case '$tweet!':
      var tr = getTweetRequest(sheet, body);
      if (tr.ok) {
        var result = tweetWithCheck(tr, prop.SLACK_API_TOKEN);
        if (result.ok)
          sheet.getRange(tr.num, 4).setValue(1);
        text = result.text;
      } else {
        text = tr.error;
      }
      break;
    default:
      text = 'undefined trigger word: ' + e.parameter.trigger_word;
  }
  Logger.log(slackApp.postMessage(channelId, text, option));
//  Logger.log(text);
}

function getTweetRequest(sheet, rowNum) {
  if (isNaN(rowNum)) {
    return { ok: false, error: 'please input number: ' + rowNum };
  }
  var body = sheet.getRange(rowNum, 1).getValue();
  if (body == '') {
    return { ok: false, error: 'not found tweet request: ' + rowNum }; 
  }
  return {
    ok: true,
    body: body,
    channel_id: sheet.getRange(rowNum, 2).getValue(),
    timestamp: sheet.getRange(rowNum, 3).getValue().slice(1),
    num: rowNum,
    done: sheet.getRange(rowNum, 4).getValue() == 1
  };
}

function setTweetRequest(sheet, tr) {
  sheet.getRange(tr.num, 1).setValue(tr.body);
  sheet.getRange(tr.num, 2).setValue(tr.channel_id);
  sheet.getRange(tr.num, 3).setValue('t' + tr.timestamp);  
  sheet.getRange(tr.num, 4).setValue(tr.done ? 1 : 0);
}

function tweetWithCheck(tr, token) {
  if (tr.done) {
    return { ok: false, text: 'TR ' + tr.num + ' has already been tweeted.' };
  }
  var url = 'https://slack.com/api/reactions.get';
  var options = {
    method: 'post',
    payload: {
      token: token,
      channel: tr.channel_id,
      timestamp: tr.timestamp
    }
  };
  var result = JSON.parse(UrlFetchApp.fetch(url, options));
  if (!result.ok) {
    return { ok: false, text: 'error: ' + result.error }; 
  }
  const borderline = 2;
  var lgtm = 0;
  for (var i in result.message.reactions) {
    var reaction = result.message.reactions[i];
    if (reaction.name == '+1') {
      lgtm = reaction.count;
    }
  }
  var emassage = 'Few :+1: for tweet req: need ' + borderline + ', now ' + lgtm;
  return lgtm >= borderline ? tweet(tr) : { ok: false, text: emassage }
}

function tweet(body) {
  var result = postTweet(body);
//  var result = { id_str: 'tweet!!' };
  if (result == 'error') {
    return { ok: false, text: 'Denied...' };
  } else if (result.errors != undefined) {
    return { ok: false, text: 'Denied: ' + result.errors[0].code + ' ' + result.errors[0].message };
  } else {
    return { ok: true, text: 'Success!\n' + 'https://twitter.com/IGGGorg_PR/status/' + result['id_str'] };
  }
}

/**
 * Authorizes and makes a request to the Twitter API.
 */
function postTweet(text) {
  var service = getService();
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/statuses/update.json';
    var payload = {
      status: text
    };
    var response = service.fetch(url, {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
    return 'error';
  }
} 

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  var prop = PropertiesService.getScriptProperties().getProperties();  
  return OAuth1.createService('Twitter')
      // Set the endpoint URLs.
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')

      // Set the consumer key and secret.
      .setConsumerKey(prop.TWITTER_CONSUMER_KEY)
      .setConsumerSecret(prop.TWITTER_CONSUMER_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied');
  }
}

function test1() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: '$tweet?\nhello test!!\nhttps://www.iggg.org',
      channel_id: 'C4YNUSZN0',
      channel_name: 'bot-test',
      timestamp: '1496052878.354975',
      trigger_word: '$tweet?',
      user_name: 'noob'
    }
  }
  doPost(e);
}

function test2() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: '$tweet! 1',
      channel_name: 'bot-test',
      trigger_word: '$tweet!',
      user_name: 'noob'
    }
  }
  doPost(e);
}
