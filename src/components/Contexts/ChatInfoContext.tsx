import { createContext } from "react";
import type { parameter } from "@/services/type";

type LoginInfo = parameter.LoginInfo;

export interface UserInfo {
	id: number,
	nickName: string,
	avatar?: any,
}
export interface ChatInfo {
	friends_list: UserInfo[],

	established: boolean;
	disconnected: boolean;

	login(loginInfo: LoginInfo): Promise<boolean>;
	logout(): void;
}
export interface Message {
	"status": number,
	"message": "success",
	"application": "Nexus",
	"type": "sys",
	"timestamp": number,
	"data": {
		"type": "AliveUser",
		"data": {
			"total": number,
			"aliveList": number[],
		}
	}
}

export const ChatInfoContext = createContext<ChatInfo>({
	friends_list: [],
	established: false,
	disconnected: false,
	login(_: LoginInfo){ return Promise.resolve(false); },
	logout() {},
});
