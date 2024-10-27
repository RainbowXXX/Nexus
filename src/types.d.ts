// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
// plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
// whether you're running in development or production).

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Preload types
interface IpcType {
	send(channel: any, value: any): void;
	on(channel: any, callback: (...args: any[]) => void): () => void;
}
interface StoreObject {
	set(key: string, value: string): Promise<void>;
	get(key: string): Promise<string | null>;
	remove(key: string): Promise<void>;
}
interface WindowStatus {
	size: {
		width: number;
		height: number;
	},
	position: {
		x: number,
		y: number,
	},
	status: {
		isMaximized: boolean,
		isMinimized: boolean,
		isFullScreen: boolean,

		isResizable: boolean,
		isVisible: boolean,
	},
	title: string,
	opacity: number,
}

interface ThemeModeContext {
    toggle: () => Promise<boolean>;
    dark: () => Promise<void>;
    light: () => Promise<void>;
    system: () => Promise<boolean>;
    current: () => Promise<"dark" | "light" | "system">;
}
interface ElectronWindow {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
}
interface ChromeTools {
	ipc: IpcType;
	open_dev_tools: () => Promise<void>;
	test_for_feature: (...args: string[]) => Promise<any>;
	fetch_data: (...args: string[]) => Promise<any>;
	wss: (...args: string[]) => Promise<any>;
}
interface StoreExtension {
	store: StoreObject,
}

declare interface Window {
	chromeTools: ChromeTools;
	storeExtensions: StoreExtension;
	themeMode: ThemeModeContext;
    electronWindow: ElectronWindow;
}
