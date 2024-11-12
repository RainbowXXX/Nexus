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
	export interface MessageParameter {
		"messagetype": "text",
		"message": string,
		"timestamp": number
	}
	export interface SendMessageParameter {
		// 保留字段
		"publickeyversion": "None",

		"type": "MessageSend",
		"exchange": {
			"to": number
		},
		"data": MessageParameter,
		"sign": string,
	}

    export interface LoginInfo {
        account: string,
        password: string,
        application: 'Nexus',
    }

	interface WSSBaseParameter {
		"application": 'Nexus',
		"type": "user",
		"timestamp": number,
		"data": any,
	}

	export interface WSSParameter extends WSSBaseParameter {
		"data": SendMessageParameter| string,
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
	export interface ArriveMessage {
		"type": "MessageDistribution",
		"publickeyversion": "None",
		"exchange": {
			"from": number,
			"to": number
		},
		"data": {
			"messagetype": "text",
			"message": string,
			"timestamp": number
		},
		"sign": string
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
		"data": InitialMessage| ArriveMessage,
	}
}

export namespace serverEvent {
	export type ServerEventType = 'login' | 'logout' | 'establish' | 'close' | 'terminate' | 'receive' | 'CreatKeyPair';
	export class ServerEventData<T = any> {
		constructor(data: any = undefined) {
			if(data === undefined) return;
			if(data.error) return ServerEventData.Error(data.error);
			return ServerEventData.Some(data.data);
		}

		private static DataSome = class<T> extends ServerEventData<T> {
			data: T| undefined;

			constructor(data: T| undefined) {
				super();
				this.data = data;
			}
		};

		private static DataError = class<T> extends ServerEventData<T> {
			error: string;

			constructor(error: string) {
				super();
				this.error = error;
			}
		};

		static Some<T>(data: T| undefined = undefined): ServerEventData<T> {
			return new ServerEventData.DataSome(data);
		}

		static Error(error: string): ServerEventData {
			return new ServerEventData.DataError(error);
		}

		hasValue(): boolean {
			return ! (this instanceof ServerEventData.DataError);
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
}
