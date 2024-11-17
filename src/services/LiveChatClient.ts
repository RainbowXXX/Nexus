import WebSocket from "ws";
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import SHA256 from 'crypto-js/sha256';
import { ApiService } from "./request";
import { serverEvent, parameter, response } from "./type";
import { mainWindow } from "../main";
import { v4 as uuidV4 } from "uuid";

const CryptoJS = require('crypto-js');

import ClientEventType = serverEvent.ServerEventType;
import ClientEventData = serverEvent.ServerEventData;
import UserInfo = response.UserInfo;
import WSSResponse = response.WSSResponse;
import BaseResponse = response.BaseResponse;
import PublickeyMessage = response.PublickeyMessage;
import InitialMessage = response.InitialMessage;
import WSSParameter = parameter.WSSParameter;
import ArriveMessage = response.ArriveMessage;
import PublickeyParameter = parameter.PublickeyParameter;
import SendMessageParameter = parameter.SendMessageParameter;
import assert from "node:assert";
import OnlineMessage = response.OnlineMessage;
import OfflineMessage = response.OfflineMessage;

let request: ApiService;

class Queue<T> {
	private queue: T[];
	private resolvers: ((value: any) => void)[];

	constructor() {
		this.queue = [];
		this.resolvers = [];
	}

	enqueue(item: T) {
		const cur_resolve = this.resolvers.shift()
		if (cur_resolve !== undefined) {
			cur_resolve(item);
		} else {
			this.queue.push(item);
		}
	}

	dequeue() {
		if (this.queue.length > 0) {
			return Promise.resolve(this.queue.shift());
		} else {
			return new Promise(resolve => {
				this.resolvers.push(resolve);
			});
		}
	}

	isEmpty() {
		return this.queue.length === 0;
	}

	size() {
		return this.queue.length;
	}
}

class AwaitableMap<Tx, Ty> {
	private map: Map<Tx, Ty>;
	private waitingResolvers: Map<Tx, ((value: Ty | undefined) => void)[]>;
	constructor() {
		this.map = new Map(); // 存储键值对
		this.waitingResolvers = new Map(); // 存储等待中的 Promise
	}

	set(key: Tx, value: Ty) {
		this.map.set(key, value);

		// 如果有等待该键的 Promise，则立即 resolve
		let resolvers = this.waitingResolvers.get(key);
		if (resolvers !== undefined) {
			resolvers.forEach(resolve => resolve(value));
			this.waitingResolvers.delete(key);
		}
	}

	async get(key: Tx): Promise<Ty | undefined> {
		if (this.map.has(key)) {
			return this.map.get(key);
		} else {
			return new Promise(resolve => {
				if (!this.waitingResolvers.has(key)) {
					this.waitingResolvers.set(key, [resolve]);
				}
				else {
					this.waitingResolvers.get(key)?.push(resolve);
				}
			});
		}
	}

	has(key: Tx) {
		return this.map.has(key);
	}

	// 删除键
	delete(key: Tx) {
		const result = this.map.delete(key);

		if (this.waitingResolvers.has(key)) {
			this.waitingResolvers.get(key)?.forEach(resolve =>
				resolve(undefined)
			);
			this.waitingResolvers.delete(key);
		}

		return result;
	}

	clear() {
		this.map.clear();

		this.waitingResolvers.forEach(resolvers => {
			resolvers.forEach(resolve => resolve(undefined));
		});
		this.waitingResolvers.clear();
	}
}

export class LiveChatError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "LiveChatError";
	}
}

export default class LiveChatClient {
	#serverUrl: string; // 服务器地址
	#loginToken: string | null = null; // 登录后的令牌
	#webSocket: WebSocket | null = null; // websocket 连接

	#aliveUserIdList: number[] = []; // 活跃用户的id
	#curUserInfo: UserInfo | null = null; // 当前用户信息

	#secretKey: Uint8Array | null = null;

	#newConnect: boolean = true;

	#publicKeyMap: AwaitableMap<number, string | undefined> = new AwaitableMap();

	#messageQueue: AwaitableMap<string, BaseResponse> = new AwaitableMap(); // 消息队列 TODO(dev) 实现消息的可等待

