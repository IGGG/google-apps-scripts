# Slack Bot for management

IGGGには運営方法やリソース管理などの議論を行うためのプライベートリポジトリがある。
そのリポジトリの Issue を利用して、部内の問題提起や議論をしている。

そのリポジトリの更新通知は GitHub integration を利用して Slack の特定のチャネルに飛ばしているが、それ以外のチャネルでも見たい時がある。
例えば、インフラに関する事ならインフラ用のチャネル、勉強会に関する事なら勉強会のチャネルなど。
Issue 単位でチャネルと結びつけることは、既存の GitHub Integration ではできないので、そのための Slack Bot である。

関連付けの対応表はスプレッドシートを利用して残してる。

## 種類

- **WriteManager** : 
  - Slack からのメッセージを受け取って Issue とチャネルの関連付けを行う
  - `@manager set-issue: 1` で関連付け
  - `@manager unset-issue: 1` で逆に関連付けを解く
- **ReadManager** :
  - GitHub のリポジトリに Webhook して Issue のコメントを関連付けしたチャネルに飛ばす。 
  - コメントの編集や削除も通知される
