import path from "path";
import { LocalPersistence, UserPersistenceData } from "./StorageModels/LocalPersistence";

class StorageService {
	static MATA_DATA_PATH: string = "mata_data/mata_data.json";

	readonly #BasePath: string;
	readonly #Key: string| undefined;

	mataData: UserPersistenceData;

	constructor(basePath: string, key?: string) {
		this.#Key = key;
		this.#BasePath = basePath;

		this.mataData = this.getMataData();
	}

	getMataData(): UserPersistenceData {
		let mata_data_path = path.join(this.#BasePath, StorageService.MATA_DATA_PATH);
		return new LocalPersistence(mata_data_path, this.#Key).getProxy();
	}

	getDataOfUser(userName: string): any {

	}
}
