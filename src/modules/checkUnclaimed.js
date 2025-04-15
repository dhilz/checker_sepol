require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readlineSync = require('readline-sync');
const colors = require('colors');
const { progressBar } = require('../utils/progressBar');

const RESULT_FILE = path.join(__dirname, '../../result/result_eligibility.txt');
const RESULT_CLAIMED_FILE = path.join(__dirname, '../../result/result_claimed.txt');
const RESULT_UNCLAIMED_FILE = path.join(__dirname, '../../result/result_unclaimed.txt');
const RESULT_ERROR_FILE = path.join(__dirname, '../../result/error_check.txt');

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS.toLowerCase();

async function isClaimed(address) {
    const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    try {
        const response = await axios.get(url);
        const transactions = response.data.result;

        if (!transactions || !Array.isArray(transactions)) {
            throw new Error('Invalid response from Etherscan');
        }

        for (const tx of transactions) {
            if (tx.to && tx.to.toLowerCase() === CONTRACT_ADDRESS && tx.value === "0") {
                return { claimed: true, txHash: tx.hash };
            }
        }

        return { claimed: false, txHash: null };
    } catch (error) {
        throw new Error(error.message || 'Unknown error during claim check');
    }
}

async function checkUnclaimed() {
    console.clear();

    if (!fs.existsSync(RESULT_FILE)) {
        console.error("❌ Eligibility result file not found!".red.bold);
        return;
    }

    const lines = fs.readFileSync(RESULT_FILE, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const eligibleAddresses = lines.map(line => {
        const [address, key] = line.split('|').map(item => item.trim());
        if (!address || !key) return null;
        return { address, key };
    }).filter(Boolean);

    if (eligibleAddresses.length === 0) {
        console.error("❌ No valid address|key entries found.".red.bold);
        return;
    }

    [RESULT_CLAIMED_FILE, RESULT_UNCLAIMED_FILE, RESULT_ERROR_FILE].forEach(file => {
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    let total = eligibleAddresses.length;
    let processed = 0;
    let claimedCount = 0;
    let unclaimedCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    for (const { address, key } of eligibleAddresses) {
        let statusText = '';

        try {
            const { claimed, txHash } = await isClaimed(address);

            if (claimed) {
                claimedCount++;
                fs.appendFileSync(RESULT_CLAIMED_FILE, `${address}|${key}|${txHash}\n`);
                statusText = `Claimed`;
            } else {
                unclaimedCount++;
                fs.appendFileSync(RESULT_UNCLAIMED_FILE, `${address}|${key}\n`);
                statusText = `Unclaimed`;
            }
        } catch (err) {
            errorCount++;
            fs.appendFileSync(RESULT_ERROR_FILE, `${address}|${key}|${err.message}\n`);
            statusText = `Error: ${err.message}`;
        }

        processed++;
        const percent = (processed / total) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const eta = elapsed / processed * (total - processed);
        const etaMinutes = Math.floor(eta / 60);

        // Update progress in one line
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
            `${progressBar(percent)} ${percent.toFixed(1)}% | ETA: ${etaMinutes}Mnt | ${processed}/${total} | ` +
            `Claimed: ${claimedCount} | Unclaimed: ${unclaimedCount} | Errors: ${errorCount} | ${statusText}`
        );
    }

    console.log("\n\n🎯 Selesai scan semua address!".green.bold);
    console.log(`- Claimed saved to: ${'result/result_claimed.txt'.cyan}`);
    console.log(`- Unclaimed saved to: ${'result/result_unclaimed.txt'.cyan}`);
    console.log(`- Errors saved to: ${'result/error_check.txt'.cyan}`);
    console.log(`Summary: Claimed: ${claimedCount} | Unclaimed: ${unclaimedCount} | Errors: ${errorCount}`);

    const userChoice = readlineSync.question('\n🔄 Kembali ke menu? (y/n): ');
    if (userChoice.toLowerCase() === 'y') {
        console.log('Returning to main menu...'.yellow);
        // panggil menu utama di sini kalau ada
    } else {
        console.log('Exiting...'.yellow);
        process.exit();
    }
}

module.exports = checkUnclaimed;
