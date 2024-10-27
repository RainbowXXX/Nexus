import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import type { parameter } from "@/services/type";

type LoginInfo = parameter.LoginInfo;

export default function LoginArea({ loginCallback }: { loginCallback: (_: boolean) => void }) {
	const chatInfo = useContext(ChatInfoContext);

	const [uname, setUname] = useState('');
	const [passwd, setPasswd] = useState('');

	const handleLogin = async () => {
		let loginInfo: LoginInfo = {
			account: uname,
			password: passwd,
			application: 'Nexus',
		}
		let loginRes = await chatInfo.login(loginInfo);
		loginCallback(loginRes)
	}

	return (
		<Card className="w-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg">
			<CardHeader>
				<CardTitle className="text-center text-white">LOGIN</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<Input
						type="text"
						placeholder="Username"
						className="bg-white bg-opacity-20 text-white placeholder-gray-200"
						onChange={(e) => setUname(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Input
						type="password"
						placeholder="Password"
						className="bg-white bg-opacity-20 text-white placeholder-gray-200"
						onChange={(e) => setPasswd(e.target.value)}
					/>
				</div>
				<Button className="w-full bg-green-700 text-white hover:bg-green-800" onClick={() => {handleLogin()}}>
					Sign In
				</Button>
			</CardContent>
		</Card>
	)
}
