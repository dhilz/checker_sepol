const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const { ethers } = require('ethers');
const { progressBar } = require('../utils/progressBar');
const colors = require('colors');
const axios = require('axios');

const ELIGIBLE_URL = "https://grabteeth.xyz/combined_qualifying_addresses_Nov15.txt";
const ELIGIBLE_FILE = path.join(__dirname, '../data/eligibility_list.txt');
const RESULT_DIR = path.join(__dirname, '../../result');
const OUTPUT_FILE = path.join(RESULT_DIR, 'result_eligibility.txt');
const LAST_SCAN_FILE = path.join(RESULT_DIR, 'last_scan.txt'); // Tempat untuk menyimpan informasi scan terakhir

let startIndex = 0; // Index untuk resume

const provider = new ethers.JsonRpcProvider(process.env.ETH_SEPOLIA_2);

async function downloadEligibilityList() {
    try {
        console.log("📥 Mengunduh daftar eligible dari server...");
        const response = await axios.get(ELIGIBLE_URL);
        fs.writeFileSync(ELIGIBLE_FILE, response.data);
        console.log("✅ Daftar eligible berhasil diunduh dan disimpan.");
    } catch (error) {
        console.error("❌ Gagal mengunduh daftar eligible:", error.message);
        process.exit(1);
    }
}

async function checkEligibility() {
    process.stdout.write("\x1b[2J\x1b[0f"); // Clear the terminal screen

    if (!fs.existsSync(ELIGIBLE_FILE)) {
        await downloadEligibilityList();
    }

    const eligibleAddresses = new Set(
        fs.readFileSync(ELIGIBLE_FILE, 'utf8')
            .split(",")
            .map(addr => addr.trim().toLowerCase())
            .filter(Boolean)
    );

    if (!fs.existsSync(RESULT_DIR)) {
        fs.mkdirSync(RESULT_DIR);
    }

    let fileName = "";
    let filePath = "";
    let keys = [];

    // Mengecek apakah ada file resume sebelumnya
    if (fs.existsSync(LAST_SCAN_FILE)) {
        const lastScanData = fs.readFileSync(LAST_SCAN_FILE, 'utf8').trim();
        if (lastScanData) {
            const [savedFileName, lastProcessedIndex] = lastScanData.split('\n');
            fileName = savedFileName.trim();

            const userChoice = readlineSync.question(
                `\n✅ Ada file scan sebelumnya (${fileName})\n` +
                `Apakah Anda ingin melanjutkan scan atau memulai scan baru?\n` +
                `1. Resume Scan\n2. New Scan\nPilihan (1/2): `
            );

            if (userChoice === '1') {
                console.log(`Melanjutkan scan dari file ${fileName} 📝`);
                filePath = path.join(__dirname, '../../', fileName);

                keys = fs.readFileSync(filePath, 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
                startIndex = lastProcessedIndex ? parseInt(lastProcessedIndex, 10) : 0;
            } else if (userChoice === '2') {
                console.log('Memulai scan baru...'.yellow);
                keys = await promptForFile();
            }
        }
    }

    if (!keys.length) {
        keys = await promptForFile();
    }

    const totalKeys = keys.length;
    let processed = startIndex;
    let eligibleCount = 0;
    let notEligibleCount = 0;
    let invalidCount = 0;
    const startTime = Date.now();

    for (let i = startIndex; i < totalKeys; i++) {
        const key = keys[i];
        let address = "";
        let statusText = "";

        try {
            const wallet = key.split(' ').length > 1 ? ethers.Wallet.fromPhrase(key) : new ethers.Wallet(key);
            address = wallet.address.toLowerCase();
        } catch (err) {
            invalidCount++;
            address = "Invalid Key 🔥";
            statusText = "🛑 Invalid".red;
            continue;
        }

        const isEligible = eligibleAddresses.has(address);

        if (address !== "Invalid Key 🔥") {
            if (isEligible) {
                eligibleCount++;
                fs.appendFileSync(OUTPUT_FILE, `${address}|${key}\n`);
                statusText = "✅ Eligible".green;
            } else {
                notEligibleCount++;
                statusText = "❌ Tidak Eligible".yellow;
            }
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const percent = ((i + 1) / totalKeys) * 100;
        const eta = elapsed / (i + 1) * (totalKeys - (i + 1));
        const etaMinutes = Math.floor(eta / 60);

        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
            progressBar(percent) + 
            ` ${percent.toFixed(1)}% | ETA: ${etaMinutes}mnt | ${i + 1}/${totalKeys} | ` +
            `✅ ${eligibleCount} | ❌ ${notEligibleCount} | 🛑 ${invalidCount} | ` +
            `${address} ${statusText}`
        );

        fs.writeFileSync(LAST_SCAN_FILE, `${fileName}\n${i + 1}`);

        processed++;
    }

    console.log("\n\n🎉🎉🎉 Selesai memeriksa eligibility! 🎉".green.bold);
    console.log(`📄 Hasil disimpan di: /result/result_eligibility.txt`.cyan);
    console.log(`📊 Ringkasan: ✅ ${eligibleCount} Eligible | ❌ ${notEligibleCount} Tidak Eligible | 🛑 ${invalidCount} Invalid`.yellow);
}

async function promptForFile() {
    let keys = [];
    while (true) {
        let fileName = readlineSync.question("📄 Masukkan nama file mnemonic/private key (contoh: keys.txt): ");
        let filePath = path.join(__dirname, '../../', fileName);

        if (!fs.existsSync(filePath)) {
            console.log("❌ File tidak ditemukan. Coba lagi.\n".red);
        } else {
            const rawKeys = fs.readFileSync(filePath, 'utf8')
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            const uniqueKeys = [...new Set(rawKeys)];
            const removed = rawKeys.length - uniqueKeys.length;

            if (removed > 0) {
                console.log(`🧹 Ditemukan dan dibuang ${removed} duplikat, total kunci unik: ${uniqueKeys.length}\n`.yellow);
            }

            keys = uniqueKeys;
            break;
        }
    }
    return keys;
}

module.exports = checkEligibility;

if (require.main === module) {
    checkEligibility();
}
