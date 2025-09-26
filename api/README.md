# メディクロック求人検索LINEボット

歯科業界の求人をLINE上で簡単検索できるボットです。

## 🚀 機能

- 職種選択（歯科医師、歯科衛生士、歯科助手など）
- 勤務地域選択（東京都、大阪府、神奈川県など）
- メディクロックジョブの検索結果へ自動遷移
- UTMパラメータによる効果測定

## 📱 使い方

1. LINEでボットを友だち追加
2. 「はじめる」or「求人検索」と送信
3. 職種を選択
4. 勤務地域を選択
5. 検索結果を確認

## 🛠️ 技術スタック

- Node.js + Express
- LINE Bot SDK
- Vercel (デプロイ環境)

## 🔧 環境変数

- `LINE_CHANNEL_SECRET`: LINE Messaging API Channel Secret
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Messaging API Channel Access Token

## 📊 URL構造

メディクロックジョブの検索URL:
```
https://mediclock-job.com/job?occupation_id={職種ID}&pref_id[]={都道府県ID}&utm_source=line
```

## 🎯 マッピング

### 職種
- 歯科医師: ID=1
- 歯科衛生士: ID=2  
- 歯科技工士: ID=3
- 歯科助手: ID=4
- 受付: ID=5
- 医療事務: ID=6

### 都道府県（主要）
- 北海道: ID=1
- 東京都: ID=13
- 神奈川県: ID=14
- 愛知県: ID=23
- 大阪府: ID=27
- 福岡県: ID=40
