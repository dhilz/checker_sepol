require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const ora = require('ora'); // Menambahkan spinner untuk log progress
const readlineSync = require('readline-sync'); // Untuk mendapatkan input pengguna

const CREDENTIALS_PATH = path.join(__dirname, '../../config/credentials.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const FILES_TO_UPLOAD = [
    { file: 'result_eligibility.txt', sheet: 'Eligibility' },
    { file: 'result_unclaimed.txt', sheet: 'Unclaimed' },
    { file: 'proofs.txt', sheet: 'Proofs' },
];

async function uploadResultsToSheet() {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spinner = ora('Mengupload data ke Google Sheets...').start(); // Menambahkan spinner progress

    let successCount = 0;
    let failureCount = 0;

    for (const { file, sheet } of FILES_TO_UPLOAD) {
        const filePath = path.join(__dirname, '../../result', file);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ File tidak ditemukan: ${file}`);
            failureCount++;
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map(line => line.split('|').map(col => col.trim()));

        if (content.length === 0) {
            console.log(`⚠️ File kosong: ${file}`);
            failureCount++;
            continue;
        }

        const headers = ['Address', 'Key / Mnemonic / Proof'];
        const values = [headers, ...content];

        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sheet}!A1`,
                valueInputOption: 'RAW',
                requestBody: { values },
            });
            console.log(`✅ ${file} berhasil diupload ke sheet "${sheet}"`);
            successCount++;
        } catch (err) {
            console.log(`❌ Gagal mengupload ${file} ke sheet "${sheet}":`, err.message);
            failureCount++;
        }
    }

    spinner.succeed('Upload selesai!'); // Spinner berhenti setelah selesai

    // Menampilkan perincian hasil upload
    console.log("\n📊 Hasil Upload:");
    console.log(`  ✔️ Berhasil upload: ${successCount} file`);
    console.log(`  ❌ Gagal upload: ${failureCount} file`);

    // Mengarahkan ke menu setelah perincian
    const proceed = readlineSync.question("\nTekan Enter untuk kembali ke menu...");
}

module.exports = uploadResultsToSheet;

if (require.main === module) {
    uploadResultsToSheet();
}
