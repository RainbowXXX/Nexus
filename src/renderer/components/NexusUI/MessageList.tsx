import React, { useContext } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import styles from "@/styles/NexusUI/MessageList.module.css";
import { ChatInfoContext, MessageInfo } from "@/components/Contexts/ChatInfoContext";

type UserInfo = response.UserInfo;

export default function MessageList({cur_friend}: {cur_friend: UserInfo| undefined}) {
	type MessageItemInfo = {
		id: number;
		sender: number;
		content: string;
		time: string;
	};

	const chatInfo = useContext(ChatInfoContext);
	let messages: MessageItemInfo[];
	console.log(`message_list: `, chatInfo.messageHistory)
	if(cur_friend?.id != undefined) {
		const curMessageList = chatInfo.messageHistory.get(cur_friend?.id) ?? [];
		messages = curMessageList.map((message, id) => {
			let time = new Date(message.content.timestamp);
			return {
				id: id,
				sender: message.sender,
				content: message.content.message,
				time: `${time.getFullYear()}/${time.getMonth()}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`,
			}
		})
	}
	else {
		messages = [];
	}

	return (
		<div className={styles.container}>
			<ScrollArea className={styles.scrollArea} style={{position:'absolute'}}>
				{messages.map((message) => (
					<div key={message.id}
						 className={`${styles.messageWrapper} ${message.sender !== cur_friend?.id ? styles.userMessage : ''}`}>
						<div
							className={`${styles.messageContent} ${message.sender !== cur_friend?.id ? styles.userMessageContent : styles.otherMessageContent}`}>
							{message.content}
						</div>
						<div className={styles.messageTime}>{message.time}</div>
					</div>
				))}
			</ScrollArea>
		</div>
	);
}
