function hurry() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  const DAYS = [ '12/01', '12/02', '12/03', '12/04', '12/05'
               , '12/06', '12/07', '12/08', '12/09', '12/10'
               , '12/11', '12/12', '12/13', '12/14', '12/15'
               , '12/16', '12/17', '12/18', '12/19', '12/20'
               , '12/21', '12/22', '12/23', '12/24', '12/25' 
               ];
  const COLUMN_NUM = 5;
  const URL = 'http://www.adventar.org/calendars/' + prop.ADVENTAR_ID;  

  const BOT_NAME = 'Gunmer';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  
  /* Scraping */
  var html = UrlFetchApp.fetch(URL).getContentText();
  var table = parseByTagAndClassId(html, 'table', 'mod-entryList');
  // Entry is [date, user name, comment, title, url]
  var entries = Parser.data(table)
                      .from('<tr class="" id="list-')   
                      .to('</tr>')
                      .iterate()
                      .map(function(entry){ return parseEntry(entry, prop.YEAR); });
  
  /* Load Spread Sheet */  
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.YEAR);
  var oldEntries = sheet.getRange(1, 1, DAYS.length, COLUMN_NUM).getValues();
  
  /* Update Spread Sheet */
  var newEntries = DAYS.map(function(d) { return [prop.YEAR + '/' + d,'','','','']; });
  entries.map(
    function(entry){
      newEntries[getIndexByDate(newEntries, entry[0])] = entry;
    });
  sheet.getRange(1, 1, DAYS.length, COLUMN_NUM).setValues(newEntries);
  
  var today = new Date();

  /* Post Message to Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  for(var i = 0; i < newEntries.length; i++) {
    var text = null;
    switch(diffEntry(newEntries[i], oldEntries[i])) {
      case 'updated':
        text = '更新がありました！\n' + makeMessage(newEntries[i]);
        break;
      case 'added_entry':
        text = '新しい記事です！\n' + makeMessage(newEntries[i]);
        break;
      case 'deleted_entry':
        var text = 'キャンセルがありました...\n' 
                 + newEntries[i][0] +' の記事です';
        break;
      case "no_update":
        if(i == today.getDate() - 1 && newEntries[i][4] == '') {
          switch(today.getHours()) {
            case 0:
              text = '@' + newEntries[i][1] + '、日付変わったで。';
              break;
            case 12:
              text = '@' + newEntries[i][1] + '、進捗どーですか？';
              break;
            case 23:
              text = '@' + newEntries[i][1] + '、おい大丈夫か？';
              break;
            default:
              text = '@' + newEntries[i][1] + '、はよ。';
              break;
          }
        }
        break;
    }
    if (text != null) {
      //Logger.log(text);
      slackApp.postMessage(prop.CHANNEL_ID, text, option);
    }
  }  
}
