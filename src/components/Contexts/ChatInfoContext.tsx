import { createContext } from "react";
import { parameter, response } from "@/services/type";

type UserInfo = response.UserInfo;
type LoginInfo = parameter.LoginInfo;

export interface ChatInfo {
	friends_list: UserInfo[],
	alive_user_ids: number[];
	cur_user_info: UserInfo| null,

	connected: boolean;

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
	cur_user_info: null,
	alive_user_ids: [],
	connected: false,
	login(_: LoginInfo){ return Promise.resolve(false); },
	logout() {},
});
