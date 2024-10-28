import React, { useContext, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingContext } from "@/components/Contexts/SettingsContext";

import styles from "@/styles/NexusUI/Setting.module.css";

export default function SettingArea({setSettingAreaOpen}: { setSettingAreaOpen: (_: boolean) => void }) {
	const settings = useContext(SettingContext);
	const [serverUrl, setServerUrl] = useState(settings[0].serverAddress);
	const [settingItem, setSettingItem] = useState<string|null>('通用');
	return (
		<div className={styles.container}>
			{/* Sidebar */}
			<div className={styles.sidebar}>
				<Button
					variant="ghost"
					className={`justify-start mb-4 ${styles.backButtonHover}`}
					onClick={() => {
						setSettingAreaOpen(false);
						console.log('放弃修改设置项');
					}}
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					返回
				</Button>
				<Button
					variant="ghost"
					className={`justify-start ${styles.navButtonHover} ${settingItem === '通用' ? styles.active : ''}`}
					onClick={() => setSettingItem('通用')}
				>
					通用
				</Button>
				<Button
					variant="ghost"
					className={`justify-start ${styles.navButtonHover} ${settingItem === '外观' ? styles.active : ''}`}
					onClick={() => setSettingItem('外观')}
				>
					外观
				</Button>
			</div>

			{/* Main content */}
			<div className={styles.mainContent}>
				<h1 className={styles.title}>{settingItem ?? '设置'}</h1>
				{settingItem === '通用' && (
					<div className={styles.serverIp}>
						<span className={styles.serverIpLabel}>服务器地址: </span>
						<Input
							placeholder='服务器地址'
							style={{ flex: 1 }}
							value={serverUrl ?? ''}
							onChange={(e) => setServerUrl(e.target.value)}
						/>
					</div>
				)}
			</div>

			<div className={styles.confirmButton}>
				<Button
					onClick={() => {
						console.log("修改设置中...");
						let newVal = serverUrl;
						const [oldVal, setter] = settings;
						if (newVal !== oldVal.serverAddress) {
							setter({
								...oldVal,
								serverAddress: newVal,
							});
						}
						setSettingAreaOpen(false);
						console.log("修改设置完成");
					}}
				>
					确定
				</Button>
			</div>
		</div>
	)
}
