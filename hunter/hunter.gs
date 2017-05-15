function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();

  const BOT_NAME = 'hunter';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;

  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error("invalid token.");
  }

  /* Load Spread Sheet */  
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var names = sheet.getRange(1, 1, prop.ROW_NUM, prop.COLUMN_NUM).getValues();

  /* Post Message to Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
//  var message = 'hunter'.split(' ');
//  var channelId = '#bot-test';
  var message = e.parameter.text.split(' ');
  var channelId = e.parameter.channel_id;
  
  Logger.log(message);
  if (message[0] != BOT_NAME) {
    slackApp.postMessage(channelId, message[0], option);
  }
  var subcmd = message[1];  
  switch(subcmd) {
    case 'hunt!':
      Logger.log(names);
      var unuseNames = names.filter(
        function(row){
          return row[1] == 0;
        });
      Logger.log(unuseNames);
      var row_num = Math.floor(Math.random() * unuseNames.length);
      var text = 'not found unusing name.';
      if (unuseNames.length > 0) {
        text = unuseNames[row_num][0];
        updateSheet(sheet, names, text, prop);
      }
      break;
//    case 'reset':
//      names = names.map(function(row){ return [row[0],0] });
//      sheet.getRange(1, 1, prop.ROW_NUM, prop.COLUMN_NUM).setValues(names);
//      text = 'reset!!';
//      break;
    case undefined: 
      subcmd = " "
    default:
      text = 'I can hunt!!';
      if (subcmd.slice(-1) == '?') {
        var text = lookupAnimalUrl(subcmd.slice(0, subcmd.length - 1), prop);
      }
      break;
  }
  Logger.log(text);
  slackApp.postMessage(channelId, text, option);
}

function updateSheet(sheet, names, name, prop) {
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] == name) {
      sheet.getRange(i+1, 2).setValue(1);
      return true;
    }
  }
  return false;
}

function lookupAnimalUrl(name, prop) {
  var sheet = SpreadsheetApp.openById(prop.ANIMAL_SHEET_ID).getSheetByName(prop.ANIMAL_SHEET_NAME);
  var names = sheet.getRange(1, 1, prop.ROW_NUM, prop.COLUMN_NUM + 1).getValues();
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] == name) {
      return names[i][2];
    }
  }
  return "not found " + name + ".";
}