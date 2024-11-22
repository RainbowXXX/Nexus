import React, { useContext, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Settings } from "lucide-react";

import styles from "@/styles/NexusUI/VerticalSidebar.module.css";
import SettingArea from "@/components/NexusUI/SettingUI/SettingArea";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import LoginArea from "@/components/NexusUI/LoginUI/LoginArea";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import { toggleTheme } from "@/helpers/theme_helpers";
import { closeClient, openDevTools } from "@/helpers/chrome_heplers";
import { DialogContentWithoutClose } from "@/components/NexusUI/components/DialogContentWithoutClose";

export default function VerticalSidebar() {
	const [showLogin, setShowLogin] = useState(false);
	const [isSettingOpen, setIsSettingOpen] = useState(false);

	const chatInfo = useContext(ChatInfoContext);
	const isLoggedIn = chatInfo.connected;

	return (
		<div className={styles.sidebar}>
			<Avatar
				className={styles.avatar}
				onClick={async () => {
					toggleTheme();

					// chatInfo.send({
					// 	messagetype: 'text',
					// 	message: 'test',
					// 	timestamp: Date.now(),
					// }, 1)

					// createNewKeyPair();
				}}
				onContextMenu={async () => {
					openDevTools();
				}}
			>
				<AvatarImage src={ chatInfo.curUserInfo?.avatar ?? "/placeholder.svg?height=40&width=40" } alt="User" />
				<AvatarFallback style={{userSelect:'none'}}> { chatInfo.curUserInfo?.name[0] ?? 'U' } </AvatarFallback>
			</Avatar>
			<div className={styles.spacer}></div>

			{isLoggedIn ? (
				<Button variant="ghost" size="icon" className={styles.settingsButton} onClick={() => closeClient()}>
					<LogOut className={styles.settingsIcon} />
				</Button>
			) : (
				<Button variant="ghost" size="icon" className={styles.settingsButton} onClick={() => setShowLogin(true) } aria-label="Login">
					<LogIn className={styles.settingsIcon} />
				</Button>
			)}

			<Dialog open={showLogin && !isLoggedIn} onOpenChange={setShowLogin} >
				<DialogTitle/>
				<DialogContent className="p-0" style={{width: '80%', height: '75%'}} aria-describedby={undefined} >
					<LoginArea
						loginCallback={(isOk) => {
							setShowLogin(!isOk)
						}}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={isSettingOpen} onOpenChange={setIsSettingOpen} >
				<DialogTitle/>
				<DialogTrigger asChild>
					<Button variant="ghost" size="icon" className={styles.settingsButton} aria-label="Settings">
						<Settings className={styles.settingsIcon} />
					</Button>
				</DialogTrigger>
				<DialogContentWithoutClose className="p-0" style={{width: '80%', height: '75%'}} aria-describedby={undefined} >
					<SettingArea setSettingAreaOpen={setIsSettingOpen}/>
				</DialogContentWithoutClose>
			</Dialog>
		</div>
	);
}
