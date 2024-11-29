import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import { external, getBuildConfig, getBuildDefine, pluginHotRestart } from "./vite.base.config";
import path from "path";

// https://vitejs.dev/config
export default defineConfig((env) => {
    // @ts-ignore
	const forgeEnv = env as ConfigEnv<"build">;
    const { forgeConfigSelf } = forgeEnv;
    const define = getBuildDefine(forgeEnv);
    const config: UserConfig = {
        build: {
            lib: {
                entry: forgeConfigSelf.entry!,
                fileName: () => "[name].js",
                formats: ["cjs"],
            },
            rollupOptions: {
                external,
            },
        },
        plugins: [pluginHotRestart("restart")],
        define,
        resolve: {
			preserveSymlinks: true,
			alias: {
				"@": path.resolve(__dirname, "./src/renderer"),
				"@main": path.resolve(__dirname, "./src/main"),
				"@src": path.resolve(__dirname, "./src"),
			},
            // Load the Node.js entry.
            mainFields: ["module", "jsnext:main", "jsnext"],
        },
    };

    return mergeConfig(getBuildConfig(forgeEnv), config);
});
