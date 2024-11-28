import { localStorage, response, Tools } from "./type/index";
import storage from "../extensions/storeExtension";
import BaseResponse = response.BaseResponse;
import Result = Tools.Result;

export class ApiService {
    #baseURL: string;
    #UserToken: string | null = null;

    constructor(baseURLWithPrefix: string) {
        this.#baseURL = baseURLWithPrefix;
    }

	updateToken(token: string) {
		this.#UserToken = token;
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
            const response = await fetch(`${this.#baseURL}${endpoint}`, options);
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
