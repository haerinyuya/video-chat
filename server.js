'use strict';

const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = 3000;

const server = require('http').createServer(app);

const wsServer = new WebSocket.Server({ server });

const rooms = new Map();
const users = new Map();
let nextUserId = 1;

app.use(express.static('public'));

app.get('/', (request, response) => {
	response.writeHead(200, {
		'Content-Type': 'text/html'
	});
	response.sendFile(__dirname + 'public/index.html');
	console.log(`Sent a response: ${responseMessage}`);
});

wsServer.on('connection', (socket) => {
	console.log('WebSocket connected');

	socket.on('message', (message) => {
		const data = JSON.parse(message);
		const roomName = data.room;

		switch (data.type) {
			case 'join': // クライアントが部屋に参加
				const userName = data.userName;
				const userId = nextUserId++;

				//ルームを作る
				if (!rooms.get(roomName)) {
					rooms.set(roomName, []);
				} else {
					if (rooms.get(roomName).length > 1) {
						socket.send(JSON.stringify({
							type: 'room_error'
						}));
						return;
					}
				}

				//ユーザーの情報を保存
				users.set(userId, { userName: userName, socket: socket });

				//ルームにユーザーIDを登録
				rooms.get(roomName).push(userId);
				console.log("userID : " + rooms.get(roomName));

				// ルーム内のクライアントに相手のユーザー名を送信
				SendUserNameArray(rooms.get(roomName));

				// userIdをクライアントに返す
				socket.send(JSON.stringify({
					type: 'id_setup',
					userId: userId
				}));
				break;

			case 'leave': // クライアントが部屋を離れる
				//があれば
				if (rooms.get(roomName) && users.get(data.userId)) {
					//usersの中からこのユーザーを削除
					users.delete(data.userId);

					//userID配列からユーザーを削除
					const newUserIds = rooms.get(roomName).filter((n) => n !== data.userId);
					rooms.set(roomName, newUserIds);
					console.log("userID : " + rooms.get(roomName));

					if (rooms.get(roomName).length > 0) { //部屋に一人以上いれば
						//相手が抜けたことを知らせる
						rooms.get(roomName).forEach((roomUserId) => {
							if (data.userId !== roomUserId) {
								const userInfo = users.get(roomUserId);
								userInfo.socket.send(JSON.stringify({
									type: 'room_update',
									message: 'partner_left'
								}));
							}
						});
					} else { //部屋に一人もいなければ
						//部屋を削除
						rooms.delete(roomName);
					}
				}
				break;

			case 'offer': // 部屋内の他のクライアントにメッセージを送信
			case 'answer':
			case 'candidate':
				rooms.get(roomName).forEach((userId) => {
					if (userId !== data.userId) {
						const userInfo = users.get(userId);
						userInfo.socket.send(JSON.stringify(data));
					}
				});
				break;

			default:
				break;
		}
	});
});

function SendUserNameArray(roomUserIds) {
	roomUserIds.forEach((userId) => {
		roomUserIds.forEach((roomUserId) => {
			//違うIDのユーザー同士だったら
			if (userId !== roomUserId) {
				const userInfo = users.get(userId);
				//ユーザー名を送信
				userInfo.socket.send(JSON.stringify({
					type: 'room_update',
					userName: users.get(roomUserId).userName
				}));
				console.log(users.get(roomUserId).userName);
			}
		});
	});
}

server.listen(port);
console.log(`The server has started and is listening on port number: ${port}`);
