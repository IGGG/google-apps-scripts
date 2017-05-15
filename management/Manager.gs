function doPost(e) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  if (prop.VERIFY_TOKEN != e.parameter.token) {
    throw new Error("invalid token.");
  }

  /* Load Spread Sheet */
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var rowNum = sheet.getLastRow();
  
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
  
  var _ = Underscore.load();
  var subcmd = message[1];
  var text = "";

  switch(subcmd) {
    case "hi":
      text = "hi";
      break;
    case "set-issue:":
      var number = message[2];
      var result = getIssue(number, prop);
      Logger.log(result);
      if (result == "error") {
        text = "issuer #" + number + " is not exist.";
      } else {
        text = "OK! set issue."
        option = _.extend(option, result);
        sheet.getRange(rowNum + 1, 1).setValue(channelId);
        sheet.getRange(rowNum + 1, 2).setValue(number);
      }
      break;
    case "unset-issue:":
      var number = message[2];
      var table = sheet.getRange(1, 1, rowNum, 2).getValues();
      text = "not set yet: " + channelId + "-" + number;
      for(var i = 0; i < table.length; i++) {
        if (table[i][0] == channelId && table[i][1] == number) {
          sheet.getRange(i + 1, 1).setValue('');
          sheet.getRange(i + 1, 2).setValue('');
          text = "OK! unset issue.";
        }
      }
      break;
    default:
      text = "undefined cmd: " + subcmd;
      break;
  }

  Logger.log(option);
  Logger.log(slackApp.postMessage(channelId, text, option));
}

function getIssue(number, prop) {
  var github = GitHubAPI.create(prop.GITHUB_OWNER, prop.GITHUB_REPO, prop.GITHUB_API_TOKEN);
  var issue = github.get("/issues/" + number);
  var user = '<' + issue["user"]["html_url"] + '|' + issue["user"]["login"] + '>';
  var pretext = '[' + prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO + ']  Issue created by ' + user; 
  var title = '#' + number + ' ' + issue["title"];
  var title_link = issue["html_url"];  
  return {
    'attachments': JSON.stringify([{
      'pretext': pretext,
      'title': title,
      'title_link': title_link,
      'color': prop.COLOR,
      'text': issue["body"]
    }])
  };
}

function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var e = { 
    parameter: {
      token: prop.VERIFY_TOKEN,
      text: "@manager unset-issue: 1",
      channel_id: "bot-test"
    }
  }
  doPost(e);
}