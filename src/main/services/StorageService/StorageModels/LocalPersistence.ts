import * as fs from "node:fs";

function createProxy<T extends object>(obj: T, onSet?: (_: T) => void, curProp?: string| symbol, parent?: any) {
	return new Proxy(obj, {
		get(target, prop, receiver) {
			if (prop in target) {
				const value = target[prop as keyof T];
				if (typeof value === 'object' && value !== null) {
					return createProxy(value, undefined, prop, receiver);
				}
				return value;
			}
			return null;
		},
		set(target, prop, newValue, receiver) {
			if (prop in target) {
				target[prop as keyof T] = newValue;
				if(parent !== undefined && curProp != undefined) {
					parent[curProp] = target;
				}
				if (parent === undefined && onSet !== undefined) {
					onSet(target);
				}
				return true;

			}
			return false;
		}
	});
}

// function createProxy<T extends object>(obj: T, onSet?: (_: T) => void, parent?: any,): T {
// 	return new Proxy(obj, {
// 		get(target, prop, receiver) {
// 			if (prop in target) {
// 				const value = target[prop as keyof T];
// 				if (typeof value === 'object' && value !== null) {
// 					return createProxy(value, undefined, target);
// 				}
// 				return value;
// 			}
// 			return null;
// 		},
// 		set(target, prop, newValue, receiver) {
// 			if (prop in target) {
// 				const propType = typeof target[prop as keyof T];
//
// 				if (typeof newValue === propType) {
// 					receiver[prop as keyof T] = newValue;
// 					if (parent && onSet !== undefined) {
// 						onSet(target)
// 					}
// 					return true;
// 				}
// 			}
// 			return false;
// 		}
// 	});
// }

class LocalPersistence {
	key?: string;
	dataPath: string;
	data: UserPersistenceData;

	constructor(dataPath: string, key?: string) {
		this.dataPath = dataPath;

		if(key !== undefined) {
			const keyLength = CryptoJS.enc.Utf8.parse(key).sigBytes
			if (keyLength === 16 || keyLength === 24 || keyLength === 32) {
				this.key = key;
			} else {
				throw new Error('Invalid key length. AES requires key length to be 128 bits (16 bytes), 192 bits (24 bytes), or 256 bits (32 bytes).');
			}
		}

		if(fs.existsSync(this.dataPath)) {
			const data_str = fs.readFileSync(this.dataPath).toString()
			const data = JSON.parse(data_str) as {
				isLocked: boolean,
				data: string | UserPersistenceData,
				timestamp: number,
				sign: string
			}
			const signData = {
				isLocked: data.isLocked,
				data: data.data,
				timestamp: Date.now(),
			}
			const signStr = JSON.stringify(signData);
			let hash = CryptoJS.HmacSHA256(signStr, this.key!).toString()
			if (hash !== data.sign) {
				throw new Error('Hash validation failed');
			}

			if (data.isLocked) {
				const data_json = CryptoJS.AES.decrypt(data.data as string, key!).toString(CryptoJS.enc.Utf8);
				this.data = JSON.parse(data_json) as UserPersistenceData;
			} else {
				this.data = data.data as UserPersistenceData;
			}
		}
		else {
			this.data = defaultUserPersistenceData
		}
	}

	getProxy(): UserPersistenceData {
		// const handler: ProxyHandler<UserPersistenceData> = {
		// 	set: (target: UserPersistenceData, prop: string | symbol, newValue: any, _receiver: any) => {
		// 		if (prop in target) {
		// 			const propType = typeof target[prop as keyof UserPersistenceData];
		//
		// 			if (typeof newValue === propType) {
		// 				target[prop as keyof UserPersistenceData] = newValue;
		// 				this.save(target);
		// 				return true;
		// 			}
		// 		}
		// 		return false;
		// 	}
		// }
		return createProxy(this.data, (newVal) => { this.save(newVal) });
	}

	save(newValue: UserPersistenceData) {
		const shouldLock = this.key !== undefined;
		const dataPersistence = shouldLock ? newValue : CryptoJS.AES.encrypt(JSON.stringify(newValue), this.key!).toString()
		const signData = {
			isLocked: shouldLock,
			data: dataPersistence,
			timestamp: Date.now(),
		}
		const signStr = JSON.stringify(signData);

		const saveObj = {
			isLocked: shouldLock,
			data: dataPersistence,
			timestamp: Date.now(),
			sign: CryptoJS.HmacSHA256(signStr, this.key!).toString()
		}
		fs.writeFileSync(this.dataPath, JSON.stringify(saveObj));
	}
}

interface UserPersistenceData {
	serverAddress?: string;
	theme: "system" | "dark" | "light";

	rememberPasswd: string;

	lastUserName?: string;
	lastPassword?: string;

	lastLoginToken?: string;
}

const defaultUserPersistenceData: UserPersistenceData = {
	serverAddress: undefined,
	theme: "system",

	rememberPasswd: "false",

	lastUserName: undefined,
	lastPassword: undefined,

	lastLoginToken: undefined,
}

export {
	LocalPersistence,
	UserPersistenceData
}
