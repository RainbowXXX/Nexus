import { createContext } from "react";

export interface Setting {
	serverAddress: string,
	theme: 'light' | 'dark' | 'system',
}

export const defaultSettings: Setting = {
	serverAddress: '',
	theme: "system"
}

export const SettingContext = createContext<[Setting, (_: Setting) => void]> ([defaultSettings, () => {}]);
