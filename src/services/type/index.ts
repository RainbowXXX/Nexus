export namespace localStorage {
    export interface User {
        token: string | null,
        user: {
            name: string | null,
            avatar: string | null,
            phone: string | null,
            email: string | null
        }
    }
}

export namespace parameter {
    export interface LoginInfo {
        account: string,
        password: string,
        application: 'Nexus',
    }
}

export namespace response {
	export interface InitialMessage {
		"type": "AliveUser",
		"data": {
			"total": number,
			"aliveList": number[],
		}
	}
	export interface UserInfo {
		"name": string,
		"phone": string,
		"email": null | string,
		"avatar": null | string,
	}

	export interface BaseResponse {
		status: number,
		message: string,
	}
	export interface WSSBaseResponse extends BaseResponse {
		"type": "sys" | 'user' | string,
		"timestamp": number,
		"data": any,
	}

    export interface LoginResponse extends BaseResponse {
		application?: 'Nexus' | string,
        token?: string
    }
	export interface UserInfoResponse extends BaseResponse {
		data: null | UserInfo | UserInfo[]
	}

	export interface WSSResponse extends WSSBaseResponse {
		"data": InitialMessage,
	}
}

export namespace client {
	export type ClientEventType = 'login' | 'logout' | 'establish' | 'close' | 'terminate' | 'receive';
	export class ClientEventData<T = any> {
		constructor(data: any = undefined) {
			if(data === undefined) return;
			if(data.error) return ClientEventData.Error(data.error);
			return ClientEventData.Some(data.data);
		}

		private static DataSome = class<T> extends ClientEventData<T> {
			data: T| undefined;

			constructor(data: T| undefined) {
				super();
				this.data = data;
			}
		};

		private static DataError = class<T> extends ClientEventData<T> {
			error: string;

			constructor(error: string) {
				super();
				this.error = error;
			}
		};

		static Some<T>(data: T| undefined = undefined): ClientEventData<T> {
			return new ClientEventData.DataSome(data);
		}

		static Error(error: string): ClientEventData {
			return new ClientEventData.DataError(error);
		}

		hasValue(): boolean {
			return ! (this instanceof ClientEventData.DataError);
		}

		getData(): T | never {
			if (this.hasValue()) {
				return (this as any).data;
			}
			throw new Error("No data present in ClientEventData (Error state)");
		}

		getError(): string | never {
			if (! this.hasValue()) {
				return (this as any).error;
			}
			throw new Error("No error present in ClientEventData (Some state)");
		}
	}


/*	export class ClientEventData {
		error?: string;
		data: null | any;

		constructor(error?: string, data?: any) {
			if(error) {
				this.error = error;
				return;
			}
			this.data = data;
		}

		static Error(detail: string) {
			return new ClientEventData(detail);
		}

		static Some(data?: any) {
			return new ClientEventData(undefined, data);
		}
	}*/
}
