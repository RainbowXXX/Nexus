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
	export interface LoginParameter {
		account: string,
		password: string,
		application: 'Nexus',
	}

	export interface SendMessageRequest {
		"publickeyversion": string| "None",

		"type": "MessageSend",
		"exchange": {
			"to": number
		},
		"data": MessageParameter| string,
		"sign": string,
	}
	export interface GetPublicKeyRequest {
		"type": "GetPublickey",
		"target": number
	}
	export interface RefreshPublicKeyRequest {
		"type": "RefreshPublickey",
		"publickeyversion": "None"| string,
		"newpublickey": string,
		"signPub": string,
		"sign": string
	}

	interface WSSBaseParameter {
		"application": 'Nexus',
		"type": "user",
		"serial": string| undefined,
		"timestamp": number,
		"data": any,
	}

	type RequestDataType = SendMessageRequest| GetPublicKeyRequest| RefreshPublicKeyRequest;
	export interface WSSRequestParameter extends WSSBaseParameter {
		"data": RequestDataType| string,
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
	export interface GetPublicKeyMessage {
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
	export interface RefreshPublicKeyMessage{
		"type": "RefreshPublickey"
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

	export type DataType = InitialMessage| ArriveMessage| GetPublicKeyMessage| OnlineMessage| OfflineMessage| RefreshPublicKeyMessage;
	export interface WSSResponse extends WSSBaseResponse {
		"data": DataType,
	}
}

export namespace serverEvent {
	export type ServerEventType = 'login' | 'logout' | 'establish' | 'close' | 'terminate' | 'receive';
}

export namespace Tools {
	/**
	 * 结果类, 如果没有错误发生, 那么返回数据, 否则返回Error
	 */
	export class Result<T = any> {
		/**
		 * 用于从纯对象(只包含数据, 不包含方法的对象) 或 JSON字符串中构造Result对象
		 * @param data
		 */
		constructor(data?: {error: string}| {data: T}| string) {
			if(data === undefined) return;
			if(typeof data === 'string') {
				data = JSON.parse(data) as {error: string}| {data: T};
			}
			if('error' in data) {
				return Result.Error(data.error);
			}
			return Result.Some(data.data);
		}

		private static DataSome = class<T> extends Result<T> {
			data: T| undefined;

			constructor(data: T| undefined) {
				super();
				this.data = data;
			}
		};

		private static DataError = class<T> extends Result<T> {
			error: string;

			constructor(error: string) {
				super();
				this.error = error;
			}
		};

		static Some<T>(data: T| undefined = undefined): Result<T> {
			return new Result.DataSome(data);
		}

		static Error(error: string): Result {
			return new Result.DataError(error);
		}

		hasValue(): boolean {
			return ! (this instanceof Result.DataError);
		}

		hasError(): boolean {
			return (this instanceof Result.DataError);
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
