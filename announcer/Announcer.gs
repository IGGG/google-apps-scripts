function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error('invalid token.');
  }
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'announcer';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  var message = e.parameter.text.split('\n');
  var channelName = e.parameter.channel_name;
  
  if (message[0] != ('@' + BOT_NAME)) {
    throw new Error('invalid bot name.');
  }
  
  var text = '';
  var messageBody = message.slice(1, message.length).join('\n');
  if (messageBody.indexOf('http') == -1) {
    text = 'Denied: do not include "http".';
  } else {
    var result = tweet(messageBody);
    if (result != 'error') {
      text = 'Success!\n' + 'https://twitter.com/IGGGorg_PR/status/' + result['id_str'];
    } else {
      text = 'Denied...';
    }
  }
  Logger.log(slackApp.postMessage(channelName, text, option));
}

/**
 * Authorizes and makes a request to the Twitter API.
 */
function tweet(text) {
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

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: '@announcer\nhello test!!\nhttps://www.iggg.org',
      channel_name: 'bot-test'
    }
  }
  doPost(e);
}