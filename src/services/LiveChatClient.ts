import WebSocket from "ws";
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import SHA256 from 'crypto-js/sha256';
import { ApiService } from "./request";
import { serverEvent, parameter, response, Tools } from "./type";
import { mainWindow } from "../main";
import { v4 as uuidV4 } from "uuid";
import storage from "../extensions/storeExtension";
import CryptoJS from "crypto-js";

import assert from "node:assert";

import Result = Tools.Result;

import ClientEventType = serverEvent.ServerEventType;
import UserInfo = response.UserInfo;
import WSSResponse = response.WSSResponse;
import BaseResponse = response.BaseResponse;
import PublickeyMessage = response.GetPublicKeyMessage;
import InitialMessage = response.InitialMessage;
import WSSRequestParameter = parameter.WSSRequestParameter;
import ArriveMessage = response.ArriveMessage;
import GetPublicKeyRequest = parameter.GetPublicKeyRequest;
import SendMessageRequest = parameter.SendMessageRequest;
import OnlineMessage = response.OnlineMessage;
import OfflineMessage = response.OfflineMessage;

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

// 需要定期更新的数据
class TimedData<T> {
	data: T;
	lastUpdate: number;
	intervalHandler: number| null;

	private static registry = new FinalizationRegistry(
		(intervalHandler: number) => {
			clearInterval(intervalHandler)
		}
	);

	constructor(initialValue: T) {
		this.data = initialValue;
		this.intervalHandler = null;
		this.lastUpdate = Date.now();
	}

	private updater(updater: (oldValue: T) => T) {
		this.data = updater(this.data);
		this.lastUpdate = Date.now();
	}

	autoUpdate(intervalMs: number| null, updater?: (oldValue: T) => T) {
		if(intervalMs === null || intervalMs === undefined) {
			if(this.intervalHandler) {
				clearInterval(this.intervalHandler)
				TimedData.registry.unregister(this);
				this.intervalHandler = null;
			}
			return;
		}
		if(intervalMs <= 0) {
			throw new Error("intervalMs must be greater than 0");
		}

		this.intervalHandler = setInterval(this.updater, intervalMs, updater);
		TimedData.registry.register(this, this.intervalHandler);
	}
}

export class LiveChatError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "LiveChatError";
	}
}

export default class LiveChatClient {
	readonly login_endpoint = '/api/application/login';

	#serverUrl: string; // 服务器地址
	#loginToken: string | null = null; // 登录后的令牌
	#secretKey: Uint8Array | null = null; // 客户端的私钥

	#request: ApiService; // HTTP(S)连接
	#webSocket: WebSocket | null = null; // WebSocket 连接

	#aliveUserIdList: Set<number> = new Set(); // 活跃用户的id
	#curUserInfo: UserInfo | null = null; // 当前用户信息

	#messageMap: AwaitableMap<string, BaseResponse> = new AwaitableMap(); // 消息列表
	#userInfoMap: AwaitableMap<number, TimedData<UserInfo>> = new AwaitableMap(); // 用户信息
	#publicKeyMap: AwaitableMap<number, TimedData<string| undefined>> = new AwaitableMap(); // 其他用户的公钥

	#keyPairPublished: boolean = false; // 公钥是否已经上传成功

	// 回收资源的注册表
	private static registry = new FinalizationRegistry(
		(webSocket: WebSocket) => {
			webSocket.close();
		}
	);

	// ------------------------------------成员函数------------------------------------
	constructor(serverUrl: string) {
		this.#serverUrl = serverUrl;
		this.#request = new ApiService(serverUrl);

		this.resetClient();
	}

	/**
	 * 重置除了serverUrl, request, secretKey之外的其他字段
	 */
	resetClient(): void {
		this.#loginToken = null;
		this.#webSocket?.close();
		this.#webSocket = null;
		this.#aliveUserIdList.clear();
		this.#curUserInfo = null;
		this.#messageMap.clear();
		this.#userInfoMap.clear();
		this.#publicKeyMap.clear();
	}

	/**
	 * 发送wss信息
	 * @param data wss信息
	 * @param cb 回调函数
	 */
	wssSendSync(data: any, cb?: ((err?: Error) => void) | undefined): Result<void> {
		if(this.#webSocket === null) {
			return Result.Error('WebSocket connect not available');
		}
		this.#webSocket.send(JSON.stringify(data), cb)
		return Result.Some();
	}

