function doPost(e) {
  var jsonString = e.postData.getDataAsString();
  var jsonData = JSON.parse(jsonString);
    
  postMessage(jsonData);
}

function postMessage(data) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const repo = prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO;
  
  if (data['repository']['full_name'] != repo && data['comment'] != undefined && data['issue'] != undefined) {
    throw new Error('invalid repository.');
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
  
  var message = makeMessage(data['action'], data['comment'], data['issue'], repo, prop);
  Logger.log(message);
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'manager';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };

  var _ = Underscore.load();
  channels.forEach(function(channelName){
    option = _.extend(option, message);
    Logger.log(slackApp.postMessage(channelName, '', option));  
  })
}

function makeMessage(action, comment, issue, repo, prop) {
  var user = '<' + comment['user']['html_url'] + '|' + comment['user']['login'] + '>';
  var issueTitle = '<' + comment['html_url'] + '|' + '#' + issue['number'] + ': ' + issue['title'] + '>';

  var actionText = '';
  var text = '';
  switch(action) {
    case 'created':
      actionText = 'New';
      text = comment['body'];
      break;
    case 'edited':
      actionText = 'Edit';
      text = getIssueCommentBody(comment['id'], prop);
      break;
    case 'deleted':
      actionText = 'Delet';
      text = comment['body'];
      break;
  }
  
  var pretext = '[' + repo + '] ' + actionText + ' comment by ' + user + ' on isuue ' + issueTitle;
  return {
    'attachments': JSON.stringify([{
      'pretext': pretext,
      'color': prop.COLOR,
      'text': text
    }])
  };
}

function getIssueCommentBody(id, prop) {
  var github = GitHubAPI.create(prop.GITHUB_OWNER, prop.GITHUB_REPO, prop.GITHUB_API_TOKEN);
  var comment = github.get('/issues/comments/' + id);
  return comment['body'];
}


function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var data = {
    'action': 'edited',
    'repository': {
      'full_name': prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO
    },
    'issue': {
      'number': 15,
      'title': 'このリポジトリは必要か'
    },
    'comment': {
      'user': {
        'login': 'matsubara0507',
        'html_url': 'https://github.com/matsubara0507'
      },
      'html_url': 'https://github.com/' + prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO + '/issues/15#issuecomment-301657645',
      'body': 'テストテスト',
      'id': 301657645
    }
  };
  postMessage(data);
}