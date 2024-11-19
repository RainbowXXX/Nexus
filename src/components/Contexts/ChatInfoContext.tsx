import { createContext } from "react";
import { parameter, response } from "@/services/type";

type UserInfo = response.UserInfo;
type LoginInfo = parameter.LoginParameter;
type MessageParameter = parameter.MessageParameter;

export interface MessageInfo {
	sender: number,
	content: MessageParameter
}

export interface ChatInfo {
	friends_list: UserInfo[],
	alive_user_ids: number[];
	message_list: Map<number, MessageInfo[]>,
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
	message_list: new Map(),
	connected: false,
	send(_message: MessageParameter, _to: number) { return Promise.resolve(); },
	login(_: LoginInfo){ return Promise.resolve(false); },
	logout() {},
});
