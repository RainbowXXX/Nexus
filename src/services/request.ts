import { localStorage, response, Tools } from "./type/index";
import storage from "../extensions/storeExtension";
import BaseResponse = response.BaseResponse;
import Result = Tools.Result;

export class ApiService {
    #baseURL: string;
    #UserToken: string | null = null;
	#Storage_Userstring: string| null = null;
    #Storage_User: localStorage.User | null = null;

    constructor(baseURL: string) {
        this.#baseURL = baseURL;
		// storage.get('User').then((res) => {
		// 	this.#Storage_Userstring = res
		// 	if (this.#Storage_Userstring) {
		// 		this.#Storage_User = JSON.parse(this.#Storage_Userstring)
		// 	} else {
		// 		this.#Storage_User = null
		// 	}
		// 	this.#UserToken = this.#Storage_User?.token ? this.#Storage_User.token : '';
		// })
    }

	updateToken(token: string) {
		this.#UserToken = token;
		storage.set('User', JSON.stringify({token: token}));
	}

    // 封装的 fetch 方法
    private async request<T>(endpoint: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
		this.#UserToken = this.#UserToken ?? '';

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': this.#UserToken,
        };

        const options: RequestInit = {
            method,
            credentials: 'same-origin',
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`https://${this.#baseURL}${endpoint}`, options);
            const responseJson = await response.json();
			console.log(responseJson)
            if (!response.ok || responseJson.status != 0) {
                if (responseJson.status == 5) {
					storage.remove('User');
                    // TODO 跳转到登录页面
                } else {
                    throw new Error(`Error: ${response.status} - ${responseJson.data.message}`);
                }
            }
            return responseJson as T;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // GET 方法
    async get(endpoint: string): Promise<Result<BaseResponse>> {
        let get_res = await this.request<BaseResponse>(endpoint, 'GET');
		if(get_res.status !== 0) {
			return Result.Error(get_res.message);
		}
		return Result.Some(get_res);
    }

    // POST 方法
    async post(endpoint: string, body: unknown): Promise<Result<BaseResponse>> {
        let post_res = await this.request<BaseResponse>(endpoint, 'POST', body);
		if(post_res.status !== 0) {
			return Result.Error(post_res.message);
		}
		return Result.Some(post_res);
    }
}
