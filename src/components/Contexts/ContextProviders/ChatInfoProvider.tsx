import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer } from "@/helpers/chrome_heplers";
import type { parameter } from "@/services/type";
import { ChatInfo, ChatInfoContext, UserInfo, Message } from "../ChatInfoContext";

type LoginInfo = parameter.LoginInfo;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friends_list: [],

		established: false,
		disconnected: true,

		login(loginInfo: LoginInfo) {
			console.log('Logging ...')
			return loginServer(loginInfo);
		},
		logout() {
			console.log('Logout ...')
			closeClient()
		},
	};
	const handleMsg = (msg: any) => {
		let msg_json = JSON.parse(msg) as Message;
		setChatInfo({
			...chatInfo,
			established: true,
			disconnected: false,
			friends_list: msg_json.data.data.aliveList.map((val):UserInfo => {
				return  {
					id: val,
					nickName: 'testUser',
				}
			})
		})
	}
	const handler = (event_type: 'establish' | 'close' | 'terminate' | 'receive' | 'reset', msg: any) => {
		console.log('handling',event_type)
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
	}, [setChatInfo]);

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
