'use strict';

const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const ws = new WebSocket(wsProtocol + window.location.host);

//ルーム
const leaveRoomButton = document.getElementById('leave-button');
const roomShowContainer = document.getElementById('room-show-container');
const roomUiContainer = document.getElementById('room-ui-container');
const roomShow = document.getElementById('room-show');
const memberShow = document.getElementById('member-show');
//チャット
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const planeIcon = document.getElementById('plane-icon');
const plusButton = document.getElementById('plus-button');
const chatOptionContainer = document.getElementById('chat-option-container');
const imageInput = document.getElementById('image-input')
const fileInput = document.getElementById('file-input');
const filePreviewContainer = document.getElementById('file-preview-container');
//ビデオ通話
const cameraButton = document.getElementById('camera-button');
const micButton = document.getElementById('mic-button');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const chatAreaButton = document.getElementById('chat-area-button');
const subChatBox = document.getElementById('sub-chat-box');

let peerConnection;
let dataChannel;
let localStream;

let roomName;
let userId;
let userName;

const peerConnectionConfig = {
	iceServers: [
		{urls: 'stun:stun.l.google.com:19302'},
		{urls: 'stun:stun1.l.google.com:19302'},
		{urls: 'stun:stun2.l.google.com:19302'},
	]
};

//部屋作成からpeerConnection
roomUiContainer.onsubmit = (event) => {
	event.preventDefault();

	const formData = new FormData(event.target);
	roomName = formData.get('room-name');
	userName = formData.get('user-name');

	roomShow.textContent = 'マッチング中...';
	roomUiContainer.style.display = 'none';
	roomShowContainer.style.display = 'flex';
	//自分の名前を表示
	const myName = document.createElement('h2');
	myName.textContent = userName;
	memberShow.appendChild(myName);

	console.log("Join button pressed");
	//サーバーに参加を送信
	ws.send(JSON.stringify({
		type: 'join',
		room: roomName,
		userName: userName
	}));

	peerConnection = new RTCPeerConnection(peerConnectionConfig);

	//データチャネルを作成
	dataChannel = peerConnection.createDataChannel(roomName, { ordered: true });
	SetupDataChannel(dataChannel);

	// Remote側のストリームを設定
	peerConnection.ontrack = (event) => {
		if (event.streams && event.streams[0]) {
			console.log('Received remote track:', event.streams[0]);
			remoteVideo.srcObject = event.streams[0];
		} else {
			remoteVideo.srcObject = new MediaStream(event.track);
		}
	};

	//ICE候補が生成された時の処理
	peerConnection.onicecandidate = event => {
		if (event.candidate) {
			console.log("send ICE");
			ws.send(JSON.stringify({
				type: 'candidate',
				candidate: event.candidate,
				room: roomName,
				userId: userId
			}));
		} else {
			// すべてのICE候補が生成されたことを示す
			console.log("All ICE candidates have been generated.");
		}
	};

	//相手がデータチャネルを同じ名前で作った時の処理
	peerConnection.ondatachannel = event => {
		console.log('Data channel created:', event);
		SetupDataChannel(event.channel);
		dataChannel = event.channel;
	};
};

//部屋から抜けるボタンを押した時とウィンドウを閉じた時
leaveRoomButton.onclick = LeaveRoom;
window.onbeforeunload = LeaveRoom;

//部屋から抜ける
function LeaveRoom() {
	roomShow.textContent = '';
	memberShow.innerHTML = '';
	roomUiContainer.style.display = 'flex';
	roomShowContainer.style.display = 'none';

	if (window.stream) {
		// 既存のストリームを破棄
		try {
			window.stream.getTracks().forEach(track => {
				track.stop();
			});
		} catch(error) {
			console.error(error);
		}
		window.stream = null;
	}

	if (remoteVideo.srcObject) {
		try {
			remoteVideo.srcObject.getTracks().forEach(track => {
				track.stop();
			});
		} catch(error) {
			console.error(error);
		}
		remoteVideo.srcObject = null;
	}

	if (peerConnection) {
		peerConnection.close();
		peerConnection = null;
		ws.send(JSON.stringify({
			type: 'leave',
			room: roomName,
			userId: userId
		}));
	}
}

