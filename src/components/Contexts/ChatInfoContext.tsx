import { createContext } from "react";
import type { parameter } from "@/services/type";

type LoginInfo = parameter.LoginInfo;

export interface FriendInfo {
	id: number,
	name?: string,
}
 export interface ChatInfo {
	friend_list: FriendInfo[],

	established: boolean;
	disconnected: boolean;

	login(loginInfo: LoginInfo): void;
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
	friend_list: [],
	established: false,
	disconnected: false,
	login(_: LoginInfo){},
	logout() {},
});
