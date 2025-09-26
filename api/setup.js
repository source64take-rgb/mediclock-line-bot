const line = require('@line/bot-sdk');

// LINE SDK設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.Client(config);

// リッチメニューの定義
const richMenuConfig = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: false,
  name: "メディクロック求人検索メニュー",
  chatBarText: "メニューを開く",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 2500,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=start_search"
      }
    },
    {
      bounds: {
        x: 0,
        y: 843,
        width: 2500,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=help"
      }
    }
  ]
};

// Vercel用のエンドポイント
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const action = req.query.action || 'status';

    switch (action) {
      case 'create':
        await createRichMenu();
        res.json({ success: true, message: 'リッチメニューを作成しました' });
        break;

      case 'delete':
        await deleteAllRichMenus();
        res.json({ success: true, message: '既存のリッチメニューを削除しました' });
        break;

      case 'status':
        const menus = await getRichMenuList();
        const defaultId = await getDefaultRichMenuId();
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
};

/**
 * リッチメニューを作成
 */
async function createRichMenu() {
  try {
    // 既存メニューを削除
    await deleteAllRichMenus();
    
    // 新しいメニューを作成
    console.log('リッチメニューを作成中...');
    const richMenuId = await client.createRichMenu(richMenuConfig);
    console.log('リッチメニュー作成成功:', richMenuId);
    
    // 画像をアップロード（シンプルな単色画像を生成）
    await uploadSimpleImage(richMenuId);
    
    // デフォルトに設定
    await client.setDefaultRichMenu(richMenuId);
    console.log('デフォルト設定完了');
    
    return richMenuId;
  } catch (error) {
    console.error('リッチメニュー作成エラー:', error);
    throw error;
  }
}

/**
 * シンプルな画像をアップロード
 */
async function uploadSimpleImage(richMenuId) {
  try {
    // シンプルなSVG画像を生成（PNG形式で）
    const svgImage = `
      <svg width="2500" height="1686" xmlns="http://www.w3.org/2000/svg">
        <!-- 上半分：求人検索スタート -->
        <rect x="0" y="0" width="2500" height="843" fill="#1DB954" stroke="#fff" stroke-width="4"/>
        <text x="1250" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white">🦷 求人検索スタート</text>
        <text x="1250" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="white">歯科のお仕事を探そう！</text>
        <text x="1250" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#e8f5e8">タップして検索を開始</text>
        
        <!-- 下半分：ヘルプ -->
        <rect x="0" y="843" width="2500" height="843" fill="#f8f9fa" stroke="#fff" stroke-width="4"/>
        <text x="1250" y="1200" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#333">ℹ️ 使い方・ヘルプ</text>
        <text x="1250" y="1350" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="#666">ボットの使い方を確認</text>
        <text x="1250" y="1500" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#999">困った時はこちら</text>
      </svg>
    `;
    
    // SVGをPNGに変換するための簡易実装（実際にはライブラリが必要）
    // ここでは一時的にプレースホルダーとして処理
    console.log('画像アップロードをスキップ（画像ファイルが必要）');
    
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    // 画像アップロードに失敗してもメニューは作成される
  }
}

/**
 * 既存のリッチメニューを削除
 */
async function deleteAllRichMenus() {
  try {
    const richMenus = await client.getRichMenuList();
    
    for (const menu of richMenus) {
      console.log(`リッチメニュー削除: ${menu.richMenuId}`);
      await client.deleteRichMenu(menu.richMenuId);
    }
    
    console.log('既存リッチメニューの削除完了');
  } catch (error) {
    console.error('リッチメニュー削除エラー:', error);
  }
}

/**
 * リッチメニューリストを取得
 */
async function getRichMenuList() {
  try {
    return await client.getRichMenuList();
  } catch (error) {
    console.error('リッチメニューリスト取得エラー:', error);
    return [];
  }
}

/**
 * デフォルトリッチメニューIDを取得
 */
async function getDefaultRichMenuId() {
  try {
    return await client.getDefaultRichMenuId();
  } catch (error) {
    return null;
  }
}
