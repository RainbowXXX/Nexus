const fs = require('fs');
const path = require('path');
const Terser = require('terser');

const buildDir = '.vite';
const outputDir = '.vite';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 递归遍历目录并压缩 JS 文件
function compressFiles(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const outputFilePath = path.join(outputDir, file);

            fs.stat(filePath, (err, stat) => {
                if (err) throw err;

                if (stat.isDirectory()) {
                    // 如果是目录，递归调用
                    compressFiles(filePath);
                } else if (file.endsWith('.js')) {
                    // 如果是 JS 文件，进行压缩
                    fs.readFile(filePath, 'utf8', (err, code) => {
                        if (err) throw err;
                        Terser.minify(code).then(result => {
                            // 创建输出目录（如果需要）
                            const relativePath = path.relative(buildDir, filePath);
                            const outputFullPath = path.join(outputDir, relativePath);

                            fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
                            fs.writeFileSync(outputFullPath, result.code);
                            console.log(`Compressed: ${outputFullPath}`);
                        }).catch(err => {
                            console.error(`Error compressing ${filePath}:`, err);
                        });
                    });
                }
            });
        });
    });
}

// 开始压缩
compressFiles(buildDir);