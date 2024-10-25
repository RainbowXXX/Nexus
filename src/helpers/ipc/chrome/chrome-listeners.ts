import { ipcMain, BrowserWindow, Notification } from "electron";
import { CHROME_OPEN_DEVTOOLS_CHANNEL, CHROME_TEST_TOOLS_CHANNEL } from "./chrome-channels";

export function addChromeEventListeners(mainWindow: BrowserWindow) {
	ipcMain.handle(CHROME_OPEN_DEVTOOLS_CHANNEL, () => mainWindow.webContents.openDevTools());
	ipcMain.handle(CHROME_TEST_TOOLS_CHANNEL, (event, ...args: string[]) => {
		if(args[0] === 'notify') {
			if(! Notification.isSupported()) {
				console.error(`Notification module is not supported.`);
				return;
			}
			new Notification({
				title: 'test title',
				subtitle: `test subtitle`, // macOS
				body: `test body`
			}).show();
		}
	})
}
