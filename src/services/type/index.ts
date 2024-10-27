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
    export interface LoginResponse {
        status: number,
        message: string,
        application?: 'Nexus' | string,
        token?: string
    }
}

export interface ConnectEvent {
	event_type: 'establish' | 'close' | 'terminate' | 'receive' | 'reset'
	obj: any
}
