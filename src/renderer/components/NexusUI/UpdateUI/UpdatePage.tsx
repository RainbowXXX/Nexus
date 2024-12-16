import React, { useState } from "react";
import styles from "@/styles/NexusUI/Update.module.css";

export default function NewUpdatePage({ setUpdatePageOpen }: { setUpdatePageOpen: (_: boolean) => void }) {
    let updateStatus = 'ready'
    const [progressValue, setProgressValue] = useState(0);
    const handleUpdateClick = () => {
        console.log('按钮点击');
        setProgressValue(prev => Math.min(prev + 20, 100));
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