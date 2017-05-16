function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const repo = prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO;
  
//  var jsonString = e.postData.getDataAsString();
//  var jsonData = JSON.parse(jsonString);
  
  var data = e.parameter;
  
  if (data['repository']['full_name'] != repo) {
    throw new Error("invalid repository.");
  }
  
  var number = data['issue']['number'];

  /* Load Spread Sheet */
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var rowNum = sheet.getLastRow();
  var table = sheet.getRange(1, 1, rowNum+1, 2).getValues();
  
  var channels = table.filter(function(row){
    return row[1] == number;
  }).map(function(row){ return row[0] });
  Logger.log(channels);
  
  var message = makeMessage(data, prop);
  Logger.log(message);
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'manager';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };

  var _ = Underscore.load();
  channels.forEach(function(channelId){
    option = _.extend(option, message);
    Logger.log(slackApp.postMessage(channelId, '', option));  
  })
}

function makeMessage(data, prop) {
  var action = '';
  switch(data['action']) {
    case 'created':
      action = 'New';
      break;
    case 'edited':
      action = 'Edit';
      break;
    case 'deleted':
      action = 'Delet';
      break;
  }
  var user = '<' + data['comment']['user']['html_url'] + '|' + data['comment']['user']['login'] + '>';
  var issue = '<' + data['comment']['html_url'] + '|' + '#' + data['issue']['number'] + ': ' + data['issue']['title'] + '>';
  var pretext = '[' + data['repository']['full_name'] + '] ' + action + ' comment by ' + user + ' on isuue ' + issue;
  return {
    'attachments': JSON.stringify([{
      'pretext': pretext,
      'color': prop.COLOR,
      'text': data['comment']['body']
    }])
  };
}

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var data = {
    'action': 'created',
    'repository': {
      'full_name': prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO
    },
    'issue': {
      'number': 1,
      'title': 'このリポジトリは必要か'
    },
    'comment': {
      'user': {
        'login': 'matsubara0507',
        'html_url': 'https://github.com/matsubara0507'
      },
      'html_url': 'https://github.com/IGGG/management/issues/1#issuecomment-294675028',
      'body': 'ということで、閉じてもいいかね？(テスト)'
    }
  };
  doPost({ 'parameter': data });
}