	/**
	 * 发送wss消息
	 * @param data wss消息
	 * @param timeoutMs 超时时间(ms) 当小于0时无限等待(不推荐)
	 * @param exceptReply 为真时, 当序列号(serial)存在的时候, 期待服务器回复
	 */
	async wssSend(data: WSSRequestParameter, timeoutMs: number, exceptReply: boolean): Promise<Result<any>> {
		let result_case = new Promise<Result<any>>(async (resolve, _reject) => {
			let sendRes = this.wssSendSync(data, (error) => {
				if(error) {
					resolve(Result.Error(`Send WebSocket message Fail: \n${typeof error}: \n` + JSON.stringify(error)));
				}
			})
			if(!sendRes.hasValue()) {
				resolve(sendRes);
				return;
			}
			if ((data.serial === undefined) || (!exceptReply)) {
				resolve(Result.Some());
				return;
			}

			let res = await this.#messageMap.get(data.serial);

			if(res === undefined) {
				resolve(Result.Error('Wait operation canceled.'));
				return;
			}
			resolve(Result.Some(res));
		})
		if(timeoutMs > 0) {
			let timeout_case = new Promise<Result>((resolve, _reject) => {
				const timeout_handler = setTimeout(() => {
					resolve(Result.Error('Operation timeout'));
					clearTimeout(timeout_handler);
				}, timeoutMs);
			})
			return Promise.race([timeout_case, result_case])
		}
		return result_case;
	}

	/**
	 * 从数据构造出请求体
	 * @param data 需要发送的数据
	 * @param serial 请求的序列号 (如果为undefined则不期望服务器回复)
	 */
	makeWssRequestWithData(data: any, serial: string| undefined = uuidV4().toString()): WSSRequestParameter {
		return {
			application: 'Nexus',
			type: 'user',
			serial: serial,
			timestamp: Date.now(),
			data: data,
		}
	}

	/**
	 * 获取指定用户的公钥
	 * @param user_id 指定用户的id
	 * @return 返回指定用户的公钥
	 */
	async getPublicKeyById(user_id: number): Promise<Result<string| undefined>> {
		let reqData: GetPublicKeyRequest = {
			type: 'GetPublickey',
			target: user_id,
		}

		let wssReq = this.makeWssRequestWithData(reqData)
		let result = await this.wssSend(wssReq, 1000, true);

		if (!result.hasValue()) {
			console.error(`Fail to get public key of user ${user_id}.`);
			return result;
		}

		let response = result as Result<WSSResponse>;
		let res = response.getData();
		return Result.Some((res.data as PublickeyMessage).publickey);
	}

	/**
	 * 转发事件到react前端
	 * @param event_channel 事件通道
	 * @param data 事件携带的数据
	 */
	private forwardEventToFront(event_channel: string, data: any): Result<void> {
		console.debug('Forwarding', event_channel, JSON.stringify(data))
		if(mainWindow === null) {
			return Result.Error('Fail to forward event to front: mainWindow not available.');
		}
		mainWindow.webContents.send('client', event_channel, JSON.stringify(data));
		return Result.Some();
	}

