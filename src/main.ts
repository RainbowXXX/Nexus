import { app, Menu, Tray, BrowserWindow } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";

import { DEFAULT_HEIGHT, DEFAULT_MIN_HEIGHT, DEFAULT_MIN_WIDTH, DEFAULT_WIDTH } from "./constants/SharedConstants";

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

if (require("electron-squirrel-startup")) {
	app.quit();
}

function createWindow() {
	const preload = path.join(__dirname, "preload.js");
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
	});
	registerListeners(mainWindow);

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		console.log(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
		);
	}

	// 设置APP ID, 用于在通知显示
	app.setAppUserModelId('Nexus');

	if(mainWindow){
		let window = mainWindow;

		// 获取窗体信息
		const getWindowInfo = (mainWindow: BrowserWindow): WindowStatus => {
			const { width, height, x, y } = mainWindow.getBounds();
			const isMaximized = mainWindow.isMaximized();
			const isMinimized = mainWindow.isMinimized();
			const isFullScreen = mainWindow.isFullScreen();
			const title = mainWindow.getTitle();
			const isResizable = mainWindow.isResizable();
			const isVisible = mainWindow.isVisible();
			const opacity = mainWindow.getOpacity();

			return {
				size: {
					width: width,
					height: height,
				},
				position: {
					x: x,
					y: y,
				},
				status: {
					isMaximized,
					isMinimized,
					isFullScreen,
					isResizable,
					isVisible,
				},
				title: title,
				opacity: opacity,
			};
		};
		let windowStatus: WindowStatus = getWindowInfo(window);

		const updateWindowInfo = (status: WindowStatus, reason: string): void => {
			windowStatus = status;
			window.webContents.send('set-window-status', reason, JSON.stringify(windowStatus));
		};

		window.webContents.on('did-finish-load', () => {
			updateWindowInfo(windowStatus, 'init');
		});

		// 监听窗口大小变化
		window.on('resize', () => {
			const { width, height } = window.getBounds();
			updateWindowInfo({
				...windowStatus,
				size: {
					width: width,
					height: height,
				}
			}, 'window-resize');
		});

		// 监听窗口位置变化
		window.on('move', () => {
			const { x, y } = window.getBounds();
			updateWindowInfo({
				...windowStatus,
				position: {
					x: x,
					y: y,
				}
			}, 'window-move');
		});

		// 监听窗口最大化
		window.on('maximize', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isMaximized: true,
				}
			}, 'window-maximize');
		});

		// 监听窗口恢复
		window.on('unmaximize', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isMaximized: false,
				}
			}, 'window-unmaximize');
		});

		// 监听窗口最小化
		window.on('minimize', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isMinimized: true,
				}
			}, 'window-minimize');
		});

		// 监听窗口恢复
		window.on('restore', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isMinimized: false,
				}
			}, 'window-restore');
		});

		// 监听全屏状态变化
		window.on('enter-full-screen', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isFullScreen: true,
				}
			}, 'window-enter-full-screen');
		});

		window.on('leave-full-screen', () => {
			updateWindowInfo({
				...windowStatus,
				status: {
					...windowStatus.status,
					isFullScreen: false,
				}
			}, 'window-leave-full-screen');
		});
	}

	if(inDevelopment) {
		mainWindow.webContents.openDevTools()
	}

	tray = new Tray('src/assets/images/icon.ico')
	const contextMenu = Menu.buildFromTemplate(menuTemplate)

	tray.setTitle('test tray')
	tray.setToolTip('This is my application.')
	tray.setContextMenu(contextMenu)
}

app.whenReady().then(createWindow);

//osX only
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
//osX only ends
