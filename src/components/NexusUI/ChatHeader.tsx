import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import styles from "@/styles/NexusUI/ChatHeader.module.css";

interface ChatHeaderProps {
	selectedChatName: string;
}

export default function ChatHeader({ selectedChatName }: ChatHeaderProps) {
	return (
		<div className={styles.container}>
			<Avatar className={styles.avatar}>
				<AvatarImage src="/placeholder.svg?height=40&width=40" alt={selectedChatName} />
				<AvatarFallback>{selectedChatName[0]}</AvatarFallback>
			</Avatar>
			<span className={styles.chatName}>{selectedChatName}</span>
		</div>
	);
}
