/**
 * 结果类, 如果没有错误发生, 那么返回数据, 否则返回Error
 */
class Result<T = any> {
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
