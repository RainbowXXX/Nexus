import { defineConfig } from "vite";
import { builtinModules } from "node:module";
import pkg from "./package.json";

const builtins = ["electron", ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

const external = [
	...builtins,
	...Object.keys("dependencies" in pkg ? (pkg.dependencies as Record<string, unknown>) : {}),
];

export default defineConfig(({ command, mode }) => {
	return {
		root: __dirname,
		mode: mode,
		build: {
			emptyOutDir: false,
			outDir: ".vite/build",
			minify: "terser",
			rollupOptions: {
				external,
				input: "src/main/preload.ts",
				output: {
					format: "cjs",

					inlineDynamicImports: true,
					entryFileNames: "[name].js",
					chunkFileNames: "[name].js",
					assetFileNames: "[name].[ext]",
				},
			},
		},
		clearScreen: false,
	};
});
