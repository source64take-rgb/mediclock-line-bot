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

// 都道府県マッピング（全47都道府県）
const PREFECTURE_MAP = {
  hokkaido: { id: 1, name: "北海道", region: "hokkaido" },
  aomori: { id: 2, name: "青森県", region: "tohoku" },
  iwate: { id: 3, name: "岩手県", region: "tohoku" },
  miyagi: { id: 4, name: "宮城県", region: "tohoku" },
  akita: { id: 5, name: "秋田県", region: "tohoku" },
  yamagata: { id: 6, name: "山形県", region: "tohoku" },
  fukushima: { id: 7, name: "福島県", region: "tohoku" },
  ibaraki: { id: 8, name: "茨城県", region: "kanto" },
  tochigi: { id: 9, name: "栃木県", region: "kanto" },
  gunma: { id: 10, name: "群馬県", region: "kanto" },
  saitama: { id: 11, name: "埼玉県", region: "kanto" },
  chiba: { id: 12, name: "千葉県", region: "kanto" },
  tokyo: { id: 13, name: "東京都", region: "kanto" },
  kanagawa: { id: 14, name: "神奈川県", region: "kanto" },
  niigata: { id: 15, name: "新潟県", region: "chubu" },
  toyama: { id: 16, name: "富山県", region: "chubu" },
  ishikawa: { id: 17, name: "石川県", region: "chubu" },
  fukui: { id: 18, name: "福井県", region: "chubu" },
  yamanashi: { id: 19, name: "山梨県", region: "chubu" },
  nagano: { id: 20, name: "長野県", region: "chubu" },
  gifu: { id: 21, name: "岐阜県", region: "chubu" },
  shizuoka: { id: 22, name: "静岡県", region: "chubu" },
  aichi: { id: 23, name: "愛知県", region: "chubu" },
  mie: { id: 24, name: "三重県", region: "kinki" },
  shiga: { id: 25, name: "滋賀県", region: "kinki" },
  kyoto: { id: 26, name: "京都府", region: "kinki" },
  osaka: { id: 27, name: "大阪府", region: "kinki" },
  hyogo: { id: 28, name: "兵庫県", region: "kinki" },
  nara: { id: 29, name: "奈良県", region: "kinki" },
  wakayama: { id: 30, name: "和歌山県", region: "kinki" },
  tottori: { id: 31, name: "鳥取県", region: "chugoku" },
  shimane: { id: 32, name: "島根県", region: "chugoku" },
  okayama: { id: 33, name: "岡山県", region: "chugoku" },
  hiroshima: { id: 34, name: "広島県", region: "chugoku" },
  yamaguchi: { id: 35, name: "山口県", region: "chugoku" },
  tokushima: { id: 36, name: "徳島県", region: "shikoku" },
  kagawa: { id: 37, name: "香川県", region: "shikoku" },
  ehime: { id: 38, name: "愛媛県", region: "shikoku" },
  kochi: { id: 39, name: "高知県", region: "shikoku" },
  fukuoka: { id: 40, name: "福岡県", region: "kyushu" },
  saga: { id: 41, name: "佐賀県", region: "kyushu" },
  nagasaki: { id: 42, name: "長崎県", region: "kyushu" },
  kumamoto: { id: 43, name: "熊本県", region: "kyushu" },
  oita: { id: 44, name: "大分県", region: "kyushu" },
  miyazaki: { id: 45, name: "宮崎県", region: "kyushu" },
  kagoshima: { id: 46, name: "鹿児島県", region: "kyushu" },
  okinawa: { id: 47, name: "沖縄県", region: "kyushu" }
};

// 地方マッピング
const REGION_MAP = {
  hokkaido: { name: "北海道" },
  tohoku: { name: "東北" },
  kanto: { name: "関東" },
  chubu: { name: "中部" },
  kinki: { name: "近畿" },
  chugoku: { name: "中国" },
  shikoku: { name: "四国" },
  kyushu: { name: "九州・沖縄" }
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

// 地方選択のクイックリプライを生成
function createRegionQuickReply(occupationKey) {
  return {
    type: 'quickReply',
    items: Object.entries(REGION_MAP).map(([key, data]) => ({
      type: 'action',
      action: {
        type: 'postback',
        label: `${data.emoji} ${data.name}`,
        data: `action=select_region&occupation=${occupationKey}&region=${key}`
      }
    }))
  };
}

// 都道府県選択のクイックリプライを生成（地方別）
function createPrefectureQuickReply(occupationKey, regionKey) {
  const prefectures = Object.entries(PREFECTURE_MAP)
    .filter(([key, data]) => data.region === regionKey)
    .map(([key, data]) => ({
      type: 'action',
      action: {
        type: 'postback',
        label: `${data.emoji} ${data.name}`,
        data: `action=select_prefecture&occupation=${occupationKey}&prefecture=${key}`
      }
    }));

  return {
    type: 'quickReply',
    items: prefectures
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
  if (event.type !== 'message' && event.type !== 'postback') {
    return Promise.resolve(null);
  }

  let replyMessages = [];

  if (event.type === 'message') {
    // テキストメッセージの処理
    if (event.message.type === 'text') {
      const text = event.message.text.toLowerCase();
      
      if (text.includes('求人') || text.includes('検索') || text.includes('仕事') || text === 'はじめる') {
        replyMessages.push({
          type: 'text',
          text: '🦷 メディクロック求人検索へようこそ！\n\nまず、どの職種をお探しですか？',
          quickReply: createOccupationQuickReply()
        });
      } else {
        replyMessages.push({
          type: 'text',
          text: '求人を検索するには「求人検索」または「はじめる」と送信してください！',
          quickReply: createOccupationQuickReply()
        });
      }
    }
  } else if (event.type === 'postback') {
    // ポストバックの処理
    const data = event.postback.data;
    const params = new URLSearchParams(data);
    const action = params.get('action');

    if (action === 'select_occupation') {
      const occupationKey = params.get('occupation');
      const occupation = OCCUPATION_MAP[occupationKey];
      
      replyMessages.push({
        type: 'text',
        text: `${occupation.emoji} ${occupation.name}を選択しました！\n\n次に、地方を選択してください：`,
        quickReply: createRegionQuickReply(occupationKey)
      });
      
    } else if (action === 'select_region') {
      const occupationKey = params.get('occupation');
      const regionKey = params.get('region');
      const region = REGION_MAP[regionKey];
      
      replyMessages.push({
        type: 'text',
        text: `${region.emoji} ${region.name}を選択しました！\n\n都道府県を選択してください：`,
        quickReply: createPrefectureQuickReply(occupationKey, regionKey)
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
    message: 'メディクロック求人ボット WebhookサーバーV1.1 (47都道府県対応)',
    timestamp: new Date().toISOString()
  });
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