	constructor(serverUrl: string) {
		this.#serverUrl = serverUrl;
		request = new ApiService(serverUrl);
	}

	async wssSend(param: WSSParameter): Promise<undefined | BaseResponse> {
		return new Promise(async (resolve, reject) => {
			if (this.#webSocket === null) {
				// TODO(dev) 处理webSocket没有创建或者意外断开的情况
				reject('WebSocket not available');
				return;
			}
			this.#webSocket.send(JSON.stringify(param), (error) => {
				if (error) {
					reject(error);
					return;
				}
			})
			if (param.serial === undefined) resolve(undefined);
			else {
				resolve(await this.#messageQueue.get(param.serial));
			}
		})
	}

	makeWssParameter(param: any): WSSParameter {
		return {
			application: 'Nexus',
			type: 'user',
			serial: uuidV4().toString(),
			timestamp: Date.now(),
			data: param,
		}
	}

	async getPublicKeyById(user_id: number): Promise<string | undefined> {
		let param: PublickeyParameter = {
			type: 'GetPublickey',
			target: user_id,
		}
		let wssParam = this.makeWssParameter(param)
		let response = await this.wssSend(wssParam);

		if (response === undefined) return undefined;
		let res = response as WSSResponse;
		return (res.data as PublickeyMessage).publickey;
	}

	/**
	 * 消息处理函数
	 * @param event_type
	 * @param event_data
	 */
	private async handleServerEvent(event_type: ClientEventType, event_data: ClientEventData) {
		// 将消息转发给前端
		const forwardToFront = (event_channel: string, data: any) => {
			console.debug('Forwarding', event_channel, JSON.stringify(data))
			mainWindow?.webContents.send('client', event_channel, JSON.stringify(data));
		}
		console.debug('server event, type:', event_type, 'data:', JSON.stringify(event_data))

		switch (event_type) {
			case "login":
				let login_data = event_data as ClientEventData<{ 'token': string }>;
				// 登陆失败时通知前端
				if (!login_data.hasValue()) {
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
				this.#aliveUserIdList = [];
				forwardToFront('logout', ClientEventData.Some());
				break;
			case 'establish':
				// 连接失败时通知前端
				if (!event_data.hasValue()) {
					let error = event_data.getError();
					forwardToFront('login', ClientEventData.Error('Failed to connect to wss server: ' + error));
					console.error('Failed to connect to wss server:' + error);
					return;
				}

				// 登录成功通知前端
				this.#curUserInfo = await this.getCurrentUserInfo();
				forwardToFront('login', ClientEventData.Some({ 'curUserInfo': this.#curUserInfo }));
				break;
			case 'close':
				// wss断开后通知前端
				forwardToFront('close', ClientEventData.Some());
				break;
			case "terminate":
				// wss异常断开后通知前端
				let terminate_data = event_data as ClientEventData<{ 'message': string }>;
				forwardToFront('close', ClientEventData.Error(terminate_data.getData().message));
				break;
			case "receive_send":
				let receive_send_data = (event_data as ClientEventData<SendMessageParameter>).getData();
				forwardToFront("arrive", ClientEventData.Some({
					"message": receive_send_data.data,
					"from": {
						id: -1,
						name: '',
						avatar: '',
					},
					"to": {
						id: receive_send_data.exchange.to,
						name: '',
						avatar: '',
					},
				}));
				break;
			case "receive":
				// wss消息的处理
				let receive_data = (event_data as ClientEventData<WSSResponse>).getData();
				// 如果是一个回复消息
				if (receive_data.serial !== undefined) {
					this.#messageQueue.set(receive_data.serial, receive_data);
					break;
				}

				// 否则是服务器的通知
				let response_data = receive_data.data;
				switch (response_data.type) {
					case "UserOnline": {
						let online_data = response_data as OnlineMessage;
						let online_id = online_data.data.userid;
						if (this.#aliveUserIdList.find((val) => (val === online_id)) === undefined) {
							this.#aliveUserIdList.push(online_id);
						}
						let userList = await this.getUserInfo(this.#aliveUserIdList)
						forwardToFront('update', ClientEventData.Some({ 'friends_list': userList }));
						break;
					}
					case "UserOffline": {
						let online_data = response_data as OfflineMessage;
						let online_id = online_data.data.userid;
						this.#aliveUserIdList = this.#aliveUserIdList.filter((val) => val !== online_id)
						let userList = await this.getUserInfo(this.#aliveUserIdList)
						forwardToFront('update', ClientEventData.Some({ 'friends_list': userList }));
						break;
					}
					case "AliveUser": {
						let alive_data = response_data as InitialMessage;
						this.#aliveUserIdList = alive_data.data.aliveList;
						console.debug("Update alive user list: ", this.#aliveUserIdList);
						let userList = await this.getUserInfo(this.#aliveUserIdList);
						forwardToFront("update", ClientEventData.Some({ "friends_list": userList }));
						break;
					}
					case "MessageDistribution": {
						let arrive_data = response_data as ArriveMessage;
						console.debug("Message arrived: ", arrive_data.data, arrive_data.exchange);
						let publicKey = await this.getPublicKeyById(arrive_data.exchange.from);
						if (arrive_data.exchange.from !== arrive_data.exchange.to) {
							let [from, to] = await this.getUserInfo([arrive_data.exchange.from, arrive_data.exchange.to]) as [UserInfo, UserInfo];
							let dataUnBoxed = this.ReceiveMessagePretreatment(receive_data, publicKey).data as ArriveMessage;
							forwardToFront("arrive", ClientEventData.Some({
								"message": dataUnBoxed.data,
								"from": from,
								"to": to
							}));
							break;
						}
						let [from] = await this.getUserInfo([arrive_data.exchange.from]) as [UserInfo];
						let dataUnBoxed = this.ReceiveMessagePretreatment(receive_data, publicKey).data as ArriveMessage;
						forwardToFront("arrive", ClientEventData.Some({
							"message": dataUnBoxed.data,
							"from": from,
							"to": from
						}));
						break;
					}
					default:
						console.error(`Unsupported server notice type: ${response_data.type}.`)
						break;
				}
				break;
			default:
				console.error(`Unsupported event type: ${event_type}.`);
				break;
		}
	}

	/**
	 * 发送数据预处理: 加密和签名
	 * @param param 需要预处理的数据
	 * @param receiverPublicKey 接收方的公钥
	 */
	private SendMessagePretreatment(param: SendMessageParameter, receiverPublicKey: string | undefined) {
		let paramBoxed = param;

		// 如果私钥已经生成， 则加密
		if (this.#secretKey !== null && receiverPublicKey !== undefined) {
			let data_str = JSON.stringify(param.data);
			const encryptedData = CryptoJS.AES.encrypt(data_str, this.GetDHKey(receiverPublicKey)).toString();
			void encryptedData;
			paramBoxed.data = encryptedData;
		}

		return paramBoxed;
	}
	/**
	 * 发送数据预处理: 加密和签名
	 * @param response 需要预处理的数据
	 * @param senderPublicKey 发送方的公钥
	 */
	private ReceiveMessagePretreatment(response: WSSResponse, senderPublicKey: string | undefined) {
		let responseUnBoxed = response;
		let dataUnBoxed = responseUnBoxed.data as ArriveMessage;

		// 如果私钥已经生成， 则加密
		if (this.#secretKey !== null && senderPublicKey !== undefined && typeof (dataUnBoxed.data) === 'string') {
			let data_str = dataUnBoxed.data;
			const decryptedData = CryptoJS.AES.decrypt(data_str, this.GetDHKey(senderPublicKey)).toString(CryptoJS.enc.Utf8);
			dataUnBoxed.data = JSON.parse(decryptedData);
		}

		responseUnBoxed.data = dataUnBoxed;
		return responseUnBoxed;
	}

	async sendMessage(param: SendMessageParameter): Promise<BaseResponse | undefined> {
		this.handleServerEvent('receive_send', ClientEventData.Some(param))
		let publicKey = await this.getPublicKeyById(param.exchange.to);
		param.publickeyversion = publicKey ? SHA256(publicKey).toString() : 'None';
		let tmp_param = this.SendMessagePretreatment(param, publicKey);
		let wss_param = this.makeWssParameter(tmp_param);
		console.debug('paramFinal:', wss_param);
		return this.wssSend(wss_param);
	}

	/**
	 * 登录服务器
	 * @param loginInfo 登录信息
	 */
	async login(loginInfo: parameter.LoginInfo) {
		let response = await request.post('/api/application/login', loginInfo)

		let login_response = await response as response.LoginResponse;
		console.debug('login response: ', login_response)

		const { status, message, application, token } = login_response;
		if ((status !== 0) || (application !== 'Nexus') || (!token)) {
			console.error(`Fail to login to server:\n${message}`)
			this.handleServerEvent('login', ClientEventData.Error('Failed to login'));
			return false;
		}

		// assert(login_response.token !== null && login_response.token !== undefined);
		if (login_response.token === null) {
			this.handleServerEvent('login', ClientEventData.Error('Invalid token received from server'));
			return false;
		}
		this.handleServerEvent('login', ClientEventData.Some({ 'token': login_response.token }));
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

		socket.onopen = (_) => {
			console.debug('Connected to WebSocket');
			this.#webSocket = socket;
			this.handleServerEvent('establish', ClientEventData.Some())

		}

		socket.onerror = (event) => {
			console.debug('WebSocket error.');
			this.handleServerEvent('terminate', ClientEventData.Some({ message: event.message }));
			socket.close();
			this.#webSocket = null;
		}

		socket.onclose = (event) => {
			console.debug('WebSocket closed');
			this.handleServerEvent('close', ClientEventData.Some({ reason: event.reason }));
			this.#webSocket = null;
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
					this.handleServerEvent('receive', ClientEventData.Error(`Error message type: ${typeof event.data}`));
					return;
			}
			if (message.data.type === "RefreshPublickey" && message.message === "success" && message.info === "success") {
				console.info('证书更新成功！')
				this.#newConnect = false;
			}
			if (this.#newConnect) {
				console.info('尝试更新证书。。。')
				this.CreateKeyPair();
			}
			this.handleServerEvent('receive', ClientEventData.Some(message));
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
		let resdata: response.UserInfo = res.data as response.UserInfo
		if (resdata.avatar && resdata.avatar != '') {
			resdata.avatar = 'https://' + this.#serverUrl + resdata.avatar
		}
		return resdata
	}

	/**
	 * 获取好友信息
	 * @param userId 好友列表
	 */
	async getUserInfo(userId: number | number[] | null) {
		if (userId === null) return [];

		if (typeof userId === 'number') userId = [userId];
		const queryBody = {
			"ids": userId
		}

		let res = await request.post('/api/application/getusersinfo', queryBody) as response.UserInfoResponse
		const resdata = res.data as response.UserInfo[];
		resdata.forEach(item => {
			item.avatar = 'https://' + this.#serverUrl + item.avatar
		});
		return resdata;
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

	/**
	 * //@deprecated 该函数可能在未来版本中被修改或替代。
	 * 生成秘钥对
	 */
	async CreateKeyPair() {
		const keyPair = nacl.box.keyPair();
		const publicKey = keyPair.publicKey;
		const secretKey = keyPair.secretKey;
		const publicKeyBase64 = naclUtil.encodeBase64(publicKey);
		const publicKeyBase64Hash = SHA256(publicKeyBase64).toString();
		const messageUint8 = naclUtil.decodeUTF8(publicKeyBase64Hash + publicKeyBase64);
		const signKeyPair = nacl.sign.keyPair()
		const signature = nacl.sign.detached(messageUint8, signKeyPair.secretKey);
		const signatureBase64 = naclUtil.encodeBase64(signature);
		const param = {
			application: "Nexus",
			type: "user",
			timestamp: Date.now(),
			data: {
				type: "RefreshPublickey",
				publickeyversion: publicKeyBase64Hash,
				newpublickey: publicKeyBase64,
				signPub: naclUtil.encodeBase64(signKeyPair.publicKey),
				sign: signatureBase64
			}
		}
		this.#secretKey = secretKey;
		this.#webSocket?.send(JSON.stringify(param));
	}

	GetDHKey(_PublicKey: string) {
		assert(this.#secretKey !== null, 'Secret key is required');
		const PublicKey = naclUtil.decodeBase64(_PublicKey)
		const DHKey = nacl.scalarMult(this.#secretKey, PublicKey)
		return naclUtil.encodeBase64(DHKey)
	}
}
