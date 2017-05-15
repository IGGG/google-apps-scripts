function postMessage() {
  
}

function doPost(e) {

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
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error("invalid token.");
  }
  
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
  
  /* Post Message to Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  var noUpdate = true;
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
    }
    if (text != null) {
      slackApp.postMessage(prop.CHANNEL_ID, text, option);
      noUpdate = false;
    }
  }
  if (noUpdate)
    slackApp.postMessage(prop.CHANNEL_ID, "更新はありません", option);    
}

function makeMessage(entry) {
  var title = entry[3];
  if (title == '')
    title = 'link this!';
  
  var message = entry[0] + ' : @' + entry[1] + '\n'
              + entry[2] + '\n';

  var url = entry[4];
  if (url != '')
   message = message + '<' + url + '|' + title + '>' ;
  return message;  
}

function diffEntry(newEntry, oldEntry) {
  // date is instance of Date Class from Spread Sheet
  // otherwise String
  // So, no chaeck date equality
  var equality = true;
  for (var i = 1; i < newEntry.length; i++)
    equality = equality && newEntry[i] == oldEntry[i];
  
  if (equality) 
    return 'no_update';
  if (isEntry(newEntry) && isEntry(oldEntry))
    return 'updated';
  if (isEntry(newEntry))
    return 'added_entry';
  if (isEntry(oldEntry))
    return 'deleted_entry';

  return "undefined";
}

function isEntry(entry) {
  return !(entry[1] == '' || entry[1] == undefined || entry[1] == null);
}

function parseByTagAndClassId(data, tag, classId) {
  var temp = Parser.data(data)
                   .from('<' + tag + ' class="' + classId + '"')
                   .to('</' + tag + '>')
                   .build();
  return temp.substring(temp.indexOf('>') + 1, temp.length);
}

function parseByTag(data, tag) {
  var temp = Parser.data(data)
                   .from('<' + tag)
                   .to('</' + tag + '>')
                   .build();
  return temp.substring(temp.indexOf('>') + 1, temp.length);
}

function parseEntry(entry, year) {
  var date = year + '/' + parseByTagAndClassId(entry, 'th', 'mod-entryList-date');
  var user = parseByTag(parseByTagAndClassId(entry, 'a', 'mod-userLink'), 'span').trim();
  var comment = parseByTagAndClassId(entry, 'div', 'mod-entryList-comment').trim();
  var title = parseByTagAndClassId(entry, 'div', 'mod-entryList-title').trim();
  var url = parseByTag(parseByTagAndClassId(entry, 'div', 'mod-entryList-url'), 'a');
  
  return [date,user,comment,title,url];
}

function getIndexByDate(entries, date) {
  for (var i = 0; i < entries.length; i++) {
    if (entries[i][0] == date)
      return i;
  }
  return null;
}
