import path from "path";
import log from 'electron-log/main';
import { autoUpdater } from "electron-updater"
import { app, BrowserWindow, Menu, Tray } from "electron";

import registerListeners from "./ipc/listeners-register";
import { monutWindowExtension } from "./extensions/windowExtension";
import { mountStore, unmountStore } from "./extensions/storeExtension";
import { DEFAULT_HEIGHT, DEFAULT_MIN_HEIGHT, DEFAULT_MIN_WIDTH, DEFAULT_WIDTH } from "../lib/constants";
import * as electron from "electron";

log.initialize()
log.info('应用启动');

const inDevelopment = process.env.NODE_ENV === "development";

let tray: Tray | null = null;
let mainWindow: Electron.CrossProcessExports.BrowserWindow | null = null;

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

function createWindow() {
	const preload = path.join(__dirname, "preload.js");
	const image = electron.nativeImage.createFromPath("assets/images/icon.ico");

	mainWindow = new BrowserWindow({
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT,
		minWidth: DEFAULT_MIN_WIDTH,
		minHeight: DEFAULT_MIN_HEIGHT,
		webPreferences: {
			// devTools: inDevelopment,
			contextIsolation: true,
			nodeIntegration: true,
			nodeIntegrationInSubFrames: false,

			preload: preload,
		},
		titleBarStyle: "hidden",
		icon: image,
		...(process.platform !== 'darwin' ? {
			titleBarOverlay: true
		} : {})
	});

	if (process.platform !== 'darwin') {
		mainWindow.setTitleBarOverlay({
			color: 'black',
			symbolColor: 'white'
		})
	}
	mainWindow.setMenuBarVisibility(false)

	registerListeners(mainWindow);

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		log.log(`MAIN_WINDOW_VITE_DEV_SERVER_URL: ${MAIN_WINDOW_VITE_DEV_SERVER_URL}`)
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../index.html`)
		);
	}

	// 设置APP ID, 用于在通知显示
	app.setAppUserModelId('cn.nihuan.nexus');

	if (mainWindow) {
		monutWindowExtension(mainWindow);
		//TODO 检查修改是否错误
		mountStore(mainWindow);
	}

	// if (inDevelopment) {
	// 	mainWindow.webContents.openDevTools()
	// }
	checkForUpdates()

	tray = new Tray(image)
	const contextMenu = Menu.buildFromTemplate(menuTemplate)
	tray.setTitle('Nexus')
	tray.setToolTip('Nexus')
	tray.setContextMenu(contextMenu)
}

function checkForUpdates() {
	log.info('检查更新函数触发！');
	autoUpdater.on('checking-for-update', () => {
		log.info('开始检查更新...');
	})
	autoUpdater.on('update-available', () => {
		log.info('检测到新版本,开始下载');
		autoUpdater.downloadUpdate()
	});
	autoUpdater.on('update-not-available', () => {
		log.info('已经是最新版');
	});
	autoUpdater.on('download-progress', (progressObj) => {
		const { bytesPerSecond, percent, total, transferred } = progressObj;
		log.info(`下载进度: ${percent}% (${transferred} / ${total} bytes)`);
	});
	autoUpdater.on('update-downloaded', () => {
		log.info('更新下载完成');
		// 当更新下载完成时，自动安装更新
		autoUpdater.quitAndInstall();
	});
	autoUpdater.on('error', (error: Error) => {
		log.error('Nexus更新系统错误:', error);
	});
	autoUpdater.checkForUpdatesAndNotify();
	log.info('checkForUpdatesAndNotify执行结束');
}

app.whenReady().then(createWindow);

//osX only
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		tray?.destroy();
		unmountStore();
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
//osX only ends

export {
	mainWindow
}
