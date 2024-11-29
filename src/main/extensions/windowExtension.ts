import { BrowserWindow } from "electron";

export function monutWindowExtension(window: BrowserWindow) {

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
