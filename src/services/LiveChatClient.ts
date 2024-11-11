import WebSocket from "ws";
import { ApiService } from "./request";
import { client, parameter, response } from "./type";
import { mainWindow } from "../main";
import ClientEventType = client.ClientEventType;
import ClientEventData = client.ClientEventData;
import UserInfo = response.UserInfo;
import WSSResponse = response.WSSResponse;
import InitialMessage = response.InitialMessage;

let request: ApiService;

export class LiveChatError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "LiveChatError";
	}
}

export default class LiveChatClient {
	#serverUrl: string
	#loginToken: string | null = null;
	#webSocket: WebSocket | null = null;

	#aliveUserIdList: number[] = [];
	#friendIds: number[] | null = null;
	#curUserInfo: UserInfo | null = null;
	#friendInfoList: UserInfo[] | null = null;

	constructor(serverUrl: string) {
		this.#serverUrl = serverUrl;
		request = new ApiService(serverUrl);
	}

	/**
	 * 消息处理函数
	 * @param event_type
	 * @param event_data
	 */
	async handleClientEvent(event_type: ClientEventType, event_data: ClientEventData) {
		// 将消息转发给前端
		const forwardToFront = (event_channel: string, data: any) => {
			console.debug('Forwarding', event_channel, data)
			mainWindow?.webContents.send('client', event_channel, JSON.stringify(data));
		}

		switch (event_type) {
			case "login":
				let login_data = event_data as ClientEventData<{'token': string}>;
				// 登陆失败时通知前端
				if(! login_data.hasValue()) {
					let error = login_data.getError();
					forwardToFront('login', ClientEventData.Error('Failed to login: ' + error));
					console.error('Failed to login: ' + error);
					return;
				}

				// 登录成功更新token和个人信息
				this.#loginToken = login_data.getData().token;
				request.updateToken(this.#loginToken);

				console.debug('Update curUserInfo:', this.#curUserInfo);
				break;
			case 'logout':
				this.#loginToken = null;
				this.#curUserInfo = null;
				this.#friendInfoList = null;
				this.#aliveUserIdList = [];
				forwardToFront('logout', ClientEventData.Some());
				break;
			case 'establish':
				// 连接失败时通知前端
				if(! event_data.hasValue()) {
					let error = event_data.getError();
					forwardToFront('login', ClientEventData.Error('Failed to connect to wss server: ' + error));
					console.error('Failed to connect to wss server:' + error);
					return;
				}

				// 登录成功通知前端
				this.#curUserInfo = await this.getCurrentUserInfo();
				forwardToFront('login', ClientEventData.Some({'curUserInfo': this.#curUserInfo}));
				break;
			case 'close':
				// wss断开后通知前端
				forwardToFront('close', ClientEventData.Some());
				break;
			case "terminate":
				// wss异常断开后通知前端
				let terminate_data = event_data as ClientEventData<{'message': string}>;
				forwardToFront('close', ClientEventData.Error(terminate_data.getData().message));
				break;
			case "receive":
				// wss消息的处理
				let receive_data = (event_data as ClientEventData<WSSResponse>).getData();
				let response_data = receive_data.data;
				switch (response_data.type) {
					case "AliveUser":
						let alive_data = response_data as InitialMessage;
						this.#aliveUserIdList = alive_data.data.aliveList;
						console.debug('Update alive user list: ', this.#aliveUserIdList);
						forwardToFront('update', ClientEventData.Some({'alive_user_ids': this.#aliveUserIdList}));
						break;
					default:
						break;
				}
				break;
			default:
				console.error(`Unsupported event type: ${event_type}.`);
				break;
		}
	}

	/**
	 * 登录服务器
	 * @param loginInfo 登录信息
	 */
	async login(loginInfo: parameter.LoginInfo) {
		let response = await request.post('/api/application/login',loginInfo)

		let login_response = await response as response.LoginResponse;
		console.log(login_response)

		const { status, message, application, token } = login_response;
		if ((status !== 0) || (application !== 'Nexus') || (!token)) {
			console.error(`Fail to login to server:\n${message}`)
			this.handleClientEvent('login', ClientEventData.Error('Failed to login'));
			return false;
		}

		// assert(login_response.token !== null && login_response.token !== undefined);
		if(login_response.token === null) {
			this.handleClientEvent('login', ClientEventData.Error('Invalid token received from server'));
			return false;
		}
		this.handleClientEvent('login', ClientEventData.Some({'token' : login_response.token}));
		return true;
	}

	/**
	 * 连接到wss服务器
	 */
	async connect() {
		if (!this.#loginToken) {
			console.error('Log in before attempting to connect.');
			throw new LiveChatError('Log in before attempting to connect');
		}
		const wsUrl = `wss://${this.#serverUrl}/api/wss?application=Nexus`

		let socket = new WebSocket(wsUrl, {
			headers: {
				'Authorization': this.#loginToken,
			}
		});
		this.#webSocket = socket;

		socket.onopen = (_) => {
			console.debug('Connected to WebSocket');
			this.handleClientEvent('establish', ClientEventData.Some())
		}

		socket.onerror = (event) => {
			console.debug('WebSocket error.');
			this.handleClientEvent('terminate', ClientEventData.Some({message: event.message}) );
			socket.close();
		}

		socket.onclose = (event) => {
			console.debug('WebSocket closed');
			this.handleClientEvent('close', ClientEventData.Some({ reason: event.reason }));
		}

		socket.onmessage = (event) => {
			console.debug('Receive message', event.data);

			let message;
			switch (typeof event.data) {
				case 'string':
					message = JSON.parse(event.data);
					break;
				default:
					console.error(`Error message type: ${typeof event.data}`);
					this.handleClientEvent('receive', ClientEventData.Error(`Error message type: ${typeof event.data}`));
					return;
			}

			this.handleClientEvent('receive', ClientEventData.Some(message));
		}
	}

	/**
	 * 登录并连接服务器
	 * @param loginInfo 登录信息
	 */
	async loginAndConnect(loginInfo: parameter.LoginInfo): Promise<boolean> {
		console.debug('Start login and connected to server\n');
		try {
			let loginResult = await this.login(loginInfo);
			if (!loginResult) return false;
			await this.connect();
			console.debug('Login and connected to server successfully.');
			return true;
		}
		catch (error) {
			console.error('Login and connected to server failed', error);
			return false;
		}
	}

	/**
	 * 断开与wss服务器的连接
	 */
	async disconnect() {
		this.#webSocket?.close();
	}

	/**
	 * 取当前用户的用户信息
	 */
	async getCurrentUserInfo() {
		let res = await request.get('/api/user/userinfo') as response.UserInfoResponse
		return res.data as response.UserInfo
	}

	/**
	 * 获取好友信息
	 * @param userId 好友列表
	 */
	async getUserInfo(userId: number | number[] | null) {
		if(userId === null) return [];

		if(typeof userId === 'number') userId = [userId];
		const queryBody = {
			"ids": userId
		}

		let res = await request.post('/api/application/getusersinfo',queryBody) as response.UserInfoResponse
		return res.data as response.UserInfo[]
	}

/*	async initClient(loginInfo: parameter.LoginInfo) {
		let res = await this.loginAndConnect(loginInfo);
		if(! res) {
			return false;
		}

		let curUserInfo = await this.getCurrentUserInfo();
		this.handleClientEvent('update_user', ClientEventData.Some(curUserInfo));

		let userInfos = await this.getUserInfo(this.#friendIds);
		this.handleClientEvent('update_user', ClientEventData.Some(userInfos));

	}*/
}
