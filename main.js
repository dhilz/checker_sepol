require('dotenv').config();
const readlineSync = require('readline-sync');
const figlet = require('figlet');
const gradient = require('gradient-string');
const ora = require('ora');
const fs = require('fs');
const path = require('path');

const checkEligibility = require('./src/modules/checkEligibility');
const checkUnclaimed = require('./src/modules/checkUnclaimed');
const extractData = require('./src/modules/extractData');
const prompSpliter = require('./src/modules/prompSpliter');
const removeDuplicate = require('./src/modules/removeDuplicate');
const createProof = require('./src/modules/createProof');
const extractSmart = require('./src/modules/extractSmart');
const bruteforceEligibility = require('./src/modules/bruteforceEligibility');
const convertMnemonic = require('./src/modules/convertMnemonic');
const getKeysFromGoogleSheet = require('./src/modules/getKey'); // ✅ Get Key
const uploadResultsToSheet = require('./src/modules/uploadResult'); // ✅ Upload Result
const { clearTerminal } = require('./src/utils/clearTerminal');

async function showMenu() {
  try {
    clearTerminal();

    console.log(
      gradient.pastel.multiline(
        figlet.textSync('Mr Dilz Scanner', {
          font: 'Standard',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        })
      )
    );

    console.log("\n✨ Selamat datang di Checker Sepolia ✨\n");

    // Elegant, clean menu design
    console.log("📜 Menu:");
    console.log("    ╔══════════════════════════════════════════════════════════════╗");
    console.log("    ║                        🔧 Pilih Aksi                         ║");
    console.log("    ╠════╦═════════════════════════════════════════════════════════╣");
    console.log("    ║ 01 ║ Check Eligibility                                       ║");
    console.log("    ║ 02 ║ Check Unclaimed                                         ║");
    console.log("    ║ 03 ║ Buat Proof Merkle                                       ║");
    console.log("    ║ 04 ║ Get Key dari Google Sheet                               ║");
    console.log("    ║ 05 ║ Upload Result ke Google Sheet                           ║");
    console.log("    ║ 06 ║ Extract Data                                            ║");
    console.log("    ║ 07 ║ Extract Smart Mnemonic/Private Key                      ║");
    console.log("    ║ 08 ║ Reset Konfigurasi (Hapus file result)                   ║");
    console.log("    ║ 09 ║ Split File Mnemonic / Private Key                       ║");
    console.log("    ║ 10 ║ Hapus Duplikat File                                     ║");
    console.log("    ║ 11 ║ Bruteforce Mnemonic / Private Key (Eligible Hunter)     ║");
    console.log("    ║ 12 ║ Convert Mnemonic ke Private Key                         ║");
    console.log("    ║ 00 ║ Keluar                                                  ║");
    console.log("    ╚════╩═════════════════════════════════════════════════════════╝\n");

    const choice = readlineSync.question("👉 Pilih opsi (0-12): ");

    const spinner = ora('Menyiapkan modul...').start();
    await new Promise(res => setTimeout(res, 1000));
    spinner.succeed('Modul siap!');

    switch (choice) {
      case '1':
        await checkEligibility();
        break;
      case '2':
        await checkUnclaimed();
        break;
      case '3':
        await createProof();
        break;
      case '4':
        await getKeysFromGoogleSheet(); // ✅ Get Key
        break;
      case '5':
        await uploadResultsToSheet(); // ✅ Upload Result
        break;
      case '6':
        await extractData();
        break;
      case '7': {
        const fileName = readlineSync.question('📂 Masukkan nama file input: ');
        const filePath = path.join(__dirname, fileName);
        extractSmart(filePath);
        break;
      }
      case '8':
        await resetConfiguration();
        break;
      case '9':
        await prompSpliter();
        break;
      case '10':
        await removeDuplicate();
        break;
      case '11':
        await bruteforceEligibility();
        break;
      case '12':
        await convertMnemonic();
        break;
      case '0':
        console.log("\n👋 Sampai jumpa! Terima kasih sudah menggunakan Mr Dilz Scanner!");
        process.exit();
        break;
      default:
        console.log("❌ Opsi tidak valid. Coba lagi ya!");
        break;
    }

    await showMenu();
  } catch (error) {
    console.error(`🔥 Error: ${error.message}`);
    await showMenu();
  }
}

async function resetConfiguration() {
  try {
    const filesToDelete = [
      'result/result_eligibility.txt',
      'result/last_scan.txt',
      'result/error_check.txt',
      'result/result_claimed.txt',
      'result/proofs.txt'
    ];

    const spinner = ora('Menghapus file...').start();

    for (const file of filesToDelete) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File ${file} berhasil dihapus.`);
      } else {
        console.log(`⚠️ File ${file} tidak ditemukan.`);
      }
    }

    spinner.succeed('Konfigurasi berhasil direset!');
  } catch (error) {
    console.error(`❌ Gagal mereset konfigurasi: ${error.message}`);
  }
}

showMenu();
