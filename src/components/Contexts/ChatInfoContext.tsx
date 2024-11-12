import { createContext } from "react";
import { parameter, response } from "@/services/type";

type UserInfo = response.UserInfo;
type LoginInfo = parameter.LoginInfo;
type MessageParameter = parameter.MessageParameter;

export interface ChatInfo {
	friends_list: UserInfo[],
	alive_user_ids: number[];
	cur_user_info: UserInfo| null,

	connected: boolean;

	send(message: MessageParameter, to: number): Promise<void>;
	login(loginInfo: LoginInfo): Promise<boolean>;
	logout(): void;
}

export const ChatInfoContext = createContext<ChatInfo>({
	friends_list: [],
	cur_user_info: null,
	alive_user_ids: [],
	connected: false,
	send(message: MessageParameter, to: number) { return Promise.resolve(); },
	login(_: LoginInfo){ return Promise.resolve(false); },
	logout() {},
});