//サーバーからのメッセージ処理
ws.onmessage = (message) => {
	const data = JSON.parse(message.data);
	switch (data.type) {
		case 'offer': //offerを受け取った時
			//offerをリモートにセット
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
			//answerを作成してローカルにセットして送信
			peerConnection.createAnswer()
			.then(answer => peerConnection.setLocalDescription(answer))
			.then(() => {
				console.log("Answer set and send");
				ws.send(JSON.stringify({
					type: 'answer',
					answer: peerConnection.localDescription,
					room: roomName,
					userId:userId
				}));
			})
			.catch(error => console.error("Error during answer handling:", error));
			break;

		case 'answer': //answerを受け取った時
			console.log("Catch answer");
			//answerをリモートにセット
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
			break;

		case 'candidate': //ICE候補を受け取った時
			console.log("catch ICE");
			//ICE候補を追加
			peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
			break;

		case 'id_setup': //部屋に参加した時にIDが返ってくる
			//自分のユーザーIDを控えておく
			userId = data.userId;
			console.log("My userID:" + userId);

			navigator.mediaDevices.getUserMedia({ audio: true, video: true })
			.then(stream => {
				window.stream = stream;
				localVideo.srcObject = stream;
				stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

				ToggleCamera();
				ToggleMic();

				return peerConnection.createOffer();
			})
			.then(offer => peerConnection.setLocalDescription(offer))
			.then(() => {
				ws.send(JSON.stringify({
					type: 'offer',
					offer: peerConnection.localDescription,
					room: roomName,
					userId: userId
				}));
			})
			.catch(err => alert(err));
			break;

		case 'room_update': //誰かが部屋に参加した時相手の名前が来る
			if (data.message === 'partner_left') { //相手が退室したメッセージだったら
				memberShow.lastChild.remove();
			} else if (data.userName) { //相手のユーザー名が送られてきたら
				const partnerName = document.createElement('h2');
				partnerName.textContent = data.userName;
				memberShow.appendChild(partnerName);
			}
			break;

		case 'room_error': //ルーム名がすでに使われていたときに返ってくる
			LeaveRoom();
			alert("そのルーム名は現在使われています。" + "別のルーム名を使用してください。");
		default:
			break;
	}
};

