function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error("invalid token.");
  }

  /* Load Spread Sheet */
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var rowNum = sheet.getLastRow();
//  var table = sheet.getRange(1, 1, rowNum, 2).getValues();
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'manager';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  var message = e.parameter.text.split(' ');
  var channelId = e.parameter.channel_id;
  
  if (message[0] != ('@' + BOT_NAME)) {
    throw new Error("invalid bot name.");
  }
  
  var subcmd = message[1];
  switch(subcmd) {
    case "hi":
      text = "hi";
      break;
    default:
      text = "undefined cmd: " + subcmd;
      break;
  }

  sheet.getRange(rowNum + 1, 1).setValue(message);
  slackApp.postMessage(channelId, text, option);  
}

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: "@manager hi",
      channel_id: "bot-test"
    }
  }
  doPost(e);
}