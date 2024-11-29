import React, { ReactNode, useEffect, useState } from "react";
import { defaultVal, WindowStatusContext } from "@/components/Contexts/WindowStatusContext";

export default function WindowStatusProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<WindowStatus>(defaultVal);

	useEffect(() => {
		const updateStatus = (event_type: string, status: string) => {
			console.log(event_type)
			const window_status = JSON.parse(status) as WindowStatus;
			setStatus(window_status);
		};
		return window.chromeTools.ipc.on("set-window-status", updateStatus);
	}, []);

	return (
		<WindowStatusContext.Provider value={status}>
			{children}
		</WindowStatusContext.Provider>
	);
}
