import WebSocket from "ws";
import { ApiService } from "./request";
import { ConnectEvent, parameter, response } from "./type";
import storage from "@/extensions/storeExtension";

let request: ApiService;

export class LiveChatError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "LiveChatError";
	}
}

export default class LiveChatClient {
	#serverUrl: string
	#reconnectAttempts: number = 0;
	#loginToken: string | null = null;
	#webSocket: WebSocket | null = null;

	static maxReconnectAttempts = 3; // 最大重连次数
	static reconnectInterval = 1000; // 重连间隔

	constructor(serverUrl: string) {
		this.#serverUrl = serverUrl;
		request = new ApiService(serverUrl);
	}

	/**
	 * 登录服务器
	 * @param loginInfo 登录信息
	 */
	async login(loginInfo: parameter.LoginInfo) {
		let response = await request.post('/api/application/login',loginInfo)

		let login_response = await response as response.LoginResponse;
		console.log(login_response)

		// const server = axios.create({baseURL: `https://${this.#serverUrl}`})
		// let login_response: LoginResponse = await server.post('/api/application/login', loginInfo);

		//let login_response = await response.json() as LoginResponse;
		const { status, message, application, token } = login_response;
		if ((status !== 0) || (application !== 'Nexus') || (!token)) {
			console.error(`Fail to login to server:\n${message}`)
			return false;
		}

		// assert(login_response.token !== null && login_response.token !== undefined);
		this.#loginToken = login_response.token ?? null;
		return true;
	}

	/**
	 * 取当前用户的用户信息
	 */
	async GetMyInfo() {
		let response = await request.get('/api/user/userinfo')

	}

	/**
	 * 连接到wss服务器
	 * @param handler WebSocket发生状态转换的时候的回调函数
	 */
	async connect(handler: (client: LiveChatClient, event: ConnectEvent) => void) {
		if (!this.#loginToken) {
			console.error('Log in before attempting to connect.');
			throw new LiveChatError('Log in before attempting to connect');
		}
		const wsUrl = `wss://${this.#serverUrl}/api/wss?application=Nexus`

		console.log(this.#loginToken)

		let socket = new WebSocket(wsUrl, {
			headers: {
				'Authorization': this.#loginToken,
			}
		});
		this.#webSocket = socket;

		const attemptReconnect = () => {
			this.#reconnectAttempts++;
			setTimeout(() => {
				this.connect(handler);
			}, LiveChatClient.reconnectInterval);
		}

		socket.onopen = (_) => {
			console.log('Connected to WebSocket');
			handler(this, { event_type: 'establish', obj: {} })
		}

		socket.onmessage = (event) => {
			let message = JSON.parse(typeof event.data === "string" ? event.data : '');
			console.log('Receive message', event.data);
			handler(this,{event_type: 'receive', obj: message});
		}

		socket.onerror = (_) => {
			console.log('WebSocket error.');
			handler(this, { event_type: 'terminate', obj: {} });
			socket.close();

			if (this.#reconnectAttempts < LiveChatClient.maxReconnectAttempts) {
				console.log(`尝试重新连接... (${this.#reconnectAttempts + 1}/${LiveChatClient.maxReconnectAttempts})`);
				attemptReconnect();
			} else {
				console.log("已达到最大重连次数，放弃重连");
				handler(this, { event_type: 'reset', obj: {} });
			}
		}

		socket.onclose = (event) => {
			console.log('WebSocket closed');
			handler(this, { event_type: 'close', obj: { reason: event.reason } });
		}
	}

	/**
	 * 登录并连接服务器
	 * @param loginInfo 登录信息
	 * @param handler WebSocket发生状态转换的时候的回调函数
	 */
	async loginAndConnect(loginInfo: parameter.LoginInfo, handler: (client: LiveChatClient, event: ConnectEvent) => void): Promise<boolean> {
		try {
			let loginResult = await this.login(loginInfo);
			if (!loginResult) return false;
			await this.connect(handler);
			console.log('ok');
			return true;
		}
		catch (error) {
			console.log('WebSocket error', error);
			return false;
		}
	}

	/**
	 * 断开与wss服务器的连接
	 */
	async disconnect() {
		this.#webSocket?.close();
	}
}
