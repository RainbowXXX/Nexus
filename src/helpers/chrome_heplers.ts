export async function openDevTools() {
    await window.chromeTools.open_dev_tools();
}
export async function testForFeature(...args: string[]) {
	return await window.chromeTools.test_for_feature(...args);
}
