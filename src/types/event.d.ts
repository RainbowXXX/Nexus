declare namespace event {
	type ClientEventType = 'login' | 'logout' | 'close' | 'update';
	type ServerEventType = 'login' | 'logout' | 'establish' | 'close' | 'terminate' | 'receive';
}
