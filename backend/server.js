/**
 * JANSANKET — Express Backend Server
 * REST API for users, complaints, notifications
 * Data stored in JSON files (no external DB required)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5002;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:4173'] }));
app.use(express.json());

const { readDB, writeDB, genId } = require('./db');

const crypto = require('crypto');
function hashPassword(pass) {
    return crypto.createHash('sha256').update(pass).digest('hex');
}

// ── Seed default admin + authority ───────────────────────────────────────────
function seedDefaults() {
    const users = readDB('users');
    let updated = false;

    let admin = users.find(u => u.voterId === 'ADMIN0001');
    if (!admin) {
        users.push({ id: genId(), voterId: 'ADMIN0001', password: hashPassword('admin123'), name: 'Admin Officer', age: 40, phone: '9000000001', gender: 'male', department: 'Administration', role: 'admin', createdAt: new Date().toISOString() });
        updated = true;
    } else {
        if (!admin.password) { admin.password = hashPassword('admin123'); updated = true; }
        if (!admin.department) { admin.department = 'Administration'; updated = true; }
    }

    let auth = users.find(u => u.voterId === 'AUTH0001');
    if (!auth) {
        users.push({ id: genId(), voterId: 'AUTH0001', password: hashPassword('auth123'), name: 'Municipal Authority', age: 45, phone: '9000000002', gender: 'male', department: 'Information Technology', role: 'authority', createdAt: new Date().toISOString() });
        updated = true;
    } else {
        if (!auth.password) { auth.password = hashPassword('auth123'); updated = true; }
        if (!auth.department) { auth.department = 'Information Technology'; updated = true; }
    }

    if (updated) writeDB('users', users);
}
seedDefaults();

// ── Export helpers for routes ─────────────────────────────────────────────────
module.exports = { readDB, writeDB, genId };

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/locations'));

// ── Serve Static Frontend & Root Route ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({ status: 'ok', message: 'CivicShield Backend API is running', health: '/api/health' });
    }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🛡️  JanSanket API running at http://localhost:${PORT}`);
});
