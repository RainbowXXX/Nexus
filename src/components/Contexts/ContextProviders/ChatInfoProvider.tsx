import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer } from "@/helpers/chrome_heplers";
import type { parameter } from "@/services/type";
import { ChatInfo, ChatInfoContext, FriendInfo, Message } from "../ChatInfoContext";

type LoginInfo = parameter.LoginInfo;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friend_list: [],

		established: false,
		disconnected: true,

		login(loginInfo: LoginInfo) {
			loginServer(loginInfo)
		},
		logout() {
			closeClient()
		},
	};
	const handleMsg = (msg: any) => {
		let msg_json = JSON.parse(msg) as Message;
		setChatInfo({
			...chatInfo,
			friend_list: msg_json.data.data.aliveList.map((val):FriendInfo => {
				return  { id: val }
			})
		})
	}
	const handler = (event_type: 'establish' | 'close' | 'terminate' | 'receive' | 'reset', msg: any) => {
		console.log('handle',event_type)
		switch (event_type) {
			case 'establish':
				setChatInfo({
					...chatInfo,
					established: true,
					disconnected: false,
				})
				break;
			case "terminate":
				setChatInfo({
					...chatInfo,
					established: false,
				})
				break;
			case "close":
			case "reset":
				setChatInfo({
					...chatInfo,
					established: false,
					disconnected: true,
				})
				break;
			case "receive":
				// TODO(dev) 添加接收消息的逻辑
				handleMsg(msg);
				console.log('Receive msg...', msg);
				break;
			default:
				break;
		}
	}

	const [chatInfo, setChatInfo] = useState(initialState);

	const settings = useContext(SettingContext);

	useEffect(() => {
		return window.chromeTools.ipc.on('wss', handler);
	}, []);

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
