import * as fs from "node:fs";
import { BrowserWindow } from "electron";
import { DEFAULT_DATA_FILE } from "../constants/SharedConstants";

type StoreItem = {
	[key: string]: string;
};

const dataFile = DEFAULT_DATA_FILE;
let map: StoreItem = {};

const storage: StoreObject = {
	set(key: string, value: string): Promise<void> {
		console.log('Set store:', key, value);
		map[key] = value;
		return Promise.resolve();
	},
	get(key: string): Promise<string | null> {
		console.log('Get store:', key);
		return Promise.resolve(map[key]);
	},
	remove(key: string) {
		console.log('Remove store:', key);
		delete map[key];
		return Promise.resolve();
	},
}

export function mountStore(_: BrowserWindow) {
	if(fs.existsSync(dataFile)) {
		map = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
	}
}

export function unmountStore() {
	fs.writeFileSync(dataFile, JSON.stringify(map));
}

export default storage;
