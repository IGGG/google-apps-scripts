function doPost(e) {
  
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  const BOT_NAME = 'Gunmar';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;

  const COLUMN_NUM = 4;

  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error("invalid token.");
  }
  
  /* Load Spread Sheet */  
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var table = sheet.getRange(1, 1, prop.ROW_NUM, COLUMN_NUM).getValues();
    
  /* Post Message to Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  for(var i = 0; i < table.length; i++) {
    var exist = table[i][0];
    var id    = table[i][1];
    var name  = table[i][2];
    
    Logger.log(table[i]);
    
    if (exist == 1 && id != "")
      slackApp.postMessage(prop.CHANNEL_ID, name + " が居ます。", option);    
  }
}
