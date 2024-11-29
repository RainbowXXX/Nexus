declare namespace localStorage {
	interface User {
		token: string | null,
		user: {
			name: string | null,
			avatar: string | null,
			phone: string | null,
			email: string | null
		}
	}
}

declare namespace parameter {
	interface MessageParameter {
		"messagetype": "text",
		"message": string,
		"timestamp": number
	}
	interface LoginParameter {
		account: string,
		password: string,
		application: 'Nexus',
	}

	interface SendMessageRequest {
		"publickeyversion": string| "None",

		"type": "MessageSend",
		"exchange": {
			"to": number
		},
		"data": MessageParameter| string,
		"sign": string,
	}
	interface GetPublicKeyRequest {
		"type": "GetPublickey",
		"target": number
	}
	interface RefreshPublicKeyRequest {
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
	interface WSSRequestParameter extends WSSBaseParameter {
		"data": RequestDataType| string,
	}
}

declare namespace response {
	interface InitialMessage {
		"type": "AliveUser",
		"data": {
			"total": number,
			"aliveList": number[],
		}
	}
	interface ArriveMessage {
		"type": "MessageDistribution",
		"publickeyversion": "None",
		"exchange": {
			"from": number,
			"to": number
		},
		"data": parameter.MessageParameter| string,
		"sign": string
	}
	interface GetPublicKeyMessage {
		"type": "GetPublickey",
		"target": number,
		"version": string| undefined,
		"publickey": string| undefined,
	}
	interface OnlineMessage {
		"type": "UserOnline",
		"data": {
			"userid": number
		}
	}
	interface OfflineMessage {
		"type": "UserOffline",
		"data": {
			"userid": number
		}
	}
	interface RefreshPublicKeyMessage{
		"type": "RefreshPublickey"
	}
	interface UserInfo {
		"id": number,
		"name": string,
		"avatar": null | string,
	}

	interface BaseResponse {
		status: number,
		message: string,
	}
	interface WSSBaseResponse extends BaseResponse {
		"type": "sys" | 'user' | string,
		"serial": string| undefined,
		"timestamp": number,
		"data": any,
	}

	interface LoginResponse extends BaseResponse {
		application?: 'Nexus' | string,
		token?: string
	}
	interface UserInfoResponse extends BaseResponse {
		data: null | UserInfo | UserInfo[]
	}

	type DataType = InitialMessage| ArriveMessage| GetPublicKeyMessage| OnlineMessage| OfflineMessage| RefreshPublicKeyMessage;
	interface WSSResponse extends WSSBaseResponse {
		"data": DataType,
	}
}
