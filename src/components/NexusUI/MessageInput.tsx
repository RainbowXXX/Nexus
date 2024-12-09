import React, { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Send, Smile } from "lucide-react";

import styles from "@/styles/NexusUI/MessageInput.module.css";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MessageInput({chat_id} : { chat_id: number| undefined }) {
	const chatInfo = useContext(ChatInfoContext);
	const inputRef = useRef<HTMLInputElement>(null);
	const [showTooltip, setShowTooltip] = useState(false)

	useEffect(() => {
		let timer: NodeJS.Timeout
		if (showTooltip) {
			timer = setTimeout(() => {
				setShowTooltip(false)
			}, 3000) // Hide tooltip after 3 seconds
		}
		return () => clearTimeout(timer)
	}, [showTooltip])

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

			<TooltipProvider>
				<Tooltip open={showTooltip}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Send message"
							onClick={() => {
								let message = inputRef.current?.value?? ''
								console.log('send', chat_id)
								// TODO(dev) 这里注意类型
								if(message.trim()) {
									setShowTooltip(false)
								}
								else {
									setShowTooltip(true)
									return
								}

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
					</TooltipTrigger>
					<TooltipContent>
						<p>消息不能为空</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
