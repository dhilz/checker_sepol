// src/modules/prompSpliter.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fsExtra = require('fs-extra');
const inquirer = require('inquirer');

const RESULT_DIR = path.join(__dirname, '../../result/split');
fsExtra.ensureDirSync(RESULT_DIR);

async function prompSpliter() {
  const { filePath, splitType } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Masukkan path file yang ingin di-split:',
      validate: fs.existsSync
    },
    {
      type: 'list',
      name: 'splitType',
      message: 'Pilih metode split:',
      choices: ['Split Dengan Size (MB)', 'Split Dengan Jumlah Baris']
    }
  ]);

  if (splitType === 'Split Dengan Size (MB)') {
    const { sizeMB } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sizeMB',
        message: 'Masukkan ukuran per file (dalam MB):',
        validate: value => !isNaN(value) && Number(value) > 0
      }
    ]);
    const sizeInBytes = Number(sizeMB) * 1024 * 1024;
    await splitBySize(filePath, sizeInBytes);
  } else {
    const { lines } = await inquirer.prompt([
      {
        type: 'input',
        name: 'lines',
        message: 'Masukkan jumlah baris per file:',
        validate: value => !isNaN(value) && Number(value) > 0
      }
    ]);
    await splitByLines(filePath, Number(lines));
  }
}

async function splitBySize(filePath, maxSize) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const filename = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const uniqueId = uuidv4();

  let part = 0;
  let currentSize = 0;
  let currentLines = [];

  for (const line of lines) {
    const lineWithNewline = line + '\n';
    const lineSize = Buffer.byteLength(lineWithNewline, 'utf-8');

    if (currentSize + lineSize > maxSize && currentLines.length > 0) {
      const partName = `${filename}_${uniqueId}_part${part}${ext}`;
      fs.writeFileSync(path.join(RESULT_DIR, partName), currentLines.join('\n'));
      console.log(`✅ Tersimpan: ${partName}`);
      part++;
      currentLines = [];
      currentSize = 0;
    }

    currentLines.push(line);
    currentSize += lineSize;
  }

  // Simpan sisa baris terakhir
  if (currentLines.length > 0) {
    const partName = `${filename}_${uniqueId}_part${part}${ext}`;
    fs.writeFileSync(path.join(RESULT_DIR, partName), currentLines.join('\n'));
    console.log(`✅ Tersimpan: ${partName}`);
  }
}

async function splitByLines(filePath, linesPerFile) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const filename = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const uniqueId = uuidv4();

  let part = 0;
  for (let i = 0; i < lines.length; i += linesPerFile) {
    const chunkLines = lines.slice(i, i + linesPerFile);
    const partName = `${filename}_${uniqueId}_part${part}${ext}`;
    fs.writeFileSync(path.join(RESULT_DIR, partName), chunkLines.join('\n'));
    console.log(`✅ Tersimpan: ${partName}`);
    part++;
  }
}

module.exports = prompSpliter;
