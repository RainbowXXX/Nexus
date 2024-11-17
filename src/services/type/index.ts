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
		"publickeyversion": string| "None",

		"type": "MessageSend",
		"exchange": {
			"to": number
		},
		"data": MessageParameter,
		"sign": string,
	}
	export interface PublickeyParameter {
		"type": "GetPublickey",
		"target": number
	}

    export interface LoginInfo {
        account: string,
        password: string,
        application: 'Nexus',
    }

	interface WSSBaseParameter {
		"application": 'Nexus',
		"type": "user",
		"serial": string| undefined,
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
		"data": parameter.MessageParameter| string,
		"sign": string
	}
	export interface PublickeyMessage {
		"type": "GetPublickey",
		"target": number,
		"version": string| undefined,
		"publickey": string| undefined,
	}
	export interface OnlineMessage {
		"type": "UserOnline",
		"data": {
			"userid": number
		}
	}
	export interface OfflineMessage {
		"type": "UserOffline",
		"data": {
			"userid": number
		}
	}

	export interface UserInfo {
		"id": number,
		"name": string,
		"avatar": null | string,
	}

	export interface BaseResponse {
		status: number,
		message: string,
	}
	export interface WSSBaseResponse extends BaseResponse {
		"type": "sys" | 'user' | string,
		"serial": string| undefined,
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

	export type DataType = InitialMessage| ArriveMessage| PublickeyMessage| OnlineMessage| OfflineMessage;
	export interface WSSResponse extends WSSBaseResponse {
		"data": DataType,
	}
}

export namespace serverEvent {
	export type ServerEventType = 'login' | 'logout' | 'establish' | 'close' | 'terminate' | 'receive';
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
