import { BrowserWindow, Menu, Tray } from "electron";
import { iconImage } from "../main";

// 定义菜单模板
const menuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
	{
		label: '应用信息',
		submenu: [
			{ label: '关于', role: 'about' },
			{ label: '检查更新...', click: () => { console.log('检查更新') } }
		]
	},
	{ type: 'separator' },
	{
		label: '状态',
		submenu: [
			{ label: '在线', type: 'radio', checked: true },
			{ label: '离开', type: 'radio' },
			{ label: '勿扰', type: 'radio' }
		]
	},
	{ type: 'separator' },
	{
		label: '操作',
		submenu: [
			{
				label: '发送反馈',
				accelerator: 'CmdOrCtrl+F',
				click: () => { console.log('发送反馈') }
			},
			{
				label: '设置',
				accelerator: 'CmdOrCtrl+,',
				click: () => { console.log('打开设置') }
			}
		]
	},
	{ type: 'separator' },
	{ label: '退出', role: 'quit' }
];

let tray: Tray;

export function mountTrayExtension(window: BrowserWindow) {
	tray = new Tray(iconImage)
	const contextMenu = Menu.buildFromTemplate(menuTemplate)
	tray.setTitle('Nexus')
	tray.setToolTip('Nexus')
	tray.setContextMenu(contextMenu)
}

export function unmountTrayExtension() {
	tray.destroy()
}
