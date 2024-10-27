import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeChromeContext } from "./chrome/chrome-context";
import { exposeStoreContext } from "./store/store-context";

export default function exposeContexts() {
	// 暴露存储拓展
	exposeStoreContext();

    exposeWindowContext();
	exposeChromeContext();
    exposeThemeContext();
}
