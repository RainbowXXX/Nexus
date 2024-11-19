import React, { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatInfoContext } from "@/components/Contexts/ChatInfoContext";
import styles from "@/styles/NexusUI/Login.module.css";
import { parameter } from "@/services/type";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";
import { storage } from "@/helpers/store_helpers";

type LoginInfo = parameter.LoginParameter;

export default function LoginArea({ loginCallback }: { loginCallback: (_: boolean) => void }) {
	const chatInfo = useContext(ChatInfoContext);

	const [rememberPasswd, setRememberPasswd] = useState(false)

	const unameRef = useRef<HTMLInputElement>(null);
	const passwdRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		storage.get("rememberPasswd").then((val) => {
			let lastRememberPasswd = val === 'true'
			setRememberPasswd(lastRememberPasswd);
			if(lastRememberPasswd) {
				storage.get("lastUname").then((lastUname) => {
					if(unameRef.current !== null) {
						unameRef.current.value = lastUname ?? '';
					}
				});
				storage.get("lastPassword").then((lastPasswd) => {
					if(passwdRef.current !== null) {
						passwdRef.current.value = lastPasswd ?? '';
					}
				});
			}
		})
	}, []);

	const handleLogin = async () => {
		let loginInfo: LoginInfo = {
			account: unameRef.current?.value ?? '',
			password: passwdRef.current?.value ?? '',
			application: 'Nexus',
		}
		let loginRes = await chatInfo.login(loginInfo);
		loginCallback(loginRes)
		if(loginRes) {
			await storage.set('rememberPasswd', rememberPasswd ? 'true' : 'false');
			if(rememberPasswd) {
				let uname = unameRef.current?.value ?? '';
				let passwd = passwdRef.current?.value ?? '';
				await storage.set('lastUname', uname);
				await storage.set('lastPassword', passwd);
			}
			await storage.flush();
		}
		else {
			await storage.set('rememberPasswd', 'false');
			await storage.remove('lastUname');
			await storage.remove('lastPassword');
			await storage.flush();
		}
	}
	return (
		<Card className={styles.card}>
			<div className={styles.grid}>
				<div className={styles.innerDiv}>
					<div className={styles.formContainer}>
						<div className={styles.header}>
							<h1 className={styles.title}>登录</h1>
						</div>
						<div className={styles.form}>
							<div className={styles.inputGroup}>
								<Label htmlFor="username">用户名</Label>
								<Input id="username" placeholder="请输入用户名..." type="text" ref={unameRef} />
							</div>
							<div className={styles.inputGroup}>
								<Label htmlFor="password">密码</Label>
								<Input id="password" placeholder="请输入密码..." type="password" ref={passwdRef} />
							</div>
							<div className={styles.rememberSection}>
								<div className={styles.checkboxGroup}>
									<Checkbox
										id="remember"
										checked={rememberPasswd}
										onCheckedChange={(checked) => setRememberPasswd(checked === true)}
									/>
									<label htmlFor="remember" className={styles.checkboxLabel}>
										记住密码
									</label>
								</div>
								<Link className={styles.forgotPassword} href="#">
									忘记密码?
								</Link>
							</div>
							<Button onClick={handleLogin}>登录</Button>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
