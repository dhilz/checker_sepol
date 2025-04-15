const fs = require('fs');
const readlineSync = require('readline-sync');
const { progressBar } = require('../utils/progressBar'); // Pastikan Anda memiliki progressBar yang benar

async function extractData() {
    try {
        // Clear the terminal screen
        process.stdout.write("\x1b[2J\x1b[0f");

        console.log('🔄 Memulai ekstraksi data...');

        const sourceFile = readlineSync.question('Masukkan nama file sumber: ');
        const delimiter = readlineSync.question('Masukkan pemisah data (contoh: "|", ",", ":") : ');
        const index = parseInt(readlineSync.question('Masukkan index data yang ingin diambil (0 untuk pertama, 1 untuk kedua, dst): '));
        const outputFile = readlineSync.question('Masukkan nama file result: ');

        // Memeriksa apakah file sumber ada
        if (!fs.existsSync(sourceFile)) {
            console.log('❌ File sumber tidak ditemukan!');
            return; // Jika file tidak ditemukan, kembali ke menu
        }

        const data = fs.readFileSync(sourceFile, 'utf-8').split('\n').filter(Boolean);
        const totalLines = data.length;
        let processed = 0;
        const results = [];

        // Proses ekstraksi data
        for (let i = 0; i < totalLines; i++) {
            const line = data[i];
            const splitData = line.split(delimiter);
            const extractedValue = splitData[index] || '';

            // Hanya simpan jika ada nilai yang diekstrak
            if (extractedValue) {
                results.push(extractedValue);
            }

            processed++;

            // Update progres bar setiap baris diproses
            const percent = (processed / totalLines) * 100;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(progressBar(percent) + ` ${percent.toFixed(1)}% | ${processed}/${totalLines} data diproses`);

            // Beri waktu untuk update progress di terminal
            if (processed % 100 === 0) {
                fs.appendFileSync(outputFile, results.join('\n') + '\n');
                results.length = 0; // Kosongkan buffer hasil untuk mencegah penggunaan memori berlebih
            }
        }

        // Tulis sisa data ke file setelah loop selesai
        if (results.length > 0) {
            fs.appendFileSync(outputFile, results.join('\n') + '\n');
        }

        console.log(`\n✅ Ekstraksi selesai. Hasil disimpan di: ${outputFile}`);
    } catch (error) {
        console.error('❌ Terjadi kesalahan:', error.message);
    }
}

module.exports = extractData;
