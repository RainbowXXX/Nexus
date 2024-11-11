import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer } from "@/helpers/chrome_heplers";
import { client, parameter, response } from "@/services/type";
import { ChatInfo, ChatInfoContext } from "../ChatInfoContext";

type UserInfo = response.UserInfo;
type LoginInfo = parameter.LoginInfo;
type ClientEventData = client.ClientEventData;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friends_list: [],
		alive_user_ids: [],
		cur_user_info: null,

		connected: false,

		login(loginInfo: LoginInfo) {
			console.log('Logging ...')
			return loginServer(loginInfo);
		},
		logout() {
			console.log('Logout ...')
			closeClient()
		},
	};
	const handler = (event_type: 'login' | 'close' | 'update', data: ClientEventData) => {
		console.log('handling',event_type)
		switch (event_type) {
			case "login":
				if(data.hasValue()) {
					let curUserData = data.getData();
					setChatInfo({
						...chatInfo,
						connected: true,
						cur_user_info: curUserData.curUserInfo,
						friends_list: [curUserData.curUserInfo]
					})
				}
				// 否则通知登录不成功
				break;
			case "close":
				// TODO(dev) 添加意外中断的处理
				setChatInfo(initialState);
				break;
			case "update":
				let update_data = data.getData();
				console.debug({
					...chatInfo,
					...update_data,
				})
				setChatInfo({
					...chatInfo,
					...update_data,
				})
				break;
			default:
				break;
		}
	}

	const [chatInfo, setChatInfo] = useState(initialState);

	const settings = useContext(SettingContext);

	useEffect(() => {
		return window.chromeTools.ipc.on('client', (l, r) => handler(l, new client.ClientEventData<any>(JSON.parse(r))));
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
