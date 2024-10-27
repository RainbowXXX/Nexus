import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import type { parameter } from "@/services/type";

import styles from "@/styles/NexusUI/Login.module.css";

type LoginInfo = parameter.LoginInfo;

export default function LoginArea() {
	const chatInfo = useContext(ChatInfoContext);

	const [uname, setUname] = useState('');
	const [passwd, setPasswd] = useState('');


	const handleLogin = async () => {
		let loginInfo: LoginInfo = {
			account: uname,
			password: passwd,
			application: 'Nexus',
		}
		chatInfo.login(loginInfo);
	}

	return (
		<Card className="w-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg">
			<CardHeader>
				<CardTitle className="text-center text-white">登录</CardTitle>
			</CardHeader>
			<CardContent className={styles.CardContent}>
				<div className="space-y-2">
					<Input
						type="text"
						placeholder="账号"
						className="bg-white bg-opacity-20 text-white placeholder-gray-200"
						onChange={(e) => setUname(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Input
						type="password"
						placeholder="密码"
						className="bg-white bg-opacity-20 text-white placeholder-gray-200"
						onChange={(e) => setPasswd(e.target.value)}
					/>
				</div>
				<Button className="w-full bg-green-700 text-white hover:bg-green-800" onClick={() => {handleLogin()}}>
					登录
				</Button>
			</CardContent>
		</Card>
	)
}
