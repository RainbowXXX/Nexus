import React, { createContext, ReactNode, useEffect, useState } from "react";

interface Setting {
	serverAddress: string,
	theme: 'light' | 'dark' | 'system',
}

const defaultSettings: Setting = {
	serverAddress: '',
	theme: "system"
}

export const SettingContext = createContext<[Setting, (_: Setting) => void]> ([defaultSettings, () => {}]);

export default function SettingProvider({ children }: { children: ReactNode }) {
	const [setting, setSetting] = useState<Setting>(defaultSettings);

	useEffect(() => {
		let lastSetting: Setting;
		let lastSettingStr = localStorage.getItem('setting');
		lastSetting = lastSettingStr? (JSON.parse(lastSettingStr) as Setting): defaultSettings;
		console.log('Setting read:', lastSetting);
		setSetting(lastSetting);
	}, [])

	const updateSetting = (setting: Setting) => {
		setSetting(setting);
		console.log('Setting update:', setting);
		localStorage.setItem('setting', JSON.stringify(setting));
	}

	return (
		<SettingContext.Provider value={[setting, updateSetting]}>
			{children}
		</SettingContext.Provider>
	);
}
