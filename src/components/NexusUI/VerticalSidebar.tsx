import React, { useContext, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Settings } from "lucide-react";

import styles from "@/styles/NexusUI/VerticalSidebar.module.css";
import SettingArea from "@/components/NexusUI/SettingUI/SettingArea";

import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import LoginArea from "@/components/NexusUI/LoginUI/LoginArea";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import { toggleTheme } from "@/helpers/theme_helpers";
import { closeClient } from "@/helpers/chrome_heplers";

const MyDialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				"fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
				className
			)}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPortal>
))

export default function VerticalSidebar() {
	const [showLogin, setShowLogin] = useState(false);
	const [isSettingOpen, setIsSettingOpen] = useState(false);

	const chatInfo = useContext(ChatInfoContext);
	const isLoggedIn = !((chatInfo.disconnected)??true);

	return (
		<div className={styles.sidebar}>
			<Avatar className={styles.avatar} onClick={async () => {
				toggleTheme();
			}}>
				<AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
				<AvatarFallback style={{userSelect:'none'}}>U</AvatarFallback>
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
				<MyDialogContent className="p-0" style={{width: '80%', height: '75%'}} aria-describedby={undefined} >
					<SettingArea setSettingAreaOpen={setIsSettingOpen}/>
				</MyDialogContent>
			</Dialog>
		</div>
	);
}
