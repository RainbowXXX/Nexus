type LoginInfo = parameter.LoginParameter;
type MessageParameter = parameter.MessageParameter;

export async function openDevTools() {
    await window.chromeTools.open_dev_tools();
}
export async function testForFeature(...args: string[]) {
	return await window.chromeTools.test_for_feature(...args);
}
export async function fetchData(...args: string[]) {
	return await window.chromeTools.fetch_data(...args);
}

export async function createClient(wssUrl: string) {
	return await window.chromeTools.wss('create', wssUrl);
}
export async function loginServer(loginInfo: LoginInfo): Promise<boolean> {
	return await window.chromeTools.wss('login', JSON.stringify(loginInfo));
}
export async function closeClient(): Promise<void> {
	await window.chromeTools.wss('close');
}
export async function sendMessage(message: MessageParameter, to: number) {
	return await window.chromeTools.wss('send', JSON.stringify({message: message, to: to}));
}
export async function createNewKeyPair() {
	return await window.chromeTools.wss('createKeyPair');
}
