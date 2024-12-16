import path from "path";
import log from 'electron-log/main';
import { autoUpdater, UpdateInfo } from "electron-updater";
import { app, BrowserWindow, ipcMain, Menu, Tray } from "electron";

import registerListeners from "./ipc/listeners-register";
import { mountWindowExtension } from "./extensions/windowExtension";
import { mountStoreExtension, unmountStoreExtension } from "./extensions/storeExtension";
import { DEFAULT_HEIGHT, DEFAULT_MIN_HEIGHT, DEFAULT_MIN_WIDTH, DEFAULT_WIDTH } from "../lib/constants";
import * as electron from "electron";
import { mountUpdateExtension } from "./extensions/updateExtension";
import { mountTrayExtension, unmountTrayExtension } from "./extensions/trayExtension";

log.initialize()
log.info('应用启动');

const iconImage = electron.nativeImage.createFromPath("assets/images/icon.ico");
const inDevelopment = process.env.NODE_ENV === "development";

let mainWindow: Electron.CrossProcessExports.BrowserWindow | null = null;

function createWindow() {
	const preload_path = path.join(__dirname, "preload.js");

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

			preload: preload_path,
		},
		titleBarStyle: "hidden",
		icon: iconImage,
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
		mountWindowExtension(mainWindow);
		//TODO 检查修改是否错误
		mountStoreExtension(mainWindow);
		mountUpdateExtension(mainWindow);
		mountTrayExtension(mainWindow);
	}

	if (inDevelopment) {
		mainWindow.webContents.openDevTools()
	}
}

app.whenReady().then(createWindow);

//osX only
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		unmountTrayExtension();
		unmountStoreExtension();
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
	mainWindow,
	iconImage
}
