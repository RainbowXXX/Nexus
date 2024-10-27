import React, { ReactNode, useEffect, useState } from "react";
import { storage } from "@/helpers/store_helpers";
import { defaultSettings, Setting, SettingContext } from "../SettingsContext";

export default function SettingProvider({ children }: { children: ReactNode }) {
	const [setting, setSetting] = useState<Setting>(defaultSettings);

	useEffect(() => {
		let lastSetting: Setting;
		storage.get('setting').then((lastSettingStr) => {
			lastSetting = lastSettingStr? (JSON.parse(lastSettingStr) as Setting): defaultSettings;
			console.log('Setting read:', lastSetting);
			setSetting(lastSetting);
		});
	}, [])

	const updateSetting = (setting: Setting) => {
		setSetting(setting);
		console.log('Setting update:', setting);
		storage.set('setting', JSON.stringify(setting));
	}

	return (
		<SettingContext.Provider value={[setting, updateSetting]}>
			{children}
		</SettingContext.Provider>
	);
}
