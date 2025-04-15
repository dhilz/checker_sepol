const fs = require('fs');
const path = require('path');
const ora = require('ora');
const readlineSync = require('readline-sync');
const { Wallet } = require('ethers');
const bip39 = require('bip39');
const colors = require('colors');

const ELIGIBLE_FILE = path.join(__dirname, '../data/eligibility_list.txt');
const OUTPUT_FILE = path.join(__dirname, '../../result/brute_eligibility.txt');

function getRandomPrivateKey() {
  return Wallet.createRandom().privateKey;
}

function getRandomMnemonic() {
  return bip39.generateMnemonic();
}

function logToFile(content) {
  fs.appendFileSync(OUTPUT_FILE, content + '\n', 'utf-8');
}

async function bruteforceEligibility() {
  console.clear();

  if (!fs.existsSync(ELIGIBLE_FILE)) {
    console.log("❌ File eligibility_list.txt tidak ditemukan.".red);
    return;
  }

  const eligibleAddresses = new Set(
    fs.readFileSync(ELIGIBLE_FILE, 'utf8')
      .split(',')
      .map(addr => addr.trim().toLowerCase())
      .filter(Boolean)
  );

  const method = readlineSync.question(
    "\n🔢 Pilih metode generate:\n" +
    "1. Mnemonic\n" +
    "2. Private Key\n" +
    "👉 Pilihan (1/2): "
  );

  const max = parseInt(readlineSync.question("🎯 Masukkan jumlah maksimum hasil eligible yang ingin disimpan: "), 10);

  if (isNaN(max) || max <= 0) {
    console.log("❌ Jumlah maksimum tidak valid!".red);
    return;
  }

  const spinner = ora("🔍 Memulai proses bruteforce...").start();

  let found = 0;
  let totalTried = 0;

  while (found < max) {
    let key, wallet, address, label;

    try {
      if (method === '1') {
        key = getRandomMnemonic();
        wallet = Wallet.fromPhrase(key);
        label = "Mnemonic";
      } else if (method === '2') {
        key = getRandomPrivateKey();
        wallet = new Wallet(key);
        label = "Private Key";
      } else {
        spinner.fail("❌ Pilihan metode tidak valid.");
        return;
      }

      address = wallet.address.toLowerCase();
      totalTried++;

      if (eligibleAddresses.has(address)) {
        logToFile(`${address}|${key}`);
        console.log(`✅ ${address} | ${label} cocok`);
        found++;
      } else {
        console.log(`❌ ${address} | Tidak eligible`);
      }

    } catch (err) {
      console.log(`🛑 Error: ${err.message}`);
    }
  }

  spinner.succeed(`🎉 Selesai! Ditemukan ${found} alamat eligible dari ${totalTried} percobaan.`);
  console.log(`📄 Disimpan di: result/brute_eligibility.txt\n`.cyan);
}

module.exports = bruteforceEligibility;
