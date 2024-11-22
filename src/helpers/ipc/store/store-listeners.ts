import { BrowserWindow, ipcMain } from "electron";
import {
	STORE_FLUSH_CHANNEL,
	STORE_GET_DATA_CHANNEL,
	STORE_REMOVE_DATA_CHANNEL,
	STORE_SET_DATA_CHANNEL,
} from "./store-channels";
import storage from "../../../extensions/storeExtension";

export function addStoreEventListeners(_: BrowserWindow) {
	ipcMain.handle(STORE_GET_DATA_CHANNEL, async (_, key: string) => {
		return await storage.get(key);
	});
	ipcMain.handle(STORE_SET_DATA_CHANNEL, async (_, key: string, value: string) => {
		return await storage.set(key, value);
	});
	ipcMain.handle(STORE_REMOVE_DATA_CHANNEL, async (_, key: string) => {
		return await storage.remove(key);
	});
	ipcMain.handle(STORE_FLUSH_CHANNEL, async (_) => {
		return await storage.flush();
	});
}
