import React, { useEffect, useState } from "react";
import styles from "@/styles/NexusUI/Update.module.css";
import { ipcRenderer } from "electron";
import { UpdateInfo } from "electron-updater";
import Result from "../../../../lib/utils";
import { ProgressInfo } from "electron-builder";

export default function NewUpdatePage({ setUpdatePageOpen }: { setUpdatePageOpen: (_: boolean) => void }) {
    let updateStatus = 'ready'
    const [progressValue, setProgressValue] = useState(0);

	const replyToMain = (channel: string, data: Result) => {
		ipcRenderer.send('update', channel, JSON.stringify(data));
	}

	useEffect(() => {
		ipcRenderer.on('update', (event, event_type, info: Result) => {
			switch (event_type) {
				case 'update-available': {
					replyToMain(event_type, Result.Some(true))
					return
				}
				case 'download-progress': {
					const res = info as Result<ProgressInfo>
					if(!res.hasValue()) return;
					const updateInfo = res.getData();
					setProgressValue(prev => Math.min(updateInfo.percent, 100));
					return
				}
				default: {
					return;
				}
			}
		})
	}, []);

	const handleUpdateClick = () => {
		replyToMain('update-available', Result.Some(true));
	}

    return (
        <div className={styles.card}>
            <div className={styles.title}>版本更新</div>
            <div className={styles.infoBox}>
                <div className={styles.versionBox}>
                    <p>当前版本: </p>
                    <p>最新版本: </p>
                </div>
                <div className={styles.downloadProgressBox}>
                    <label>下载进度:</label>
                    <div className={styles.progressBox}>
                        <progress value={progressValue} max="100" className={styles.progress} />
                        <div className={styles.percentage}>{progressValue}%</div>
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <button onClick={handleUpdateClick}>
                        {updateStatus === 'ready' ? '更新' : '正在下载...'}
                    </button>
                </div>
            </div>
        </div>
    )
}
