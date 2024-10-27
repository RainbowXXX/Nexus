import { BrowserWindow, ipcMain, Notification } from "electron";
import {
	STORE_GET_DATA_CHANNEL, STORE_REMOVE_DATA_CHANNEL, STORE_SET_DATA_CHANNEL,
} from "./store-channels";
import store from "../../../extensions/storeExtension";

export function addStoreEventListeners(mainWindow: BrowserWindow) {
	ipcMain.handle(STORE_GET_DATA_CHANNEL, async (_, key: string) => {
		console.log('get', key)
		return await store.get(key);
	});
	ipcMain.handle(STORE_SET_DATA_CHANNEL, async (_, key: string, value: string) => {
		console.log('set', key, value)
		return await store.set(key, value);
	});
	ipcMain.handle(STORE_REMOVE_DATA_CHANNEL, async (_, key: string) => {
		console.log('remove', key)
		return await store.remove(key);
	});
}
