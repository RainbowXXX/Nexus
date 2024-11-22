import { ipcRenderer } from "electron";
import {
	STORE_FLUSH_CHANNEL,
	STORE_GET_DATA_CHANNEL,
	STORE_REMOVE_DATA_CHANNEL,
	STORE_SET_DATA_CHANNEL,
} from "./store-channels";

const storage: StoreObject = {
	get(key: string): Promise<string | undefined> {
		return new Promise( async (resolve, _) => {
			resolve(await ipcRenderer.invoke(STORE_GET_DATA_CHANNEL, key))
		})
	},
	set(key: string, value: any): Promise<void> {
		return new Promise(async  (resolve, _) => {
			await ipcRenderer.invoke(STORE_SET_DATA_CHANNEL, key, value)
			resolve();
		})
	},
	remove(key: string): Promise<void> {
		return new Promise(async (resolve, _) => {
			await ipcRenderer.invoke(STORE_REMOVE_DATA_CHANNEL, key)
			resolve();
		})
	},
	flush(): Promise<void> {
		return new Promise(async (resolve, _) => {
			await ipcRenderer.invoke(STORE_FLUSH_CHANNEL);
			resolve();
		})
	}
}

export function exposeStoreContext() {
	const { contextBridge } = window.require("electron");
	contextBridge.exposeInMainWorld('storeExtensions', {
		store: storage,
	})
}
