const line = require('@line/bot-sdk');
const express = require('express');

// 環境変数の設定
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

// LINE SDK設定
const client = new line.Client(config);

// Express app設定
const app = express();

// 職種マッピング
const OCCUPATION_MAP = {
  dentist: { id: 1, name: "歯科医師", emoji: "🦷" },
  hygienist: { id: 2, name: "歯科衛生士", emoji: "✨" },
  technician: { id: 3, name: "歯科技工士", emoji: "🔧" },
  assistant: { id: 4, name: "歯科助手", emoji: "🤝" },
  reception: { id: 5, name: "受付", emoji: "📋" },
  clerk: { id: 6, name: "医療事務", emoji: "💼" }
};

// 都道府県マッピング（主要都市）
const PREFECTURE_MAP = {
  tokyo: { id: 13, name: "東京都", emoji: "🗼" },
  kanagawa: { id: 14, name: "神奈川県", emoji: "⛰️" },
  osaka: { id: 27, name: "大阪府", emoji: "🏯" },
  aichi: { id: 23, name: "愛知県", emoji: "🏭" },
  fukuoka: { id: 40, name: "福岡県", emoji: "🌸" },
  hokkaido: { id: 1, name: "北海道", emoji: "❄️" }
};

// URLビルダー関数
function buildMediclockJobURL(occupationKey, prefectureKey) {
  const occupation = OCCUPATION_MAP[occupationKey];
  const prefecture = PREFECTURE_MAP[prefectureKey];
  
  if (!occupation || !prefecture) {
    throw new Error('Invalid occupation or prefecture key');
  }

  const baseURL = 'https://mediclock-job.com/job';
  const params = new URLSearchParams();
  
  params.append('keyword', '');
  params.append('keyword', '');
  params.append('occupation_id', occupation.id);
  params.append('pref_id[]', prefecture.id);
  params.append('salary[1][min]', '');
  params.append('salary[2][min]', '');
  params.append('salary[3][min]', '');
  params.append('salary[4][min]', '');
  
  // UTMパラメータ
  params.append('utm_source', 'line');
  params.append('utm_medium', 'bot');
  params.append('utm_campaign', 'job_search');
  params.append('utm_content', `${occupationKey}-${prefectureKey}`);

  return `${baseURL}?${params.toString()}`;
}

// 職種選択のクイックリプライを生成
function createOccupationQuickReply() {
  return {
    type: 'quickReply',
    items: Object.entries(OCCUPATION_MAP).map(([key, data]) => ({
      type: 'action',
      action: {
        type: 'postback',
        label: `${data.emoji} ${data.name}`,
        data: `action=select_occupation&occupation=${key}`
      }
    }))
  };
}

// 都道府県選択のクイックリプライを生成
function createPrefectureQuickReply(occupationKey) {
  return {
    type: 'quickReply',
    items: Object.entries(PREFECTURE_MAP).map(([key, data]) => ({
      type: 'action',
      action: {
        type: 'postback',
        label: `${data.emoji} ${data.name}`,
        data: `action=select_prefecture&occupation=${occupationKey}&prefecture=${key}`
      }
    }))
  };
}

// 検索結果のFlexメッセージを生成
function createResultFlexMessage(occupationKey, prefectureKey) {
  const occupation = OCCUPATION_MAP[occupationKey];
  const prefecture = PREFECTURE_MAP[prefectureKey];
  const searchURL = buildMediclockJobURL(occupationKey, prefectureKey);
  
  return {
    type: 'flex',
    altText: `${occupation.name} × ${prefecture.name}の求人検索結果`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔍 求人検索結果',
            weight: 'bold',
            size: 'xl',
            color: '#1DB954',
            align: 'center'
          }
        ],
        paddingAll: 'lg',
        backgroundColor: '#f8f9fa'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '職種:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: `${occupation.emoji} ${occupation.name}`,
                size: 'sm',
                weight: 'bold',
                flex: 0,
                margin: 'sm'
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '勤務地:',
                size: 'sm',
                color: '#666666',
                flex: 0
              },
              {
                type: 'text',
                text: `${prefecture.emoji} ${prefecture.name}`,
                size: 'sm',
                weight: 'bold',
                flex: 0,
                margin: 'sm'
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '条件に合致する求人が見つかりました！\n詳細と応募はメディクロックジョブで確認してください。',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '🔍 検索結果を見る',
              uri: searchURL
            },
            style: 'primary',
            color: '#1DB954'
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '🔄 別の条件で検索',
              data: 'action=restart'
            },
            style: 'secondary',
            margin: 'sm'
          }
        ]
      }
    }
  };
}

