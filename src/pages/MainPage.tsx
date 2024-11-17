import React, { useContext, useEffect, useState } from "react";
import VerticalSidebar from "../components/NexusUI/VerticalSidebar";
import ChatList from "../components/NexusUI/ChatList";
import ChatArea from "../components/NexusUI/ChatArea";

import styles from "@/styles/NexusUI/MainPage.module.css";
import { response } from "@/services/type";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";

type UserInfo = response.UserInfo;

export default function MainPage() {
	const chatInfos = useContext(ChatInfoContext);
	const chats = chatInfos.friends_list.map((value) => {
		return {
			id: value.id,
			name: value.name,
			avatar: value.avatar??'/placeholder.svg?height=40&width=40',

			// TODO(dev) 根据情况动态修改以下值
			lastMessage: 'test',
			time: '19:25',
			unread: 0,
		}
	})
	const [selectedChat, setSelectedChat] = useState<UserInfo|undefined>(undefined);

	useEffect(() => {
		if(selectedChat) {
			let res = chatInfos.friends_list.find((value) => value.id === selectedChat?.id)
			setSelectedChat(res);
		}
	}, [chatInfos]);

	return (
		<div
			className={styles.container}
		>
			<VerticalSidebar />
			<ChatList
				chatList={chats}
				selectedChat={selectedChat}
				setSelectedChat={setSelectedChat}
			/>
			<ChatArea
				selectedChat={selectedChat}
			/>
		</div>
	);
}
