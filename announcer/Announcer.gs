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
  var user = e.parameter.user_name;
  var text = '';
  switch (e.parameter.trigger_word) {
    case 'tweet?:':
      text = setTweet(user, body, sheet);
      break;
    case 'tweet!:':
      var emessage = 'Few LGTM for tweet req: ' + body;
      text = checkLGTM(sheet, body) ? tweet(sheet, body) : emessage;
      break;
    case 'lgtm:':
    case 'LGTM:':
      text = addLGTM(sheet, user, body);
      break;
    default:
      text = 'undefined trigger word: ' + e.parameter.trigger_word;
  }
  var channelName = e.parameter.channel_name;
  Logger.log(slackApp.postMessage(channelName, text, option));
//  Logger.log(text)
}

function setTweet(user, body, sheet) {
  const rowNum = sheet.getLastRow() + 1;
  sheet.getRange(rowNum, 1).setValue(body);
  sheet.getRange(rowNum, 2).setValue(1);
  sheet.getRange(rowNum, 3).setValue(user);
  return 'set tweet request: ' + rowNum;
}

function checkLGTM(sheet, rowNum) {
  const condNum = 4;
  return sheet.getRange(rowNum, condNum).getValue() != '';
}

function addLGTM(sheet, user, rowNum) {
  var colNum = sheet.getRange(rowNum, 2).getValue();
  var users = sheet.getRange(rowNum, 3, 1, colNum).getValues()[0];
  for (var i = 0; i < users.length; i++) {
    if (users[i] == user)
      return '' + user + ' already done LGTM.'
  }
  sheet.getRange(rowNum, colNum + 3).setValue(user);
  return 'OK thanks!';
}

function tweet(sheet, rowNum) {
  var result = postTweet(sheet.getRange(rowNum, 1).getValue());
  if (result != 'error') {
    return 'Success!\n' + 'https://twitter.com/IGGGorg_PR/status/' + result['id_str'];
  } else {
    return 'Denied...';
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
      payload: payload
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
      text: 'tweet?:\nhello test!!\nhttps://www.iggg.org',
      channel_name: 'bot-test',
      trigger_word: 'tweet?:',
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
      text: 'tweet!: 1',
      channel_name: 'bot-test',
      trigger_word: 'tweet!:',
      user_name: 'noob'
    }
  }
  doPost(e);
}

function test3() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: 'lgtm: 1',
      channel_name: 'bot-test',
      trigger_word: 'lgtm:',
      user_name: 'gion'
    }
  }
  doPost(e);
}