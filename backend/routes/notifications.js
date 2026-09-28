/**
 * JANSANKET — Notification Routes
 */
const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

// GET notifications for a user
router.get('/:userId', (req, res) => {
    const notifs = readDB('notifications')
        .filter(n => n.userId === req.params.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifs);
});

// GET unread count
router.get('/:userId/unread-count', (req, res) => {
    const count = readDB('notifications').filter(n => n.userId === req.params.userId && !n.read).length;
    res.json({ count });
});

// PATCH mark one read
router.patch('/:id/read', (req, res) => {
    const all = readDB('notifications').map(n => n.id === req.params.id ? { ...n, read: true } : n);
    writeDB('notifications', all);
    res.json({ ok: true });
});

// PATCH mark all read for user
router.patch('/mark-all/:userId', (req, res) => {
    const all = readDB('notifications').map(n => n.userId === req.params.userId ? { ...n, read: true } : n);
    writeDB('notifications', all);
    res.json({ ok: true });
});

module.exports = router;
