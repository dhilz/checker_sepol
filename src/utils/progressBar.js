const colors = require('colors');

function progressBar(percent, size = 30) {
    const filledLength = Math.round(size * percent / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(size - filledLength);

    let coloredBar = '';

    if (percent < 30) {
        coloredBar = bar.red;
    } else if (percent < 70) {
        coloredBar = bar.yellow;
    } else {
        coloredBar = bar.green;
    }

    return `[${coloredBar}]`;
}

module.exports = { progressBar };
