const fs = require('fs');
const path = require('path');
const ora = require('ora');
const readlineSync = require('readline-sync');
const { HDNodeWallet } = require('ethers'); // Import eksplisit jika perlu

async function convertMnemonic() {
  try {
    const inputPath = readlineSync.question('🧠 Masukkan path file yang berisi mnemonic (satu per baris): ');
    const fullPath = path.resolve(inputPath);

    if (!fs.existsSync(fullPath)) {
      console.log('❌ File tidak ditemukan!');
      readlineSync.question('\nTekan Enter untuk kembali ke menu...');
      return;
    }

    const mnemonics = fs.readFileSync(fullPath, 'utf-8')
      .split('\n')
      .map(line => line.trim().replace(/\s+/g, ' '))
      .filter(line => line.length > 0);

    const outputDir = path.join(__dirname, '../../result');
    const outputFile = path.join(outputDir, 'converted.txt');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const spinner = ora('🔄 Mengonversi mnemonic ke private key...').start();

    const converted = [];

    for (const mnemonic of mnemonics) {
      try {
        const wallet = HDNodeWallet.fromPhrase(mnemonic);
        converted.push(`${wallet.address}|${wallet.privateKey}`);
      } catch (err) {
        console.log(`⚠️ Gagal konversi mnemonic:\n"${mnemonic}"\nAlasan: ${err.message}`);
      }
    }

    fs.writeFileSync(outputFile, converted.join('\n'), 'utf-8');
    spinner.succeed('✅ Konversi selesai!');

    console.log(`\n📄 Total berhasil dikonversi: ${converted.length}`);
    console.log(`📁 Disimpan di: result/converted.txt`);
    readlineSync.question('\n✅ Tekan Enter untuk kembali ke menu...');
  } catch (err) {
    console.error(`🔥 Terjadi kesalahan: ${err.message}`);
    readlineSync.question('\nTekan Enter untuk kembali ke menu...');
  }
}

module.exports = convertMnemonic;
