'use strict';

{ //タブ切り替え
    const tabMenus = document.querySelectorAll('.tab__menu-item');
    const tabPanel = document.getElementById('tab__panel');
    const chatUiContainer = document.getElementById('chat-ui-container');
    const tabHilight = document.getElementById('tab-hilight');
    let resizeTabPanelItem;
    let globalLeft = 0;
    let targetTab;
    let tabClickable = true;

    tabMenus.forEach((tabMenu) => {
        tabMenu.onclick = (event) => {
            if (tabClickable) {
                tabClickable = false;

                const currentTarget = event.currentTarget;
                const tabTargetData = currentTarget.dataset.tab;
                const tabList = currentTarget.closest('#tab__menu');
                const tabItems = tabList.querySelectorAll('.tab__menu-item');
                const tabPanelItems = tabList.nextElementSibling.querySelectorAll('.tab__panel-box');
                targetTab = currentTarget;

                //まずすべてのタブからアクティブクラスを外す
                tabItems.forEach((tabItem) => {
                    tabItem.classList.remove('is-active');
                })

                //ターゲットのタブにはアクティブクラスをつける
                targetTab.classList.add('is-active');

                //スクロールする座標を算出
                tabPanelItems.forEach((tabPanelItem) => {
                    if (tabPanelItem.dataset.panel ===  tabTargetData) {
                        let tabLeft = tabPanelItem.getBoundingClientRect().left;
                        globalLeft -= tabLeft;
                        resizeTabPanelItem = tabPanelItem;
                    }
                });
                tabPanel.style.left = globalLeft + "px";
                TabAnimation();

                //チャットフォームのアニメーション
                if (tabTargetData === '01' || tabTargetData === '04') { //ルームタブと設定タブの時
                    chatUiContainer.style.right = "100vw";
                    currentTabId = 1;
                } else {
                    chatUiContainer.style.right = "0";
                    if (tabTargetData === '02') { //チャットタブの時
                        currentTabId = 2;
                    } else { //ビデオ通話タブの時
                        currentTabId = 3;
                    }
                }

                //0.6秒後にクリックできる
                setTimeout(() => {
                    tabClickable = true;
                }, 800);
            }
        };
    });

    // ウィンドウの横幅が変わった時の対応
    window.addEventListener('resize', () => {
        let tabLeft = resizeTabPanelItem.getBoundingClientRect().left;
        let tabPanelLeft = tabPanel.getBoundingClientRect().left;
        globalLeft = tabPanelLeft - tabLeft;
        tabPanel.style.left = globalLeft + "px";
        TabAnimation();
    });

    //タブのハイライトを移動
    function TabAnimation() {
            let intervalId = setInterval(() => {
                let tabPos = targetTab.getBoundingClientRect().left;
                tabHilight.style.left = tabPos + "px";
            }, 100);

            setTimeout(() => {
                clearInterval(intervalId);
            }, 500);
    }
    tabMenus[0].click();
}

const receivedFiles = {};
//メッセージの表示
function CreateMessage(dataType, senderName, message, fileName, isPartner) {
    //メッセージの各要素を作成
    const messageDiv = document.createElement('div'); //div
    //相手か自分か
    if (isPartner) {
        messageDiv.className = 'message partner-message'; //相手
    } else {
        messageDiv.className = 'message my-message'; //自分
    }
    const sender = document.createElement('h3'); //ユーザー名
    sender.textContent = senderName;
    let messageContent; //内容

    console.log(dataType);
    switch (dataType) {
        case 'text': //メッセージの場合
            if (URL.canParse(message)) {
                messageContent = document.createElement('a');
                messageContent.href = message;
                messageContent.target = '_blank';
                messageContent.rel = 'noopener noreferrer';
            } else {
                messageContent = document.createElement('p');
            }
            //テキストを要素に設定
            messageContent.textContent = message;
            AppendMessage(messageDiv, sender, messageContent);
            break;

        case 'image': //画像の場合
            const reader = new FileReader();
            reader.onload = () => {
                //base64にエンコード
                let base64Image = reader.result;
                //画像の要素を作成
                messageContent = document.createElement('img');
                messageContent.src = base64Image;
                messageContent.alt = fileName;
                messageContent.className = 'chat-img';

                AppendMessage(messageDiv, sender, messageContent);
                //画像要素の更新
                UpdateChatImages();
            };
            reader.readAsDataURL(message);
            break;

        case 'file':
            receivedFiles[fileName] = message;
            //ファイルの要素を作成
            messageContent = document.createElement('div');
            messageContent.classList.add('chat-file');
            //ファイルのアイコン
            const messageFileIcon = document.createElement('div');
            //ファイル名
            const messageFileName = document.createElement('p');
            messageFileName.textContent = fileName;
            messageContent.appendChild(messageFileIcon);
            messageContent.appendChild(messageFileName);

            AppendMessage(messageDiv, sender, messageContent);
            //ファイル要素の更新
            UpdateChatFiles();
        default:
            break;
    }
}

