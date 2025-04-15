function clearTerminal() {
    process.stdout.write('\x1Bc'); // Clear screen command for most terminals
}

module.exports = { clearTerminal };
