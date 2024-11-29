import { ipcRenderer } from "electron";
import {
	CHROME_FETCH_DATA_CHANNEL,
	CHROME_OPEN_DEVTOOLS_CHANNEL,
	CHROME_TEST_TOOLS_CHANNEL,
	CHROME_WSS_CHANNEL,
} from "./chrome-channels";

const ipcHandler: IpcType = {
	send(channel: any, value: any) {
	  ipcRenderer.send(channel, value)
	},
	on(channel: any, callback: (...args: any[]) => void) {
	  const subscription = (_event: any, ...args: any[]) => callback(...args)
	  ipcRenderer.on(channel, subscription)

	  return () => {
		ipcRenderer.removeListener(channel, subscription)
	  }
	},
}

export function exposeChromeContext() {
    const { contextBridge, ipcRenderer } = window.require("electron");
    contextBridge.exposeInMainWorld("chromeTools", {
		ipc: ipcHandler,
        open_dev_tools: () => ipcRenderer.invoke(CHROME_OPEN_DEVTOOLS_CHANNEL),
		test_for_feature: (...args: string[]) => ipcRenderer.invoke(CHROME_TEST_TOOLS_CHANNEL, ...args),
		fetch_data: (...args: string[]) => ipcRenderer.invoke(CHROME_FETCH_DATA_CHANNEL, ...args),
		wss: (...args: string[]) => ipcRenderer.invoke(CHROME_WSS_CHANNEL, ...args),
    });
}