// メッセージ処理関数
async function handleEvent(event) {
  if (event.type !== 'message' && event.type !== 'postback' && event.type !== 'follow') {
    return Promise.resolve(null);
  }

  let replyMessages = [];

  // 友だち追加時の処理
  if (event.type === 'follow') {
    replyMessages.push({
      type: 'text',
      text: '🦷 メディクロック求人検索ボットへようこそ！\n\n下のメニューから「求人検索スタート」をタップして、歯科のお仕事を探してみましょう！\n\n求人情報はメディクロックジョブと連携しています。'
    });
  }
  // テキストメッセージの処理
  else if (event.type === 'message') {
    if (event.message.type === 'text') {
      const text = event.message.text.toLowerCase();
      
      if (text.includes('求人') || text.includes('検索') || text.includes('仕事') || text === 'はじめる') {
        replyMessages.push({
          type: 'text',
          text: '🦷 メディクロック求人検索へようこそ！\n\nまず、どの職種をお探しですか？',
          quickReply: createOccupationQuickReply()
        });
      } else if (text.includes('ヘルプ') || text.includes('使い方') || text.includes('help')) {
        replyMessages.push({
          type: 'text',
          text: '📋 使い方ガイド\n\n1️⃣ 下のメニューから「求人検索スタート」をタップ\n2️⃣ 職種を選択（歯科医師、歯科衛生士など）\n3️⃣ 勤務地域を選択\n4️⃣ 検索結果を確認\n5️⃣ メディクロックジョブで詳細確認・応募\n\n困った時はいつでも「ヘルプ」と送信してください！'
        });
      } else {
        replyMessages.push({
          type: 'text',
          text: '下のメニューから「求人検索スタート」をタップするか、「はじめる」と送信してください！\n\n使い方がわからない場合は「ヘルプ」と送信してください。',
          quickReply: createOccupationQuickReply()
        });
      }
    }
  } else if (event.type === 'postback') {
    // ポストバックの処理
    const data = event.postback.data;
    const params = new URLSearchParams(data);
    const action = params.get('action');

    if (action === 'start_search') {
      // リッチメニューの「求人検索スタート」
      replyMessages.push({
        type: 'text',
        text: '🦷 求人検索を開始します！\n\nまず、どの職種をお探しですか？',
        quickReply: createOccupationQuickReply()
      });
      
    } else if (action === 'help') {
      // リッチメニューの「ヘルプ」
      replyMessages.push({
        type: 'text',
        text: '📋 メディクロック求人ボット使い方\n\n🔍 求人検索の流れ:\n1️⃣ 職種を選択\n2️⃣ 勤務地域を選択  \n3️⃣ 検索結果を確認\n4️⃣ メディクロックジョブで応募\n\n💡 対応職種:\n• 歯科医師 🦷\n• 歯科衛生士 ✨\n• 歯科技工士 🔧\n• 歯科助手 🤝\n• 受付 📋\n• 医療事務 💼\n\n🗾 対応エリア:\n全国主要都市（東京、大阪、愛知など）\n\n何か困ったことがあれば、いつでもメニューからヘルプを確認できます！',
        quickReply: createOccupationQuickReply()
      });
      
    } else if (action === 'select_occupation') {
      const occupationKey = params.get('occupation');
      const occupation = OCCUPATION_MAP[occupationKey];
      
      replyMessages.push({
        type: 'text',
        text: `${occupation.emoji} ${occupation.name}を選択しました！\n\n次に、勤務地域を選択してください：`,
        quickReply: createPrefectureQuickReply(occupationKey)
      });
      
    } else if (action === 'select_prefecture') {
      const occupationKey = params.get('occupation');
      const prefectureKey = params.get('prefecture');
      
      try {
        const flexMessage = createResultFlexMessage(occupationKey, prefectureKey);
        replyMessages.push(flexMessage);
      } catch (error) {
        replyMessages.push({
          type: 'text',
          text: 'エラーが発生しました。もう一度お試しください。',
          quickReply: createOccupationQuickReply()
        });
      }
      
    } else if (action === 'restart') {
      replyMessages.push({
        type: 'text',
        text: '🔄 新しい検索を開始します！\n\nどの職種をお探しですか？',
        quickReply: createOccupationQuickReply()
      });
    }
  }

  if (replyMessages.length > 0) {
    return client.replyMessage(event.replyToken, replyMessages);
  }
  
  return Promise.resolve(null);
}

// Webhook エンドポイント
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Error:', err);
      res.status(500).end();
    });
});

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'メディクロック求人ボット WebhookサーバーV1.0',
    timestamp: new Date().toISOString()
  });
});

// リッチメニューセットアップ用エンドポイント
app.get('/setup', async (req, res) => {
  try {
    const action = req.query.action || 'status';
    
    switch (action) {
      case 'create':
        const richMenuId = await createSimpleRichMenu();
        res.json({ 
          success: true, 
          message: 'リッチメニューを作成しました',
          richMenuId: richMenuId
        });
        break;
        
      case 'delete':
        const richMenus = await client.getRichMenuList();
        for (const menu of richMenus) {
          await client.deleteRichMenu(menu.richMenuId);
        }
        res.json({ success: true, message: '既存のリッチメニューを削除しました' });
        break;
        
      case 'status':
        const menus = await client.getRichMenuList();
        let defaultId = null;
        try {
          defaultId = await client.getDefaultRichMenuId();
        } catch (e) {
          // デフォルトなし
        }
        res.json({ 
          success: true, 
          menus: menus,
          defaultRichMenuId: defaultId
        });
        break;
        
      default:
        res.json({ 
          success: false, 
          message: '利用可能なアクション: create, delete, status' 
        });
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'エラーが発生しました', 
      error: error.message 
    });
  }
});

// サーバー起動（ローカル開発用）
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Vercel用エクスポート
module.exports = app;
