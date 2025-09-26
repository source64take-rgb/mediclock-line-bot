// リッチメニュー設定・管理スクリプト
// このファイルを api/setup-richmenu.js として保存

const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');

// LINE SDK設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.Client(config);

/**
 * リッチメニューの定義
 */
const richMenuConfig = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: false, // デフォルトで表示
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

/**
 * リッチメニュー3分割版の定義
 */
const richMenuConfig3 = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: false,
  name: "メディクロック求人検索メニュー3分割",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 1686
      },
      action: {
        type: "postback",
        data: "action=start_search"
      }
    },
    {
      bounds: {
        x: 833,
        y: 0,
        width: 834,
        height: 1686
      },
      action: {
        type: "postback",
        data: "action=restart"
      }
    },
    {
      bounds: {
        x: 1667,
        y: 0,
        width: 833,
        height: 1686
      },
      action: {
        type: "postback",
        data: "action=help"
      }
    }
  ]
};

/**
 * リッチメニューを作成
 */
async function createRichMenu() {
  try {
    console.log('リッチメニューを作成中...');
    const richMenuId = await client.createRichMenu(richMenuConfig);
    console.log('リッチメニュー作成成功:', richMenuId);
    return richMenuId;
  } catch (error) {
    console.error('リッチメニュー作成エラー:', error);
    throw error;
  }
}

/**
 * リッチメニューに画像をアップロード
 * @param {string} richMenuId - リッチメニューID
 * @param {string} imagePath - 画像ファイルのパス
 */
async function uploadRichMenuImage(richMenuId, imagePath) {
  try {
    console.log('画像をアップロード中...');
    
    // 画像ファイルを読み込み
    const imageBuffer = fs.readFileSync(imagePath);
    
    await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
    console.log('画像アップロード成功');
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw error;
  }
}

/**
 * デフォルトリッチメニューに設定
 * @param {string} richMenuId - リッチメニューID
 */
async function setDefaultRichMenu(richMenuId) {
  try {
    console.log('デフォルトリッチメニューに設定中...');
    await client.setDefaultRichMenu(richMenuId);
    console.log('デフォルト設定成功');
  } catch (error) {
    console.error('デフォルト設定エラー:', error);
    throw error;
  }
}

/**
 * 既存のリッチメニューを削除
 */
async function deleteAllRichMenus() {
  try {
    console.log('既存のリッチメニューを確認中...');
    const richMenus = await client.getRichMenuList();
    
    for (const menu of richMenus) {
      console.log(`リッチメニュー削除: ${menu.richMenuId}`);
      await client.deleteRichMenu(menu.richMenuId);
    }
    
    console.log('既存リッチメニューの削除完了');
  } catch (error) {
    console.error('リッチメニュー削除エラー:', error);
    throw error;
  }
}

/**
 * リッチメニューの完全セットアップ
 * @param {string} imagePath - 画像ファイルのパス
 */
async function setupRichMenu(imagePath) {
  try {
    // 既存メニューを削除
    await deleteAllRichMenus();
    
    // 新しいメニューを作成
    const richMenuId = await createRichMenu();
    
    // 画像をアップロード
    if (imagePath && fs.existsSync(imagePath)) {
      await uploadRichMenuImage(richMenuId, imagePath);
    }
    
    // デフォルトに設定
    await setDefaultRichMenu(richMenuId);
    
    console.log('✅ リッチメニューのセットアップ完了!');
    console.log('リッチメニューID:', richMenuId);
    
    return richMenuId;
  } catch (error) {
    console.error('❌ セットアップ失敗:', error);
    throw error;
  }
}

/**
 * リッチメニューの確認
 */
async function checkRichMenus() {
  try {
    const richMenus = await client.getRichMenuList();
    console.log('現在のリッチメニュー:');
    richMenus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.name} (ID: ${menu.richMenuId})`);
    });
    
    // デフォルトメニューの確認
    try {
      const defaultRichMenuId = await client.getDefaultRichMenuId();
      console.log('デフォルトリッチメニューID:', defaultRichMenuId);
    } catch (e) {
      console.log('デフォルトリッチメニュー: 未設定');
    }
    
    return richMenus;
  } catch (error) {
    console.error('リッチメニュー確認エラー:', error);
    throw error;
  }
}

// 実行用の関数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const imagePath = args[1];
      if (!imagePath) {
        console.log('使用方法: node setup-richmenu.js create <画像ファイルパス>');
        return;
      }
      await setupRichMenu(imagePath);
      break;
      
    case 'check':
      await checkRichMenus();
      break;
      
    case 'delete':
      await deleteAllRichMenus();
      break;
      
    default:
      console.log('利用可能なコマンド:');
      console.log('  create <画像パス> - リッチメニューを作成');
      console.log('  check            - 現在のメニューを確認');
      console.log('  delete           - すべてのメニューを削除');
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createRichMenu,
  uploadRichMenuImage,
  setDefaultRichMenu,
  deleteAllRichMenus,
  setupRichMenu,
  checkRichMenus,
  richMenuConfig,
  richMenuConfig3
};