	/**
	 * 消息处理函数
	 * @param event_type 事件类型
	 * @param event_data 事件所携带的数据
	 */
	private async handleServerEvent(event_type: ClientEventType, event_data: Result): Promise<Result<void>> {
		console.debug(`Receive server event:\ntype: ${event_type}\ndata: ${JSON.stringify(event_data)}`)
		switch (event_type) {
			case "login": {
				// 登陆失败时通知前端
				if (event_data.hasError()) {
					console.error("Failed to login: " + event_data.getError());
					return this.forwardEventToFront("login", event_data);
				}

				let login_data = event_data as Result<{ "token": string }>;

				// 登录成功更新token和个人信息
				this.#loginToken = login_data.getData().token;
				this.#request.updateToken(this.#loginToken);

				console.debug("Update curUserInfo to http(s) client:", this.#curUserInfo);
				return Result.Some();
			}
			case 'logout': {
				this.resetClient();
				return this.forwardEventToFront("logout", Result.Some());
			}
			case 'establish': {
				// 连接失败时通知前端
				if (!event_data.hasValue()) {
					let error = event_data.getError();
					console.error("Failed to connect to wss server:" + error);
					return this.forwardEventToFront("login", event_data);
				}

				// 登录成功通知前端
				let res = this.forwardEventToFront("login", Result.Some());
				if (res.hasError()) return res;

				// 更新当前用户的信息 TODO(dev) 通知前端
				let user_info_res = await this.getCurrentUserInfo();
				if(user_info_res.hasError()) {
					return user_info_res;
				}
				this.#curUserInfo = user_info_res.getData();
				return Result.Some();
			}
			case 'close': {
				// wss断开后通知前端
				console.info('Wss client closed, reason:', event_data.getData());
				return this.forwardEventToFront("close", Result.Some());
			}
			case "terminate": {
				// wss异常断开后通知前端
				return this.forwardEventToFront("close", event_data);
			}
			case "receive": {
				return this.handleMessage(event_data as Result<WSSResponse>);
			}
			default: {
				console.error(`Unsupported event type: ${event_type}.`);
				return Result.Error(`Unsupported event type: ${event_type}.`);
			}
		}
	}

	/**
	 * 处理其他客户端的消息
	 * @param data 消息携带的数据
	 */
	private async handleMessage(data: Result<WSSResponse>): Promise<Result<void>> {
		// wss消息的处理
		let receive_data = data.getData();

		// 如果是一个回复消息
		if (receive_data.serial !== undefined) {
			this.#messageMap.set(receive_data.serial, receive_data);
			return Result.Some();
		}

		// 否则是服务器的通知
		let response_data = receive_data.data;
		switch (response_data.type) {
			case 'RefreshPublickey':{
				if(receive_data.status === 0 && receive_data.message === "success" && 'info' in receive_data && receive_data.info === "success") {
					this.#keyPairPublished = true;
				}
				return Result.Some();
			}
			// 用户上线的消息
			case "UserOnline": {
				let online_data = response_data as OnlineMessage;
				let online_id = online_data.data.userid;
				// 如果不存在当前用户, 则把用户添加进活跃用户列表
				if (!this.#aliveUserIdList.has(online_id)) {
					this.#aliveUserIdList.add(online_id);
				}
				else {
					console.warn('Users are added repeatedly');
				}

				let userList = await this.getUserInfo([...this.#aliveUserIdList])
				return this.forwardEventToFront('update', Result.Some({ 'friends_list': userList }));
			}
			case "UserOffline": {
				let online_data = response_data as OfflineMessage;
				let online_id = online_data.data.userid;
				this.#aliveUserIdList.delete(online_id)
				let userList = await this.getUserInfo([... this.#aliveUserIdList])
				return this.forwardEventToFront('update', Result.Some({ 'friends_list': userList }));
			}
			case "AliveUser": {
				let alive_data = response_data as InitialMessage;
				this.#aliveUserIdList = new Set(alive_data.data.aliveList);
				console.debug("Update alive user list: ", this.#aliveUserIdList);
				let userList = await this.getUserInfo([... this.#aliveUserIdList]);
				return this.forwardEventToFront("update", Result.Some({ "friends_list": userList }));
			}
			case "MessageDistribution": {
				let arrive_data = response_data as ArriveMessage;
				console.debug("Message arrived: ", arrive_data.data, arrive_data.exchange);

				let use_public_key = true;
				let public_key_res = await this.getPublicKeyById(arrive_data.exchange.from);
				if(public_key_res.hasError()) {
					use_public_key = false;
					console.error(`Fail to get public key of user ${arrive_data.exchange.from}: ${public_key_res.getError()}`);
				}
				let public_key = public_key_res.getData();
				let data_unboxed_res = this.ReceiveMessagePretreatment(receive_data, use_public_key ? public_key: undefined);
				if(data_unboxed_res.hasError()) {
					return this.forwardEventToFront("arrive", data_unboxed_res);
				}

				let data_unboxed = data_unboxed_res.getData().data as ArriveMessage;
				return this.forwardEventToFront("arrive", Result.Some({
					"message": data_unboxed.data,
					"from": arrive_data.exchange.from,
					"to": arrive_data.exchange.to
				}));
			}
			default: {
				console.error(`Unsupported server notice type: ${response_data.type}.`);
				return Result.Error(`Unsupported server notice type: ${response_data.type}.`)
			}
		}
	}

	/**
	 * 发送数据预处理: 加密和签名
	 * @param param 需要预处理的数据
	 * @param receiverPublicKey 接收方的公钥, 如果为undefined则不加密(不推荐)
	 */
	private SendMessagePretreatment(param: SendMessageRequest, receiverPublicKey: string | undefined): Result {
		try{
			let paramBoxed = param;
			// 如果私钥已经生成， 则加密
			if (this.#secretKey !== null && receiverPublicKey !== undefined) {
				let data_str = JSON.stringify(param.data);
				const encryptedData = CryptoJS.AES.encrypt(data_str, this.GetDHKey(receiverPublicKey)).toString();
				void encryptedData;
				paramBoxed.data = encryptedData;
			}
			return Result.Some(paramBoxed);
		}
		catch (error) {
			if(error instanceof Error) {
				return Result.Error(`Fail to preprocessing message: ${error.message}`);
			}
			return Result.Error(`Fail to preprocessing message: ${JSON.stringify(error)}`);
		}
	}
	/**
	 * 接收数据预处理: 解密并验证签名
	 * @param response 需要预处理的数据
	 * @param senderPublicKey 发送方的公钥
	 */
	private ReceiveMessagePretreatment(response: WSSResponse, senderPublicKey: string | undefined): Result<WSSResponse> {
		let responseUnBoxed = response;
		let dataUnBoxed = responseUnBoxed.data as ArriveMessage;

		if(typeof (dataUnBoxed.data) === 'string') {
			if(this.#secretKey === null) {
				return Result.Error(`Cannot decrypt data: secret key not available`);
			}
			if(senderPublicKey === undefined) {
				return Result.Error(`Cannot decrypt data: sender public key not available`);
			}
			try{
				let data_str = dataUnBoxed.data;
				const decryptedData = CryptoJS.AES.decrypt(data_str, this.GetDHKey(senderPublicKey)).toString(CryptoJS.enc.Utf8);
				dataUnBoxed.data = JSON.parse(decryptedData);

				responseUnBoxed.data = dataUnBoxed;
				return Result.Some(responseUnBoxed);
			}
			catch (error) {
				if(error instanceof Error) {
					return Result.Error(`Fail to preprocessing message: ${error.message}`);
				}
				return Result.Error(`Fail to preprocessing message: ${JSON.stringify(error)}`);
			}
		}
		return Result.Some(responseUnBoxed);
	}

	/**
	 * 发送消息
	 * @param param 发送的消息
	 * @param timeoutMs 保留字段
	 */
	async sendMessage(param: SendMessageRequest, timeoutMs: number = -1): Promise<Result<BaseResponse | undefined>> {
		let public_key: string| undefined;
		let public_key_res = await this.getPublicKeyById(param.exchange.to);
		if(public_key_res.hasError()) {
			public_key = undefined;
			console.warn(`Fail to get public_key from server: ${public_key_res.getError()}`);
		}
		else {
			public_key = public_key_res.getData();
		}

		param.publickeyversion = public_key ? SHA256(public_key).toString() : 'None';
		let preprocessed_param = this.SendMessagePretreatment(param, public_key);
		let final_param = this.makeWssRequestWithData(preprocessed_param);
		console.debug('paramFinal:', final_param);
		return await this.wssSend(final_param, timeoutMs,false);
	}

	/**
	 * 登录服务器
	 * @param loginInfo 登录信息
	 */
	async login(loginInfo: parameter.LoginParameter): Promise<Result<string>> {
		let response = await this.#request.post(this.login_endpoint, loginInfo)

		if(response.hasError()) {
			return response as Result<any>;
		}

		let login_response = response.getData() as response.LoginResponse;
		console.debug('login response: ', login_response)

		const { message, application, token } = login_response;
		if (application !== 'Nexus') {
			console.error(`Fail to login to server:\nError application: ${application}`);
			return (await this.handleServerEvent('login', Result.Error(`Fail to login to server:\nError application: ${application}`))) as Result<any>;
		}
		if(token === undefined) {
			console.error(`Invalid token received from server:\n${message}`);
			return (await this.handleServerEvent('login', Result.Error(`Invalid token received from server:\n${message}`))) as Result<any>;
		}

		return (await this.handleServerEvent('login', Result.Some(login_response.token))) as Result<any>;
	}

	/**
	 * 连接到wss服务器
	 */
	async connect(): Promise<Result<void>> {
		const wsUrl = `wss://${this.#serverUrl}/api/wss?application=Nexus`

		if (!this.#loginToken) {
			console.error('Log in before attempting to connect.');
			return Result.Error('Log in before attempting to connect.');
		}

		let socket = new WebSocket(wsUrl, {
			headers: {
				'Authorization': this.#loginToken,
			}
		});

		socket.onopen = (_) => {
			console.debug('Connected to WebSocket');
			this.#webSocket = socket;
			LiveChatClient.registry.register(this, socket);
			this.handleServerEvent('establish', Result.Some())
		}

		socket.onerror = (event) => {
			console.debug('WebSocket error.');
			this.handleServerEvent('terminate', Result.Error(event.message));

			socket.close();
			this.#webSocket = null;
			LiveChatClient.registry.unregister(this);
		}

		socket.onclose = (event) => {
			console.debug('WebSocket closed');
			this.handleServerEvent('close', Result.Some(event.reason));
			this.#webSocket = null;
			LiveChatClient.registry.unregister(this);
		}

		socket.onmessage = (event) => {
			console.debug('Receive message', event.data);
			if (!this.#keyPairPublished) {
				console.info('尝试更新证书。。。')
				this.CreateKeyPair();
			}

			let message;
			switch (typeof event.data) {
				case 'string':
					message = JSON.parse(event.data);
					return this.handleServerEvent('receive', Result.Some(message));
				default:
					console.error(`Error message type: ${typeof event.data}`);
					this.handleServerEvent('receive', Result.Error(`Error message type: ${typeof event.data}`));
					return;
			}
		}
		return Result.Some();
	}

	async tryAutoLogin(): Promise<Result<void>> {
		try {
			let store = await storage.get('User') ?? '';
			console.log(store)
			this.#loginToken = JSON.parse(store).token;
			if(this.#loginToken === null) {
				console.info('Fail to auto login: no valid token found.');
				return Result.Error('Fail to auto login: no valid token found.');
			}
			console.log('Cur token', this.#loginToken)
			this.#request.updateToken(this.#loginToken)

			await this.getCurrentUserInfo();
			await this.connect();
			return Result.Some();
		}
		catch (error) {
			console.warn('Fail to auto login.', error);
			if(error instanceof Error) {
				return Result.Error(`Fail to auto login: ${error.message}.`);
			}
			return Result.Error(`Fail to auto login: ${JSON.stringify(error)}.`);
		}
	}

	/**
	 * 登录并连接服务器
	 * @param loginInfo 登录信息
	 */
	async loginAndConnect(loginInfo: parameter.LoginParameter): Promise<boolean> {
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
	async getCurrentUserInfo(): Promise<Result<UserInfo>> {
		let get_user_info_res = await this.#request.get('/api/user/userinfo')

		if(get_user_info_res.hasError()) {
			console.error(`Fail to get cur user info from server: ${get_user_info_res.getError()}`);
			return get_user_info_res as Result<any>;
		}

		let user_info_res = get_user_info_res.getData() as response.UserInfoResponse;
		let user_info_data: response.UserInfo = user_info_res.data as response.UserInfo
		if (user_info_data.avatar && user_info_data.avatar != '') {
			user_info_data.avatar = 'https://' + this.#serverUrl + user_info_data.avatar
		}
		return Result.Some(user_info_data);
	}

	/**
	 * 获取好友信息
	 * @param userId 好友列表
	 */
	async getUserInfo(userId: number | number[] | null): Promise<Result<UserInfo[]>> {
		if (userId === null) {
			return Result.Some([])
		}

		if (typeof userId === 'number') userId = [userId];
		const queryBody = {
			"ids": userId
		}

		let get_user_info_res = await this.#request.post('/api/application/getusersinfo', queryBody)
		if(get_user_info_res.hasError()) {
			return get_user_info_res as Result;
		}

		let user_info_res = get_user_info_res.getData() as response.UserInfoResponse
		const user_info_date = user_info_res.data as response.UserInfo[];
		user_info_date.forEach(item => {
			item.avatar = 'https://' + this.#serverUrl + item.avatar
		});

		const dataMap = new Map(user_info_date.map(item => [item.id, item]));
		const sorted_data = userId.map(id => dataMap.get(id) as UserInfo);

		return Result.Some(sorted_data);
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
	async CreateKeyPair(): Promise<Result<void>> {
		const keyPair = nacl.box.keyPair();
		const publicKey = keyPair.publicKey;
		const secretKey = keyPair.secretKey;
		const publicKeyBase64 = naclUtil.encodeBase64(publicKey);
		const publicKeyBase64Hash = SHA256(publicKeyBase64).toString();
		const messageUint8 = naclUtil.decodeUTF8(publicKeyBase64Hash + publicKeyBase64);
		const signKeyPair = nacl.sign.keyPair()
		const signature = nacl.sign.detached(messageUint8, signKeyPair.secretKey);
		const signatureBase64 = naclUtil.encodeBase64(signature);
		const param: WSSRequestParameter = {
			application: "Nexus",
			type: "user",
			serial: uuidV4().toString(),
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
		return this.wssSend(param, 1000, false);
	}

	GetDHKey(_PublicKey: string) {
		assert(this.#secretKey !== null, 'Secret key is required');
		const PublicKey = naclUtil.decodeBase64(_PublicKey)
		const DHKey = nacl.scalarMult(this.#secretKey, PublicKey)
		return naclUtil.encodeBase64(DHKey)
	}
}