let oldUserId = null; //メッセージの上の名前表示のための変数
let fileSending = false; //ファイル送信中か
let canSend = false; //送れるかどうか
//チャットでのメッセージ送信
function sendMessage() {
	//peerConnectionが成立しているかチェック
	if ( !peerConnection || peerConnection.connectionState != 'connected' ) {
		alert('PeerConnection is not established.');
		return false;
	}
	//dataChannelが成立しているかチェック
	if (!dataChannel || dataChannel.readyState !== "open") {
		console.error("DataChannel is not open.");
		return false;
	}

	//送れない状態だったら返す
	if (!canSend) {
		return false;
	}

	//senderNameの決定
	let senderName = userName;
	if (oldUserId === userId) { //IDが前のメッセージ送信者のIDと一致したらsenderNameを無しにする
		senderName = '';
	}
	oldUserId = userId;

	//メッセージの送信
	if (messageInput.value != '') { //送れる状態だったら
		//messageの決定
		const message = messageInput.value;
		messageInput.value = '';
		CanSendUpdate(false);
		const encodedMessage = htmlEncode(message);

		//メッセージの表示の関数を呼ぶ
		CreateMessage('text', senderName, encodedMessage, '', false);
		//ユーザーID、ユーザー名、メッセージを相手に送る
		dataChannel.send(JSON.stringify({
			type: 'text',
			userId: userId,
			userName: userName,
			message: encodedMessage
		}));

		//同じ人なので名前はなし
		senderName = '';
	}

	if (filePreviewContainer.children[0]) { //プレビューを削除
		filePreviewContainer.children[0].remove();
	}

	//画像の送信
	if (file && inputType) {
		fileSending = true; //ファイル送信中にする
		CanSendUpdate(false);
		console.log(file);
		const CHUNK_SIZE = 63 * 1024; //64KBまで送れるので63KB
		const reader = new FileReader();
		let offset = 0;
		let totalSent = 0; // 送信したデータの総量

		//メッセージの表示の関数を呼ぶ
		CreateMessage(inputType, senderName, file, file.name, false);

		//進行状況の表示
		const percentSentShow = document.createElement('h4');
		const subPercentSentShow = document.createElement('h4');
		chatBox.appendChild(percentSentShow);
		subChatBox.appendChild(subPercentSentShow);

		function readSlice(offset) { //63KBずつのチャンクに分けて読み込み
			const slice = file.slice(offset, offset + CHUNK_SIZE);

			reader.onload = (event) => { //読み込みが完了したら
				const sendChunk = () => {
					//キューのサイズがチャンクサイズの5倍を下回るまで待つ
					if (dataChannel.bufferedAmount < CHUNK_SIZE * 5) {
						//チャンクを送る
						dataChannel.send(event.target.result);
						//送信したデータの総量を更新
						totalSent += event.target.result.byteLength;
						console.log('Sent chunk');

						//進行状況を計算して表示
						const percentSent = (totalSent / file.size) * 100;
						percentSentShow.textContent = ('送信中... ' + Math.trunc(percentSent) + '%');
						subPercentSentShow.textContent = ('送信中... ' + Math.trunc(percentSent) + '%');

						//次のチャンクへ
						offset += CHUNK_SIZE;

						if (offset < file.size) { //まだ残りがあれば次のチャンクへ
							readSlice(offset);
						} else { //残りがなければ
							//すべてのチャンクを送ったことを伝える
							dataChannel.send(JSON.stringify({
								type: inputType,
								userId: userId,
								userName: userName,
								fileName: file.name,
								mimeType: file.type,
								message: 'end-of-file'
							}));

							chatBox.removeChild(percentSentShow);
							subChatBox.removeChild(subPercentSentShow);
							//ファイルをリセット
							file = null;
							fileSending = false; //ファイル送信中を解除
							if (messageInput.value != '') {
								CanSendUpdate(true);
							}
							console.log("File all sended");
						}
					} else {
						// キューが空になるのを待つ
						setTimeout(sendChunk, 100);
					}
				};
				sendChunk();
			};
			reader.readAsArrayBuffer(slice);
		}

		//最初のチャンクの読み込み
		readSlice(0);
	}

	AutoScroll();

	return true;
}

//チャットのオプションのボタン(画像、ファイル...)
chatOptionContainer.onclick = (event) => {
	//ファイル送信中だったら受け付けない
	if (fileSending) {
		return;
	}

	const targetButton = event.target.closest('button');
	if (targetButton) {
		switch (targetButton.id) {
			case 'image-button': //画像だった場合
				//画像のinputが押されたことにする
				imageInput.click();
				break;

			case 'file-button': //ファイルだった場合
				//ファイルのinputが押されたことにする
				fileInput.click();
				break;

			default:
				break;
		}
	}
};

let file;
let inputType;
//画像をアップロード
imageInput.oninput = (event) => {
	console.log("Image inputted");
	// 選択されたファイルを取得して上書き
	file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		//読み込みができたら
		reader.onload = (event) => {
			//もうプレビューファイルがあれば消す
			if (filePreviewContainer.children[0]) {
				filePreviewContainer.innerHTML = '';
			}
			// 新しいimg要素を作成して追加
			const previewImg = document.createElement('img');
			previewImg.src = event.target.result;
			const deleteButton = document.createElement('div');
			previewImg.appendChild(deleteButton);

			//プレビューに追加
			filePreviewContainer.appendChild(previewImg);
			console.log("Image loaded:" + file.name);

			CanSendUpdate(true);
			inputType = 'image'; //画像に設定
			plusButton.click(); //オプションを閉じる
			imageInput.value = ''; //inputの中身を初期化
		};
		//画像ファイルをDataURLとして読み込む
		reader.readAsDataURL(file);
	}
};