function AppendMessage(messageDiv, sender, messageContent) {
    //要素を組み立て
    messageDiv.appendChild(sender);
    messageDiv.appendChild(messageContent);
    const subMessageDiv = messageDiv.cloneNode(true);

    //チャット欄に要素を追加
    chatBox.appendChild(messageDiv);
    subChatBox.appendChild(subMessageDiv);
}

//送信ボタンのアニメーション
messageInput.oninput = (event) => {
    let input = event.target.value;
    const message = input.replace(/[\s　]+/g, ' ').trim(); //全角スペースを半角スペースに変換する
    if (message === '') {
        CanSendUpdate(false);
    } else {
        CanSendUpdate(true);
    }
};

function CanSendUpdate(inputValue) {
    if (!fileSending) {
        if (inputValue) {
            canSend = true;
            planeIcon.classList.add('fa-bounce'); //バウンドアニメーションを追加
        } else {
            canSend = false;
            planeIcon.classList.remove('fa-bounce'); //バウンドアニメーションを消去
        }
    } else {
        canSend = false;
        planeIcon.classList.remove('fa-bounce'); //バウンドアニメーションを消去
    }
}

let isOpen = false; //オプションメニューが開かれているかどうか
let plusButtonClickable = true; //オプションメニューが押せるかどうか
//チャットのオプション
plusButton.onclick = () => {
    if (plusButtonClickable) {
        isOpen = !isOpen;
        plusButtonClickable = false;
        if (isOpen) {
            chatOptionContainer.style.display = 'flex';
            //少し遅らせてクラスを追加する(遅らせないとアニメーションしない)
            setTimeout(() => {
                plusButton.classList.add('is-open');
                chatOptionContainer.classList.add('is-open');
            }, 50);
            //0.5秒後に押せる
            setTimeout(() => {
                plusButtonClickable = true;
            }, 500);
        } else {
            plusButton.classList.remove('is-open');
            chatOptionContainer.classList.remove('is-open');
            //0.5秒後に見えなくなり、押せる
            setTimeout(() => {
                chatOptionContainer.style.display = 'none';
                plusButtonClickable = true;
            }, 500);
        }
    }
};

//チャットの画像のクリック処理
function UpdateChatImages() {
    const chatImages = document.querySelectorAll('.chat-img');

    chatImages.forEach((image) => {
        image.onclick = () => {
            //画像を拡大表示するための要素を作成
            const zoomedImage = document.createElement('img');
            const downloadButton = document.createElement('a');
            //拡大表示の画像に画像を設定
            zoomedImage.src = image.src;
            zoomedImage.classList.add('zoomed-img');
            //ダウンロードボタンのリンクに画像を設定
            downloadButton.href = image.src;
            //ダウンロードボタンの名前を画像の名前に設定
            downloadButton.download = image.alt;
            downloadButton.classList.add('file-download-button');

            //拡大画像をクリックしたときに閉じる処理
            zoomedImage.onclick = () => {
                zoomedImage.classList.remove('is-show');
                document.body.removeChild(downloadButton);
                setTimeout(() => {
                    document.body.removeChild(zoomedImage);
                }, 300);
            };

            //ドキュメントに要素を追加
            document.body.appendChild(zoomedImage);
            setTimeout(() => {
                zoomedImage.classList.add('is-show');
                document.body.appendChild(downloadButton);
            }, 50);
        };
    });
}

//チャットの画像のクリック処理
function UpdateChatFiles() {
    const files = document.querySelectorAll('.chat-file');

    files.forEach(file => {
        file.onclick = () => {
            const filename = file.textContent;
            createDownloadLink(filename);
        };
    });
}

function createDownloadLink(filename) {
    const blob = receivedFiles[filename];
    if (!blob) {
        console.error('File not found:', filename);
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

chatAreaButton.onclick = () => {
    const chatArea = subChatBox.closest('.chat-area');
    if (chatArea.style.display === 'none') {
        chatArea.style.display = 'flex';
    } else {
        chatArea.style.display = 'none';
    }
}

{ //テーマカラー変更ボタン
    const themeColor = document.getElementById('theme-color');

    themeColor.onclick = (event) => {

        const targetButton = event.target.closest('button');
        if (targetButton) {
            if (targetButton.id) {
                //まずはすべてのボタンからチェックマークを外す
                const buttons = themeColor.children;
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].classList.remove('current-theme');
                }
                //ターゲットにチェックマークをつける
                const currentTheme = document.getElementById(targetButton.id);
                currentTheme.classList.add('current-theme');

                //idでテーマを変更
                document.documentElement.setAttribute('theme', targetButton.id);
            }
        }
    };
}

//htmlタグを無効にする
function htmlEncode(text) {
    var element = document.createElement('div');
    element.textContent = text; //textContentでエンコード
    return element.innerHTML;
}

//チャットの画面自動スクロール
function AutoScroll() {
    setTimeout(() => {
        chatBox.scroll({
            top: chatBox.scrollHeight,
            behavior: 'smooth',
        });
        subChatBox.scroll({
            top: subChatBox.scrollHeight,
            behavior: 'smooth',
        });
    }, 50);
}
