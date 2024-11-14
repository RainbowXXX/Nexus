import React from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

import styles from "@/styles/NexusUI/ChatArea.module.css";
import { response } from "@/services/type";

type UserInfo = response.UserInfo;

interface ChatAreaProps {
	selectedChat: UserInfo| undefined;
}

export default function ChatArea({ selectedChat }: ChatAreaProps) {
	return (
		<div className={styles.container}>
			{
				selectedChat && (
					<>
						<ChatHeader
							selectedChatName={selectedChat?.name ?? ""}
						/>
						<MessageList />
						<MessageInput
						chat_id={selectedChat?.id}
						/>
					</>)
			}
		</div>
	);
}
