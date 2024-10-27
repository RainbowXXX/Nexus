import React, { useContext, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingContext } from "@/components/Contexts/SettingsContext";

import styles from "@/styles/NexusUI/Setting.module.css";

export default function SettingArea() {
	const settings = useContext(SettingContext);
	const [serverUrl, setServerUrl] = useState(settings[0].serverAddress);
	const [settingItem, setSettingItem] = useState<string|null>('通用');
	return (
		<div className="flex text-gray-300 bg-gray-900">
			{/* Sidebar */}
			<div className="w-48 bg-gray-800 p-4 flex flex-col gap-2">
				<Button variant="ghost" className="justify-start mb-4">
					<ChevronLeft className="mr-2 h-4 w-4" />
					返回
				</Button>
				<Button variant="ghost" className={`justify-start ${styles.navBottonHover} ${settingItem === '通用' ? styles.active : ''}`} onClick={() => setSettingItem('通用')}>通用</Button>
				<Button variant="ghost" className={`justify-start ${styles.navBottonHover} ${settingItem === '外观' ? styles.active : ''}`}
						onClick={() => setSettingItem('外观')}>外观</Button>
			</div>

			{/* Main content */}
			<div className="flex-1 p-6">
				<h1 className="text-3xl mb-6">{settingItem ?? '设置'}</h1>
				{settingItem === '通用' &&
					<>
						<div className='server-ip' style={{ display: "flex", alignItems: "center" }}>
							<span style={{ marginRight: '10px' }}>服务器地址: </span>
							<Input placeholder='服务器地址' style={{ flex: 1 }} value={serverUrl ?? ''}
								   onChange={(e) => {
									   setServerUrl(e.target.value)
								   }} onBlur={(event) => {
								let newVal = event.target.value
								const [oldVal, setter] = settings;
								if (newVal !== oldVal.serverAddress) {
									setter({
										...oldVal,
										serverAddress: newVal,
									})
								}
							}} />
						</div>
					</>
				}
			</div>

			<div className="fixed bottom-4 right-4 z-50">
				<Button
					className="px-6 py-3 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
					onClick={() => {
						console.log("确定按钮被点击")
					}}
				>
					确定
				</Button>
			</div>
		</div>
	)
}
