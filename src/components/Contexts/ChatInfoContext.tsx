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
	friendsList: UserInfo[],
	aliveUserIds: number[];
	messageList: Map<number, MessageInfo[]>,
	curUserInfo: UserInfo| null,
	checkWaitingMessageList: Map<number, Map<string, MessageInfo>>,

	connected: boolean;

	send(message: MessageParameter, to: number): Promise<void>;
	login(loginInfo: LoginInfo): Promise<boolean>;
	logout(): void;
}

export const ChatInfoContext = createContext<ChatInfo>({
	friendsList: [],
	curUserInfo: null,
	aliveUserIds: [],
	messageList: new Map(),
	checkWaitingMessageList: new Map(),
	connected: false,
	send(_message: MessageParameter, _to: number) { return Promise.resolve(); },
	login(_: LoginInfo){ return Promise.resolve(false); },
	logout() {},
});
