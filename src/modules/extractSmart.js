const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const colors = require('colors');

function extractSmart(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        let extracted = [];

        // Coba parse JSON array
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            const fixed = fixPythonDumpFormat(raw);
            data = JSON.parse(fixed);
        }

        for (const item of data) {
            if (item.mnemonic) {
                const normalized = item.mnemonic.trim().replace(/\s+/g, ' ');
                extracted.push(normalized);
            } else if (item.privateKey) {
                extracted.push(item.privateKey.trim());
            }
        }

        if (!extracted.length) {
            console.log("❌ Tidak ditemukan mnemonic atau private key di dalam file.".red);
            readlineSync.question('\nTekan Enter untuk kembali ke menu...');
            return;
        }

        const savePath = path.join(__dirname, '../../result/smart_extracted_keys.txt');
        fs.writeFileSync(savePath, extracted.join('\n'));
        console.log(`\n✅ Berhasil mengekstrak ${extracted.length} key!`.green);
        console.log(`📁 Disimpan di: ${savePath}`.cyan);

        readlineSync.question('\n✅ Tekan Enter untuk kembali ke menu...');

    } catch (err) {
        console.error(`❌ Gagal mengekstrak: ${err.message}`.red);
        readlineSync.question('\nTekan Enter untuk kembali ke menu...');
    }
}

function fixPythonDumpFormat(text) {
    text = text.replace(/'\s*([\r\n]+)\s*'/g, ' ');
    text = text.replace(/'\s{2,}/g, "' ");

    let jsonReady = text
        .replace(/'/g, '"')
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');

    if (!jsonReady.trim().startsWith('[')) {
        jsonReady = `[${jsonReady}`;
    }

    if (!jsonReady.trim().endsWith(']')) {
        jsonReady = `${jsonReady}]`;
    }

    return jsonReady;
}

module.exports = extractSmart;
