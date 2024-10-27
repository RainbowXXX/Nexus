import * as fs from "node:fs";

interface storeExtension {
	set(key: string, value: string): void;
	get(key: string): string | null;
	remove(key: string): void;
}

type StoreItem = {
	[key: string]: string;
};

const dataFile = 'data.json';
let map: StoreItem = {};

const store: storeExtension = {
	set(key: string, value: string) {
		map[key] = value;
	},
	get(key: string): string | null {
		return map[key];
	},
	remove(key: string) {
		delete map[key];
	},
}

export function mountStore() {
	if(fs.existsSync(dataFile)) {
		map = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
	}
}

export function unmountStore() {
	if(!fs.existsSync(dataFile)) {
		fs.writeFileSync(dataFile, JSON.stringify(map));
	}
}

export default store;
