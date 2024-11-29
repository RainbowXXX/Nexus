import React, { ReactNode, useContext, useEffect, useState } from "react";
import { SettingContext } from "@/components/Contexts/SettingsContext";
import { closeClient, createClient, loginServer, sendMessage } from "@/helpers/chrome_heplers";
import { ChatInfo, ChatInfoContext, MessageInfo } from "../ChatInfoContext";

type ClientEventType = event.ClientEventType;
type LoginParameter = parameter.LoginParameter;
type MessageParameter = parameter.MessageParameter;

export default function ChatInfoProvider({ children }: { children: ReactNode }) {
	const initialState:ChatInfo = {
		friendsList: [],
		aliveUserIdList: [],
		curUserInfo: null,
		messageHistory: new Map(),
		checkWaitingMessageMap: new Map(),

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

	const [chatInfo, setChatInfo] = useState(initialState);

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
				if(update_data['messageHistory']) {
					let origin_data = update_data['messageHistory'] as [number, MessageInfo[]][]
					update_data['messageHistory'] = new Map(origin_data);
				}
				if(update_data['checkWaitingMessageMap']) {
					let origin_data = update_data['checkWaitingMessageMap'] as [number, [string, MessageInfo][]][]
					update_data['checkWaitingMessageMap'] = new Map(origin_data.map(([key, value]) => [key, new Map(value)]));
				}
				console.log("update_data: ", update_data);
				setChatInfo({
					...chatInfo,
					...update_data,
				});
				break;
			}
			default:
				break;
		}
	}

	const settings = useContext(SettingContext);

	useEffect(() => {
		return window.chromeTools.ipc.on('client', (l, r) => { handler(l, new Result<any>(r)) });
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
