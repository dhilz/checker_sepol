// src/modules/createProof.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { Wallet } = require('ethers');
const ora = require('ora');
const inquirer = require('inquirer');

dotenv.config();

const BASE_DIR = path.resolve(__dirname, '../../');
const LEAVES_FILE = path.join(__dirname, '../data/eligibility_list.txt'); // File alamat klaim
const LIST_FILE = path.join(BASE_DIR, 'result/result_unclaimed.txt');     // File dengan format address|mnemonic/private key
const PROOF_FILE = path.join(BASE_DIR, 'result/proofs.txt');              // Output

function logToFile(file, content) {
  fs.appendFileSync(file, content + '\n', 'utf-8');
}

async function createProof() {
  try {
    const spinner = ora('Membaca data...').start();

    // Baca leaves (alamat yang valid)
    const leaves = fs.readFileSync(LEAVES_FILE, 'utf-8')
      .split(',')
      .map(a => a.trim().toLowerCase())
      .map(a => keccak256(a));

    // Baca file address|mnemonic/private key
    const lines = fs.readFileSync(LIST_FILE, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    spinner.succeed('Data berhasil dibaca. Memproses proof...');

    let success = 0, failed = 0;

    for (const line of lines) {
      try {
        const [addressRaw, key] = line.split('|');
        const address = addressRaw.trim().toLowerCase();

        const leaf = keccak256(address);
        const proof = tree.getHexProof(leaf);

        if (proof.length === 0) {
          console.log(`❌ ${address} | Proof tidak ditemukan`);
          failed++;
        } else {
          console.log(`✅ ${address} | Proof ditemukan`);
          logToFile(PROOF_FILE, `${address}|${proof.join(',')}`);
          success++;
        }
      } catch (err) {
        console.log(`⚠️ ${line} | Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n🔎 Proof selesai. ${success} berhasil, ${failed} gagal.`);
  } catch (err) {
    console.error(`❌ Gagal membuat proof: ${err.message}`);
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'back',
      message: '\nTekan Enter untuk kembali ke menu utama...'
    }
  ]);
}

module.exports = createProof;
