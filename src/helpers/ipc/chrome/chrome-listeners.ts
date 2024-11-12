import { BrowserWindow, ipcMain, Notification } from "electron";
import {
	CHROME_FETCH_DATA_CHANNEL,
	CHROME_OPEN_DEVTOOLS_CHANNEL,
	CHROME_TEST_TOOLS_CHANNEL,
	CHROME_WSS_CHANNEL,
} from "./chrome-channels";
import assert from "node:assert";
import WebSocket from "ws";
import LiveChatClient from "../../../services/LiveChatClient";
import type { parameter } from "../../../services/type";

type LoginInfo = parameter.LoginInfo;
type WSSParameter = parameter.WSSParameter;
type MessageParameter = parameter.MessageParameter;

let client: LiveChatClient | null = null;
export function addChromeEventListeners(mainWindow: BrowserWindow) {
	ipcMain.handle(CHROME_OPEN_DEVTOOLS_CHANNEL, () => mainWindow.webContents.openDevTools());
	ipcMain.handle(CHROME_FETCH_DATA_CHANNEL, async (event, url: string, option: string, ...args: string[]):Promise<any> => {
		assert(args.length == 2)
		return await (await fetch(url, JSON.parse(option))).json();
	});
	ipcMain.handle(CHROME_WSS_CHANNEL, async (event, action: string, ...args: string[]): Promise<any> => {
		switch (action) {
			case 'create':
				client = new LiveChatClient(args[0]);
				break;
			case 'login':
				const loginInfo = JSON.parse(args[0]) as LoginInfo;
				return client?.loginAndConnect(loginInfo) ?? false;
			case 'send':
				const messageInfo = JSON.parse(args[0]) as {message: MessageParameter, to: number};
				// TODO(dev)合成一个WSSParameter
/*				const params: WSSParameter = {

				}
				return client?.sendMessage(params)*/
				break;
			case 'close':
				client?.disconnect()
				break;
			default:
				break;
		}
	})

	ipcMain.handle(CHROME_TEST_TOOLS_CHANNEL,  async (event, ...args: string[]) => {
		if(args[0] === 'notify') {
			if(! Notification.isSupported()) {
				console.error(`Notification module is not supported.`);
				return;
			}
			new Notification({
				title: 'test title',
				subtitle: `test subtitle`, // macOS
				body: `test body`,
			}).show();
		}

		if(args[0] === 'fetch') {
			console.log(`https://${args[1]}/api/application/login`)
			let response = await fetch(`https://${args[1]}/api/application/login`,{
				method: 'POST',
				mode: 'cors',
				credentials: 'same-origin',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					"account": "test",
					"password": "test",
					"application": "Nexus"
				})
			})

			console.log('fetch: ', response);
			let data = await response.text()
			console.log('fetch: ', data);
			return JSON.parse(data);
		}

		if(args[0] === 'websocket') {
			let wsUrl = args[1];
			let token = args[2];
			let socket = new WebSocket(wsUrl, {
				headers: {
					'Authorization': token,
				}
			});
			socket.onopen = (_) => {
				console.log('Connected to WebSocket');
			}

			socket.onmessage = (event) => {
				console.log('Receive message', event.data);
			}

			socket.onerror = (_) => {
				console.log('WebSocket error.');
				socket.close();
			}

			socket.onclose = (_) => {
				console.log('WebSocket closed');
			}
		}
	})
}
