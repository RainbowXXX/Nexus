import React, { useContext, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Send, Smile } from "lucide-react";

import styles from "@/styles/NexusUI/MessageInput.module.css";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";

export default function MessageInput({chat_id} : { chat_id: number| undefined }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const chatInfo = useContext(ChatInfoContext);
	return (
		<div className={styles.container}>
			<Button variant="ghost" size="icon" aria-label="Insert emoji">
				<Smile className={styles.icon} />
			</Button>
			<Button variant="ghost" size="icon" aria-label="Attach file">
				<Paperclip className={styles.icon} />
			</Button>
			<Input
				ref={inputRef}
				className={styles.input}
				placeholder="输入消息..."
			/>
			<Button variant="ghost" size="icon" aria-label="Record voice message">
				<Mic className={styles.icon} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Send message"
				onClick={() => {
					let message = inputRef.current?.value?? ''
					console.log('send', chat_id)
					// TODO(dev) 这里注意类型
					if(chat_id !== undefined) {
						chatInfo.send({
							messagetype: 'text',
							message: message,
							timestamp: Date.now()
						}, chat_id)
						if(inputRef.current) {
							inputRef.current.value = ''
						}
					}
				}}
			>
				<Send className={styles.icon} />
			</Button>
		</div>
	);
}
