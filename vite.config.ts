import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
	return {
		root: __dirname,
		mode: mode,
		base: "./",
		build: {
			outDir: ".vite/renderer",
		},
		server: {
		},
		plugins: [react()],
		resolve: {
			preserveSymlinks: true,
			alias: {
				"@": resolve(__dirname, "src/renderer"),
			},
		},
		clearScreen: false,
	};
});
