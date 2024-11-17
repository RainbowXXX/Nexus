import React, { useContext } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import styles from "@/styles/NexusUI/MessageList.module.css";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import { response } from "@/services/type";

type UserInfo = response.UserInfo;

export default function MessageList({cur_friend}: {cur_friend: UserInfo| undefined}) {
	const chatInfo = useContext(ChatInfoContext);
	const curMessageList = chatInfo.message_list.filter((val) => ((val.receiver.id === cur_friend?.id) || (val.sender.id === cur_friend?.id)));
	const messages = curMessageList.map((message, id) => {
		let time = new Date(message.content.timestamp);
		return {
			id: id,
			sender: message.sender,
			content: message.content.message,
			time: `${time.getFullYear()}/${time.getMonth()}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`,
		}
	})
	// const messages = [
	// 	{ id: 1, sender: "test", content: "test msg", time: "2024/2/28 11:47:50" },
	// 	{ id: 2, sender: "test", content: "test", time: "2024/2/28 11:48:25" },
	// 	{ id: 3, sender: "user", content: "test msg", time: "2024/2/28 12:11:02" },
	// 	{ id: 4, sender: "test", content: "ok", time: "19:00:30" },
	// 	{ id: 5, sender: "user", content: "test msg", time: "19:24:55" },
	// ];

	return (
		<div className={styles.container}>
			<ScrollArea className={styles.scrollArea} style={{position:'absolute'}}>
				{messages.map((message) => (
					<div key={message.id}
						 className={`${styles.messageWrapper} ${message.sender.id !== cur_friend?.id ? styles.userMessage : ''}`}>
						<div
							className={`${styles.messageContent} ${message.sender.id !== cur_friend?.id ? styles.userMessageContent : styles.otherMessageContent}`}>
							{message.content}
						</div>
						<div className={styles.messageTime}>{message.time}</div>
					</div>
				))}
			</ScrollArea>
		</div>
	);
}
