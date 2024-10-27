import React, { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

import styles from "@/styles/NexusUI/ChatList.module.css";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";

interface ChatListProps {
	selectedChat: string
	setSelectedChat: (chat: string) => void
}

export default function ChatList({ selectedChat, setSelectedChat }: ChatListProps) {
	const chatInfos = useContext(ChatInfoContext);

	const chats = chatInfos.friends_list.map((value) => {
		return {
			id: value.id,
			name: value.nickName,
			avatar: value.avatar??'/placeholder.svg?height=40&width=40',
			lastMessage: 'test',
			time: '19:25',
			unread: 0,
		}
	})

/*	const chats = [
		{ id: 1, name: 'test', avatar: '/placeholder.svg?height=40&width=40', lastMessage: 'test', time: '19:25', unread: 7 },
		{ id: 2, name: 'test1', avatar: '/placeholder.svg?height=40&width=40', lastMessage: 'test', time: '19:01', unread: 0 },
		{ id: 3, name: 'test2', avatar: '/placeholder.svg?height=40&width=40', lastMessage: 'test', time: '18:54', unread: 0 },
	]*/

	return (
		<div className={styles.container}>
			<div className={styles.searchContainer}>
				<Input placeholder="搜索" className={styles.searchInput} />
				<Button variant="ghost" size="icon" aria-label="Add new chat">
					<Plus className={styles.addIcon} />
				</Button>
			</div>
			<ScrollArea className={styles.chatList}>
				{chats.map((chat) => (
					<div
						key={chat.id}
						className={`${styles.chatItem} ${selectedChat === chat.name ? styles.selectedChat : ''}`}
						onClick={() => setSelectedChat(chat.name)}
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
