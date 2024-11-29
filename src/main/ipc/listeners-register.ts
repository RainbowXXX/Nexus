import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addChromeEventListeners } from "./chrome/chrome-listeners";
import { addStoreEventListeners } from "./store/store-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
	addStoreEventListeners(mainWindow);

    addWindowEventListeners(mainWindow);
	addChromeEventListeners(mainWindow);
    addThemeEventListeners();
}
