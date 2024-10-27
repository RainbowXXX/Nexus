import * as fs from "node:fs";
import { BrowserWindow } from "electron";

type StoreItem = {
	[key: string]: string;
};

const dataFile = 'data.json';
let map: StoreItem = {};

const storage: StoreObject = {
	set(key: string, value: string): Promise<void> {
		console.log('set', key, value);
		map[key] = value;
		return Promise.resolve();
	},
	get(key: string): Promise<string | null> {
		console.log('get', key);
		return Promise.resolve(map[key]);
	},
	remove(key: string) {
		console.log('remove', key);
		delete map[key];
		return Promise.resolve();
	},
}

export function mountStore(window: BrowserWindow) {
	if(fs.existsSync(dataFile)) {
		map = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
	}
}

export function unmountStore() {
	fs.writeFileSync(dataFile, JSON.stringify(map));
}

export default storage;
