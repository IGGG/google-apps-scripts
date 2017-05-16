function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error('invalid token.');
  }

  /* Load Spread Sheet */
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var rowNum = sheet.getLastRow();
  var table = sheet.getRange(1, 1, rowNum, 2).getValues();
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'manager';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };
  
  var message = e.parameter.text.split(' ');
  var channelName = e.parameter.channel_name;
  
  if (message[0] != ('@' + BOT_NAME)) {
    throw new Error('invalid bot name.');
  }
  
  var _ = Underscore.load();
  var subcmd = message[1];
  var text = '';

  switch(subcmd) {
    case 'hi':
      text = 'hi';
      break;
    case 'set-issue:':
      var number = message[2];
      var issue = getIssue(number, prop);
      Logger.log(issue);
      if (issue == 'error') {
        text = 'issuer #' + number + ' is not exist.';
        break;
      } 
      if (existRow(table, channelName, number)) {
        text = 'issue <' + issue['html_url'] + '| #' + number + '> has already been set for #' + channelName;
      } else {
        text = 'OK! set issue.';
        var repo = prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO;
        option = _.extend(option, makeMessage(issue, repo, prop));
        sheet.getRange(rowNum + 1, 1).setValue(channelName);
        sheet.getRange(rowNum + 1, 2).setValue(number);
      }
      break;
    case 'unset-issue:':
      var number = message[2];
      text = 'not set yet: ' + channelName + ' - ' + number;
      for(var i = 0; i < table.length; i++) {
        if (table[i][0] == channelName && table[i][1] == number) {
          sheet.getRange(i + 1, 1).setValue('');
          sheet.getRange(i + 1, 2).setValue('');
          text = 'OK! unset issue.';
        }
      }
      break;
    default:
      text = 'undefined cmd: ' + subcmd;
      break;
  }

  Logger.log(option);
  Logger.log(slackApp.postMessage(channelName, text, option));
}

function existRow(table, channelName, number) {
  for (var i = 0; i < table.length; i++) {
    if (table[i][1] == number && table[i][0] == channelName)
      return true;
  }
  return false;
}

function getIssue(number, prop) {
  var github = GitHubAPI.create(prop.GITHUB_OWNER, prop.GITHUB_REPO, prop.GITHUB_API_TOKEN);
  var issues = github.get('/issues?state=all');
  for (var i = 0; i < issues.length; i++) {
    if (issues[i]['number'] == number)
      return issues[i];
  }
  return 'error';
}

function makeMessage(issue, repo, prop) {
  var user = '<' + issue['user']['html_url'] + '|' + issue['user']['login'] + '>';
  var pretext = '[' + repo + ']  Issue created by ' + user; 
  var title = '#' + issue['number'] + ' ' + issue['title'];
  var title_link = issue['html_url'];
  return {
    'attachments': JSON.stringify([{
      'pretext': pretext,
      'title': title,
      'title_link': title_link,
      'color': prop.COLOR,
      'text': issue['body']
    }])
  };
}

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: '@manager set-issue: 1',
      channel_name: 'bot-test'
    }
  }
  doPost(e);
}