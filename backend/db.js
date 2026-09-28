const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readDB(name) {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeDB(name, data) {
    const file = path.join(DATA_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { readDB, writeDB, genId };
