import { BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log/main";
import Result from "../../lib/utils";
import IpcMainEvent = Electron.IpcMainEvent;

export function mountUpdateExtension(window: BrowserWindow) {
	const forwardToFront = (channel: string, data: Result<any>, on_return?: (event: IpcMainEvent, data: Result) => void) => {
		window.webContents.send('update', channel, JSON.stringify(data));
		if(on_return !== undefined) {
			window.webContents.ipc.on('update', (event, return_channel, args) => {
				if (args.length !== 1) {
					// 无效, 因为只有一个参数: Result的JSON化字符串
					return;
				}
				const res = new Result(args[0])

				if (channel === return_channel) {
					on_return(event, res)
				}
			})
		}
	}

	autoUpdater.on('checking-for-update', () => {
		log.info('开始检查更新...');
		forwardToFront('checking-for-update', Result.Some())
	})
	autoUpdater.on('update-available', (info) => {
		log.info('检测到新版本');
		forwardToFront('update-available', Result.Some(info), (event, data) => {
			const res = data as Result<boolean>;

			// 返回的是 是否下载
			if (!res.hasValue() || !res.getData()) {
				return
			}

			// TODO(dev) 添加下载控制
			autoUpdater.downloadUpdate()
		})
	});
	autoUpdater.on('update-not-available', () => {
		log.info('已经是最新版');
		forwardToFront('update-not-available', Result.Some())
	});
	autoUpdater.on('download-progress', (progressObj) => {
		const { percent, total, transferred } = progressObj;
		log.info(`下载进度: ${percent}% (${transferred} / ${total} bytes)`);
		forwardToFront('download-progress', Result.Some(progressObj))
	});
	autoUpdater.on('update-downloaded', () => {
		log.info('更新下载完成');
		forwardToFront('update-downloaded', Result.Some(), (event, data) => {
			const res = data as Result<boolean>;

			// 返回的是 是否更新
			if (!res.hasValue() || !res.getData()) {
				return
			}

			// TODO(dev) 添加更新控制
			autoUpdater.quitAndInstall();
		})
	});
	autoUpdater.on('error', (error: Error, message) => {
		log.error('Nexus更新系统错误:', error);
		forwardToFront('error', Result.Some(error))
	});
	autoUpdater.checkForUpdatesAndNotify();
}
