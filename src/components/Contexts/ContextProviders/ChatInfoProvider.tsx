import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer, sendMessage } from "@/helpers/chrome_heplers";
import { serverEvent, parameter, response } from "@/services/type";
import { ChatInfo, ChatInfoContext, MessageInfo } from "../ChatInfoContext";

type UserInfo = response.UserInfo;
type LoginInfo = parameter.LoginInfo;
type MessageParameter = parameter.MessageParameter;
type ClientEventData = serverEvent.ServerEventData;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friends_list: [],
		alive_user_ids: [],
		cur_user_info: null,
		message_list: new Map(),

		connected: false,

		send(message: MessageParameter, to: number) {
			return sendMessage(message, to);
		},

		login(loginInfo: LoginInfo) {
			console.log('Logging ...')
			return loginServer(loginInfo);
		},
		logout() {
			console.log('Logout ...')
			closeClient()
		},
	};

	const [chatInfo, setChatInfo] = useState(initialState);

	const handler = (event_type: 'login' | 'close' | 'update' | 'arrive', data: ClientEventData) => {
		console.log('handling', event_type)
		switch (event_type) {
			case "login":
				if (data.hasValue()) {
					let curUserData = data.getData();
					console.log('login', {
						...chatInfo,
						connected: true,
						cur_user_info: curUserData.curUserInfo,
						friends_list: []
					})
					setChatInfo({
						...chatInfo,
						connected: true,
						cur_user_info: curUserData.curUserInfo,
						friends_list: []
					})
				}
				// 否则通知登录不成功
				break;
			case "close":
				// TODO(dev) 添加意外中断的处理
				console.log('close', initialState)
				setChatInfo(initialState);
				break;
			case "update":
				let update_data = data.getData();
				console.log('update', {
					...chatInfo,
					...update_data,
				})
				setChatInfo({
					...chatInfo,
					...update_data,
				})
				break;
			case 'arrive':
				let message_data = data.getData() as { 'message': MessageParameter, 'from': UserInfo, 'to': UserInfo };
				// 如果是别人发过来的消息
				let message_updated;
				if(message_data.from.id !== message_data.to.id && message_data.from.id !== -1) {
					let from_id = message_data.from.id;
					message_updated = chatInfo.message_list;
					let new_list = message_updated.get(from_id) ?? [];
					new_list.push({
						sender: from_id,
						content: message_data.message,
					})
					message_updated.set(from_id, new_list);
				}

				// 否则就是自己发出的消息
				else {
					if(message_data.from.id === message_data.to.id) break;
					let to_id = message_data.to.id;
					message_updated = chatInfo.message_list;
					let new_list = message_updated.get(to_id) ?? [];
					new_list.push({
						sender: -1,
						content: message_data.message,
					})
					message_updated.set(to_id, new_list);
				}

				setChatInfo({
					...chatInfo,
					message_list: message_updated,
				})
				break;
			default:
				break;
		}
	}

	const settings = useContext(SettingContext);

	useEffect(() => {
		return window.chromeTools.ipc.on('client', (l, r) => { handler(l, new serverEvent.ServerEventData<any>(JSON.parse(r))) });
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
