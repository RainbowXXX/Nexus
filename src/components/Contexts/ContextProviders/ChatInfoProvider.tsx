import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer, sendMessage } from "@/helpers/chrome_heplers";
import { event, parameter, Tools } from "@/services/type";
import { ChatInfo, ChatInfoContext, MessageInfo } from "../ChatInfoContext";
import { storage } from "@/helpers/store_helpers";

type Result = Tools.Result;
type ClientEventType = event.ClientEventType;
type LoginParameter = parameter.LoginParameter;
type MessageParameter = parameter.MessageParameter;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friendsList: [],
		aliveUserIds: [],
		curUserInfo: null,
		messageList: new Map(),
		checkWaitingMessageList: new Map(),

		connected: false,

		send(message: MessageParameter, to: number) {
			return sendMessage(message, to);
		},

		login(loginInfo: LoginParameter) {
			return loginServer(loginInfo);
		},
		logout() {
			closeClient()
		},
	};

	const [chatInfo, _setChatInfo] = useState(initialState);
	// TODO(dev) 修复存储问题
	const setChatInfo = (chatInfo: ChatInfo) => {
		let checkList: [number, [string, MessageInfo][]] [] = [...chatInfo.checkWaitingMessageList].map(([uid, map]) => [uid, [...map]]);
		let savedChatInfo = {
			messageList: [...chatInfo.messageList],
			checkWaitingMessageList: checkList,
		}
		storage.set('lastChatInfo', JSON.stringify(savedChatInfo)).then(async () => {
			await storage.flush();
			console.log('chatInfo save successfully.', JSON.stringify(savedChatInfo));
		});
		_setChatInfo(chatInfo);
	}

	const handler = (event_type: ClientEventType, event_data: Result) => {
		console.log('handling', event_type)
		switch (event_type) {
			case "login": {
				if (event_data.hasValue()) {
					setChatInfo({
						...chatInfo,
						connected: true,
						friendsList: [],
					});
				}
				// 否则通知登录不成功
				break;
			}
			case "close": {
				// TODO(dev) 添加意外中断的处理
				console.log("close", initialState);
				setChatInfo(initialState);
				break;
			}
			case "update": {
				let update_data = event_data.getData();
				console.log("update_data: ", update_data);
				setChatInfo({
					...chatInfo,
					...update_data,
				});
				break;
			}
			case 'arrive': {
				let message_data = event_data.getData() as { "message": MessageParameter, "from": number, "to": number };
				console.log(message_data);
				// 如果是别人发过来的消息
				let message_updated;
				if (message_data.from !== message_data.to && message_data.from !== -1) {
					let from_id = message_data.from;
					message_updated = chatInfo.messageList;
					let new_list = message_updated.get(from_id) ?? [];
					new_list.push({
						sender: from_id,
						content: message_data.message,
					});
					message_updated.set(from_id, new_list);
				}

				// 否则就是自己发出的消息
				else {
					if (message_data.from === message_data.to) {
						message_updated = chatInfo.messageList;
						let new_list = message_updated.get(-1) ?? [];
						new_list.push({
							sender: -1,
							content: message_data.message,
						});
						message_updated.set(-1, new_list);
						break;
					}
					let to_id = message_data.to;
					message_updated = chatInfo.messageList;
					let new_list = message_updated.get(to_id) ?? [];
					new_list.push({
						sender: -1,
						content: message_data.message,
					});
					message_updated.set(to_id, new_list);
				}

				setChatInfo({
					...chatInfo,
					messageList: message_updated,
				});
				break;
			}
			case 'send': {
				if(event_data.hasError()) {
					// TODO 处理消息没有发送成功的情况
					console.error('Fail to send Message: ' + event_data.getError());
					break;
				}

				if(event_data.hasValue()) {
					const {exchange, waitKey, data} = event_data.getData() as {'exchange': {to: number}, 'waitKey': string, 'data': MessageParameter};

					let check_waiting_map = chatInfo.checkWaitingMessageList;
					const new_list = check_waiting_map.get(exchange.to) ?? new Map<string, MessageInfo>();
					new_list.set(waitKey, {sender: exchange.to, content: data });
					check_waiting_map.set(exchange.to, new_list);
					setChatInfo({
						...chatInfo,
						checkWaitingMessageList: check_waiting_map,
					})
				}
				break;
			}
			case "check": {
				if(event_data.hasError()) {
					// TODO 处理消息没有发送成功的情况
					console.error('Fail to send Message: ' + event_data.getError());
					break;
				}

				if(event_data.hasValue()) {
					const {exchange, waitKey} = event_data.getData() as {'exchange': {to: number}, 'waitKey': string};

					let check_waiting_map = chatInfo.checkWaitingMessageList;

					const new_list = check_waiting_map.get(exchange.to);
					if(new_list !== undefined) {
						const new_message_map = chatInfo.messageList;

						const new_message_list = new_message_map.get(exchange.to) ?? [];
						const data = new_list.get(waitKey) as MessageInfo;

						new_message_list.push(data);
						new_message_map.set(exchange.to, new_message_list);

						new_list.delete(waitKey);
						check_waiting_map.set(exchange.to, new_list);

						setChatInfo({
							...chatInfo,
							checkWaitingMessageList: check_waiting_map,
							messageList: new_message_map,
						})
					}
				}
				break;
			}
			default:
				break;
		}
	}

	const settings = useContext(SettingContext);

	useEffect(() => {
		storage.get('lastChatInfo').then((value) => {
			if(value !== undefined) {
				let last_data = JSON.parse(value) as {
					messageList: [number, MessageInfo[]][],
					checkWaitingMessageList: [number, [string, MessageInfo][]] []
				};
				let check_map:[number, Map<string, MessageInfo>] [] = last_data.checkWaitingMessageList.map(([uid, map_iter]) => [uid, new Map(map_iter)])
				_setChatInfo({
					...chatInfo,
					messageList: new Map<number, MessageInfo[]>(last_data.messageList),
					checkWaitingMessageList: new Map(check_map)
				});
			}
		})
	}, []);

	useEffect(() => {
		return window.chromeTools.ipc.on('client', (l, r) => { handler(l, new Tools.Result<any>(r)) });
	}, [chatInfo]);

	useEffect(() => {
		if(!settings[0].serverAddress) return;
		createClient(settings[0].serverAddress)
		return () => { closeClient(); };
	}, [settings[0].serverAddress]);

	return (
		<ChatInfoContext.Provider value={chatInfo}>
			{children}
		</ChatInfoContext.Provider>
	);
}
