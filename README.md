# video-chat
<img src="https://img.shields.io/badge/-Node.js-006e00.svg?logo=node.js&style=for-the-badge">　<img src="https://img.shields.io/badge/-Html5-ffcdbf.svg?logo=html5&style=for-the-badge">　<img src="https://img.shields.io/badge/-Css3-1572B6.svg?logo=css3&style=for-the-badge">　<img src="https://img.shields.io/badge/-Javascript-948300.svg?logo=javascript&style=for-the-badge">

------

## ■ プロジェクト概要
制作時期 : 2024年 5月

**video-chat**は、**Node.js**を用いて開発した**ビデオチャットWebアプリ**です。

**一対一**のリアルタイム通信を**P2P**で行い、**チャット**と**ビデオ通話**ができます。

&nbsp;  

## ■ 主な機能
* マッチング
  * `ルーム`タブで、ルーム名を使ってマッチングができます。
* チャット
  * `チャット`タブで、**リアルタイムP2P**による**文章**、**画像**、**ファイル**のやり取りができます。
* ビデオ通話
  * `ビデオ通話`タブで、**リアルタイムP2P**による**ビデオ通話**ができます。
  * **カメラ**と**マイク**のオンオフを切り替えられます。
  * **チャット画面**を開くこともできます。
* テーマカラー
  * `設定`タブで、**テーマカラー**を切り替えられます。
  * テーマカラーには、`オレンジ/ライト`、`オレンジ/ダーク`、`ブルー/ライト`、`ブルー/ダーク`、`メロンソーダ`の5種類があります。

&nbsp;  

## ■ 使用方法
1. `ルーム`タブで、任意の`ルーム名`と`名前`を入力し、`ルームに参加`ボタンを押します。
2. 同じ`ルーム名`で参加したユーザーとマッチングします。

> [!IMPORTANT]
> 同じルームに入れるのは**2人まで**です。3人以上が同じルーム名を使うことはできません。

3. チャットやビデオ通話を楽しみます。
   * チャットでは、**メッセージ入力欄の左端**にある`＋`ボタンを押して**画像**もしくは**ファイル**の添付ができます。
     
     <img width="60%" alt="video-chat_demo_1" src="https://github.com/user-attachments/assets/124be3fc-9cf3-4221-808b-80fc98812895" />
     <img width="60%" alt="video-chat_demo_2" src="https://github.com/user-attachments/assets/183d71b1-9e2b-404d-a857-ebadc6ae8603" />
     <img width="60%" alt="video-chat_demo_3" src="https://github.com/user-attachments/assets/f89b7be5-9987-4e3c-a018-302a333f36f8" />
     
   * 送られてきた**画像**はクリック/タップして**拡大**、その後画面右下の`ダウンロードアイコン`ボタンで**ダウンロード**できます。
   * 送られてきた**ファイル**はクリック/タップで**ダウンロード**できます。
     
     <img width="60%" alt="video-chat_demo_4" src="https://github.com/user-attachments/assets/654c71a9-9c0c-4077-9e6d-0a9d360565dc" />
     <img width="60%" alt="video-chat_demo_5" src="https://github.com/user-attachments/assets/e3157979-ad40-4568-a393-e53d7f284be9" />

   * ビデオ通話では、**画面下部**にある`カメラアイコン`ボタンと`マイクアイコン`ボタンそれぞれで**カメラとマイクのオン/オフ**ができます。
     
     <img width="60%" alt="video-chat_demo_6" src="https://github.com/user-attachments/assets/dd58bf18-a542-4c39-beb6-8f4847df605d" />

   * ビデオ通話では、**画面右上**にある`メッセージアイコン`ボタンで**チャット画面の表示/非表示**ができます。
     
     <img width="60%" alt="video-chat_demo_7" src="https://github.com/user-attachments/assets/85813030-fc9b-404d-9800-9373c0dc1109" />

&nbsp;  

## ■ デモ
本アプリのデモを**PaaS** (`Render`) を使用して以下のURLで公開しています。

* https://video-chat-fujm.onrender.com/

> [!IMPORTANT]
> 本アプリでは**TURNサーバを使用していない**ため、通信を行う2デバイスは**同じWiFiに接続されている**必要があります。

&nbsp;  

## ■ 使用技術
#### フロントエンド
* HTML
* CSS
* JavaScript
* Font Awesome (アイコンCDNサービス)

#### バックエンド
* Node.js
  * express 4.19.2
  * ws 8.17.0

#### PaaS
* Render

&nbsp;  

## ■ ライセンスおよびクレジット
* 営利目的での利用を禁止します。
* 改変や再配布を禁止します。

------

©️2025 蔵谷友哉
