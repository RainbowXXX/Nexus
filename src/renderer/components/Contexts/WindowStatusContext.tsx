import { createContext } from "react";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../../../lib/constants";

export const defaultVal: WindowStatus = {
	size: {height: DEFAULT_HEIGHT, width: DEFAULT_WIDTH },
	position: { x: 0, y: 0 },
	status: { isMaximized: false, isMinimized: false, isResizable: false, isFullScreen: false, isVisible: false},
	title: '',
	opacity: 0,
}

export const WindowStatusContext = createContext<WindowStatus>(defaultVal);
