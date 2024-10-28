import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import styles from "@/styles/NexusUI/Login.module.css";
import type { parameter } from "@/services/type";

type LoginInfo = parameter.LoginInfo;

export default function LoginArea({ loginCallback }: { loginCallback: (_: boolean) => void }) {
	const chatInfo = useContext(ChatInfoContext);

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleLogin = async () => {
		let loginInfo: LoginInfo = {
			account: username,
			password: password,
			application: 'Nexus',
		}
		let loginRes = await chatInfo.login(loginInfo);
		loginCallback(loginRes)
	}

	return (
		<Card className={styles.card}>
			<CardHeader>
				<CardTitle className={styles.title}>登录</CardTitle>
			</CardHeader>
			<CardContent className={styles.cardContent}>
				<div>
					<Input
						type="text"
						placeholder="账号"
						className={styles.input}
						onChange={(e) => setUsername(e.target.value)}
						aria-label="账号"
					/>
				</div>
				<div>
					<Input
						type="password"
						placeholder="密码"
						className={styles.input}
						onChange={(e) => setPassword(e.target.value)}
						aria-label="密码"
					/>
				</div>
				<Button className={styles.button} onClick={handleLogin}>
					登录
				</Button>
			</CardContent>
		</Card>
	)
}
