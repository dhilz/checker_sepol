require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const ora = require('ora'); // Menambahkan spinner untuk log progress
const readlineSync = require('readline-sync'); // Untuk mendapatkan input pengguna

const CREDENTIALS_PATH = path.join(__dirname, '../../config/credentials.json');
// Ganti dengan ID Spreadsheet secara manual
const SPREADSHEET_ID = '1X_Khd1jo5y_aio4Hpt6jHijGtKcqC0YdeMgiHJzbpMs'; // Ganti dengan ID Spreadsheet milik kamu
const OUTPUT_PATH = path.join(__dirname, '../../keys.txt');
const SHEET_NAME = 'KeySource';

async function getKeysFromGoogleSheet() {
    if (!SPREADSHEET_ID) {
        console.log('❌ SPREADSHEET_ID belum terdefinisi');
        return;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spinner = ora('Mengambil data dari Google Sheets...').start(); // Menambahkan spinner progres

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:A`,
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) {
            console.log('❌ Tidak ada data ditemukan di sheet.');
            spinner.fail('Gagal mengambil data, tidak ada data di sheet.');
            return;
        }

        const keys = rows.map(row => row[0].trim()).filter(Boolean);
        fs.writeFileSync(OUTPUT_PATH, keys.join('\n'));
        spinner.succeed(`✅ Berhasil menyimpan ${keys.length} keys ke ${OUTPUT_PATH}`);

        // Menampilkan hasil perincian
        console.log("\n📊 Hasil Pengambilan Data:");
        console.log(`  ✔️ Berhasil mengambil ${keys.length} keys.`);
        console.log(`  🔑 Keys disimpan ke file: ${OUTPUT_PATH}`);

        // Mengarahkan ke menu setelah perincian
        const proceed = readlineSync.question("\nTekan Enter untuk kembali ke menu...");
    } catch (error) {
        spinner.fail('❌ Gagal mengambil data dari Google Sheets');
        console.error('❌ Gagal mengambil data:', error.message);
    }
}

module.exports = getKeysFromGoogleSheet;

if (require.main === module) {
    getKeysFromGoogleSheet();
}
