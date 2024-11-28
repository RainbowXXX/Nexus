import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    plugins: [react()],
    build: {
        outDir: '.vite/renderer', // 输出目录
        rollupOptions: {
            input: {
                main: './index.html' // 入口文件
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),  // 将 @ 映射到 src 目录
        },
    },
});