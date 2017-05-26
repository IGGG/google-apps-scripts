function doPost(e) {
  var jsonString = e.postData.getDataAsString();
  var jsonData = JSON.parse(jsonString);
  postMessage(jsonData, 'general');
}

function postMessage(data, channelName) {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const repo = prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO;
  
  if (data['repository']['full_name'] != repo && data['comment'] == undefined && data['issue'] != undefined) {
    throw new Error("invalid repository.");
  }
  
  if (data['action'] != 'opened'
      && data['action'] != 'closed' 
      && data['action'] != 'reopened') {
    throw new Error("undefined action: " + data['action']);
  }
  
  var number = data['issue']['number'];
 
  var message = makeMessage(data['action'], data['issue'], repo, data['sender'], prop);
  Logger.log(message);
  
  /* for Slack */
  var slackApp = SlackApp.create(prop.SLACK_API_TOKEN);

  const BOT_NAME = 'manager';
  const BOT_ICON = 'http://drive.google.com/uc?export=view&id=' + prop.ICON_ID;
  var option = { username : BOT_NAME, icon_url : BOT_ICON, link_names : 1 };

  var _ = Underscore.load();
  Logger.log(slackApp.postMessage(channelName, '', _.extend(option, message)));
}

function makeMessage(action, issue, repo, sender, prop) {
  var user = '<' + sender['html_url'] + '|' + sender['login'] + '>';

  var actionText = '';
  var text = '';
  switch(action) {
    case 'opened':
      actionText = 'created';
      text = issue['body'];
      break;
    case 'closed':
      actionText = 'closed';
      text = getIssueResentCommentBody(issue['number'], prop);
      break;
    case 'reopened':
      actionText = 're-opened';
      text = issue['body'];
      break;
  }
  
  var pretext = '[' + repo + '] Issue ' + actionText + ' by ' + user;
  return {
    'attachments': JSON.stringify([{
      'pretext': pretext,
      'title': '#' + issue['number'] + ': ' + issue['title'],
      'title_link': issue['html_url'],
      'color': prop.COLOR,
      'text': text,
      'footer': '詳細は #management かリポジトリで'
    }])
  };
}

function getIssueResentCommentBody(number, prop) {
  var github = GitHubAPI.create(prop.GITHUB_OWNER, prop.GITHUB_REPO, prop.GITHUB_API_TOKEN);
  var comment = github.get("/issues/" + number + "/comments");
  return comment[comment.length-1]['body'];
}


function test() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  var data = {
    'action': 'closed',
    'repository': {
      'full_name': prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO
    },
    'issue': {
      'number': 15,
      'title': 'このリポジトリは必要か',
      'user': {
        'login': 'matsubara0507',
        'html_url': 'https://github.com/matsubara0507'
      },
    'html_url': 'https://github.com/' + prop.GITHUB_OWNER + '/' + prop.GITHUB_REPO + '/issues/15',
    'body': 'なんか知らぬ間に決まってる感じもある\n自分で見に行けってのもあるけどサ'
    },
    'sender': {
      'login': 'matsubara0507',
      'html_url': 'https://github.com/matsubara0507'
    }
  };
  postMessage(data, 'bot-test');
}

