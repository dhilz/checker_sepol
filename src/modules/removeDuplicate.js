const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { v4: uuidv4 } = require('uuid');
const fsExtra = require('fs-extra');

const RESULT_DIR = path.join(__dirname, '../../result');
fsExtra.ensureDirSync(RESULT_DIR);

async function removeDuplicate() {
  const { filePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Masukkan path file yang ingin dihapus duplikatnya:',
      validate: fs.existsSync
    }
  ]);

  const content = await fs.promises.readFile(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  const uniqueLines = [...new Set(lines)];

  const originalCount = lines.length;
  const uniqueCount = uniqueLines.length;

  // Cek jika tidak ada duplikat, jika sama tidak perlu buat file baru
  if (originalCount === uniqueCount) {
    console.log('\n⚠️ Tidak ada duplikat di file ini. Tidak perlu membuat file baru.');
    return; // Tidak perlu lanjutkan jika sudah unik
  }

  const filename = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const uniqueId = uuidv4();
  const outputFileName = `${filename}_unique_${uniqueId}${ext}`;

  await fs.promises.writeFile(
    path.join(RESULT_DIR, outputFileName),
    uniqueLines.join('\n'),
    'utf-8'
  );

  console.log(`\n✅ Duplikat berhasil dihapus.`);
  console.log(`📄 Jumlah baris awal   : ${originalCount}`);
  console.log(`📄 Jumlah baris unik   : ${uniqueCount}`);
  console.log(`📁 File disimpan di     : result/${outputFileName}`);

  await inquirer.prompt([
    {
      type: 'input',
      name: 'done',
      message: '\nTekan Enter untuk kembali ke menu utama...'
    }
  ]);
}

module.exports = removeDuplicate;