//ファイルをアップロード
fileInput.oninput = (event) => {
	console.log("File inputted");
	// 選択されたファイルを取得して上書き
	file = event.target.files[0];

	//もうプレビューファイルがあれば消す
	if (filePreviewContainer.children[0]) {
		filePreviewContainer.innerHTML = '';
	}

	// 新しいdiv要素を作成
	const previewFile = document.createElement('div');
	//アイコン
	const previewFileIcon = document.createElement('div');
	previewFileIcon.classList.add('preview-file-icon');
	//ファイル名
	const previewFileName = document.createElement('p');
	previewFileName.textContent = file.name;
	const deleteButton = document.createElement('div');

	//要素を組み立て
	previewFile.appendChild(previewFileIcon);
	previewFile.appendChild(previewFileName);
	previewFile.appendChild(deleteButton);

	//プレビューに追加
	filePreviewContainer.appendChild(previewFile);
	console.log("File loaded:" + file.name);

	CanSendUpdate(true);
	inputType = 'file'; //ファイルに設定
	plusButton.click(); //オプションを閉じる
	fileInput.value = ''; //inputの中身を初期化
};

//データチャンネルの各イベント
function SetupDataChannel(dataChannel) {
	dataChannel.onerror = (error) => {
		console.log('Data channel error:', error);
	};

	//受け取ったチャンクを保存しておく配列
	let receivedBuffers = [];
	//チャットでのメッセージ受け取り
	dataChannel.onmessage = (event) => {
		let senderName;
		if (typeof event.data === 'string') { //文字列かバイナリか
			//送られてきたユーザーIDとユーザー名とメッセージを取得
			const data = JSON.parse(event.data);

			if (data.userId && data.userName) {
				//senderNameの決定
				let partnerUserId = data.userId;
				senderName = data.userName;
				if (oldUserId === partnerUserId) { //IDが前のメッセージ送信者のIDと一致したらsenderNameを無しにする
					senderName = '';
				}
				oldUserId = partnerUserId;
			}

			switch (data.type) {
				case 'text': //メッセージの場合
					//messageの決定
					let message = data.message;
					//メッセージの表示の関数を呼ぶ
					CreateMessage(data.type, senderName, message, '', true);
					break;

				case 'image':
				case 'file': //画像とファイルの場合
					//チャンクの送信終了のメッセージが来たら
					if (data.message === 'end-of-file') {
						//配列からBlobを作成
						const blob = new Blob(receivedBuffers, { type: data.mimeType });
						//メッセージの表示の関数を呼ぶ
						CreateMessage(data.type, senderName, blob, data.fileName, true);
						//配列をリセット
						receivedBuffers = [];
					}
					break;

				default:
					break;
			}

			AutoScroll();
		} else {
			//配列にチャンクを追加
			receivedBuffers.push(event.data);
			console.log("Received chunk");
		}
	}

	dataChannel.onopen = () => {
		console.log('Data channel opened.');
		roomShow.textContent = roomName;
	};

	dataChannel.onclose = () => {
		console.log('Data channel closed.');
	};
}

//ビデオ通話ボタンの処理
cameraButton.onclick = ToggleCamera;
micButton.onclick = ToggleMic;

function ToggleCamera() {
	if (window.stream) {
		const videoTrack = window.stream.getVideoTracks()[0];
		if (videoTrack) {
			if (videoTrack.enabled) {
				cameraButton.classList.remove('camera-active');
			} else {
				cameraButton.classList.add('camera-active');
			}
			videoTrack.enabled = !videoTrack.enabled;
		}
	}
}

function ToggleMic() {
	if (window.stream) {
		const audioTrack = window.stream.getAudioTracks()[0];
		if (audioTrack) {
			if (audioTrack.enabled) {
				micButton.classList.remove('mic-active');
			} else {
				micButton.classList.add('mic-active');
			}
			audioTrack.enabled = !audioTrack.enabled;
		}
	}
}
