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
  
  var text = message.slice(1, message.length).join('\n');
  Logger.log(slackApp.postMessage(channelName, text, option));
}

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: '@announcer\nhello test!',
      channel_name: 'bot-test'
    }
  }
  doPost(e);
}