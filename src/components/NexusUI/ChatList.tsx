import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

import styles from "@/styles/NexusUI/ChatList.module.css";
import { response } from "@/services/type";

type UserInfo = response.UserInfo;

interface ChatInfo extends UserInfo{
	avatar: string;
	lastMessage: string;
	time: string;
	unread: number;
}

interface ChatListProps {
	chatList: ChatInfo[];
	selectedChat: UserInfo | undefined
	setSelectedChat: (chat: UserInfo) => void
}

export default function ChatList({ chatList, selectedChat, setSelectedChat }: ChatListProps) {
	console.log(chatList)

	return (
		<div className={styles.container}>
			<div className={styles.searchContainer}>
				<Input placeholder="搜索" className={styles.searchInput} />
				<Button variant="ghost" size="icon" aria-label="Add new chat">
					<Plus className={styles.addIcon} />
				</Button>
			</div>
			<ScrollArea className={styles.chatList}>
				{chatList.map((chat, id) => (
					<div
						key={id}
						className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.selectedChat : ''}`}
						onClick={() => setSelectedChat(chat)}
					>
						<Avatar className={styles.avatar}>
							<AvatarImage src={chat.avatar} alt={chat.name} />
							<AvatarFallback>{chat.name[0]}</AvatarFallback>
						</Avatar>
						<div className={styles.chatInfo}>
							<div className={styles.chatHeader}>
								<span className={styles.chatName}>{chat.name}</span>
							</div>
							<p className={styles.lastMessage}>{chat.lastMessage}</p>
						</div>
						<div className={styles.chatMeta}>
							<span className={styles.chatTime}>{chat.time}</span>
							{chat.unread > 0 && (
								<div className={styles.unreadBadge}>
									{chat.unread}
								</div>
							)}
						</div>
					</div>
				))}
			</ScrollArea>
		</div>
	);
}
