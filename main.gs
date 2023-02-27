// すべてのクラスの名前とIDを取得
function getClasses() {
  var optionalArgs = {
    pageSize: 20 // 取得最大数
  };
  var response = Classroom.Courses.list(optionalArgs)['courses'];
  var classesList = [];
  for (var i = 0; i <= response.length - 1; i++) {
    var childArr = { 'className': response[i]['name'], 'classId': response[i]['id'] };
    classesList.push(childArr);
  }
  return classesList;
}

// クラス内の投稿情報を取得
// 引数にはクラスIDを入れる
function getClassPost(classId) {
  var posts = Classroom.Courses.Announcements.list(classId)['announcements'];
  return posts;
}

// 一つ一つの投稿情報を取得
// 第一引数にはクラスIDを、第二引数には指定したクラス内の最新から何番目の投稿情報が欲しいかを入力
function getPostInfo(classId, num) {
  var posts = getClassPost(classId);
  var postInfo = posts[num];
  return postInfo;
}

// 送信プログラム
//引数には送信物リストを
// 引数のarr内には既存の要素に追加してクラス名を追加しなくてはならない
function send(arr) {
  // リスト内の数だけ送信を実行
  for (var i = 0; i <= arr.length - 1; i++) {
    var target = arr[i];
    // 送信情報を定義
    var className = target['className']; // クラス名
    var content = target['text']; // 投稿されたコンテンツ
    var time = target['creationTime']; // 投稿時間
    // 時間の時差,フォーマットの変更
    var time = new Date(time).toLocaleString();
    var time = new Date(time);
    var timeHour = time.getHours();
    var timeHour = ('00' + timeHour).slice(-2);
    var timeMin = time.getMinutes();
    var timeMin = ('00' + timeMin).slice(-2);
    var userId = target['creatorUserId']; // 投稿者ID
    // 投稿者IDから名前を指定
    var creatorProfile = Classroom.UserProfiles.get(userId);
    var userName = creatorProfile.name.fullName;

    // Discordへの送信プログラム
    var WEBHOOK_URL = 'DISCORD_WEBHOOK_URL'; // Discord webhook urlを入力
    const payload = {
      "content": "新規投稿がありました",
      "tts": false,
      "embeds": [
        {
          "title": className,
          // 色を指定
          "color": parseInt("008000", 16),
          "fields": [
            {
              "name": `${userName} [${timeHour}:${timeMin}]`,
              "value": content
            }
          ]
        }
      ]
    }
    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });
  }
}

function main() {
  // 実際にbotで送信される投稿リストを定義
  var sendArr = [];

  // 存在するクラスの数だけ繰り返す
  for (var i = 0; i <= getClasses().length - 1; i++) {
    var classId = getClasses()[i]['classId']; // クラスID
    var className = getClasses()[i]['className']; // クラス名

    // 最大適応投稿数を定義
    if (getClassPost(classId) == undefined) {
      var maxPost = 0;
    } else if (getClassPost(classId).length >= 5) {
      var maxPost = 5;
    } else {
      var maxPost = getClassPost(classId).length;
    }

    if (maxPost != 0) { // 投稿が0の場合は除外
      // maxPost分の投稿が条件を満たしているかチェック
      for (var n = 0; n <= maxPost - 1; n++) {
        var postInfo = getPostInfo(classId, n);

        // 投稿時刻の取得&変換
        var createTime = postInfo['creationTime'];
        var createTime = new Date(createTime);
        var createTime = createTime.getTime();
        // 現在時刻の取得&変換
        var nowTime = new Date();
        var nowTime = nowTime.toGMTString();
        var nowTime = new Date(nowTime);
        var nowTime = nowTime.getTime();

        // 投稿時間が5分(300,000ミリ秒)以内かどうか確認
        if (nowTime - createTime <= 300000) {
          // 投稿情報にクラス名を追加
          postInfo['className'] = className;
          // 5分以内***送信用リストに投稿を追加
          sendArr.push(postInfo);
        } else {
          // 5分以上***特になし
        }
      }
    }
  }

  // 送信するものがあればsend()関数に送る
  if (sendArr.length != 0) {
    send(sendArr);
  }
}
