/**
 * JANSANKET — Backend Auth Routes with Terminal OTP & Location Verification
 * POST /api/auth/send-otp
 * POST /api/auth/verify-otp
 * POST /api/auth/register
 * POST /api/auth/login
 * PUT  /api/auth/profile
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { readDB, writeDB, genId } = require('../db');
const { validateStateDistrictPair } = require('./locations');

function hashPassword(pass) {
    if (!pass) return '';
    return crypto.createHash('sha256').update(pass).digest('hex');
}

function validateVoterId(vid) {
    if (!vid) return false;
    const clean = vid.trim().toUpperCase();
    return /^[A-Z]{3}[0-9]{7}$/.test(clean) ||
        /^ADMIN\d{4}$/.test(clean) ||
        /^AUTH\d{4}$/.test(clean) ||
        /^PUB\d+$/.test(clean);
}

// Memory OTP Store (Phone -> { otp, expiresAt, verified })
const otpStore = new Map();

// ── Send OTP Endpoint ─────────────────────────────────────────────────────────
router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(phone, { otp, expiresAt, verified: false });

    // Print OTP prominently to the terminal console as requested
    console.log('\n============================================================');
    console.log('🔑 [CIVICSHIELD TERMINAL OTP GENERATED]');
    console.log(`   Phone Number : ${phone}`);
    console.log(`   Verification OTP : ${otp}`);
    console.log('   (Enter this exact 6-digit code in the login/signup form)');
    console.log('============================================================\n');

    res.json({
        success: true,
        message: `OTP sent to terminal console for mobile ${phone}. Please check your terminal output!`,
        phone
    });
});

// ── Verify OTP Endpoint ───────────────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    const record = otpStore.get(phone);
    if (!record) {
        return res.status(400).json({ error: 'No OTP requested for this phone number. Click "Send OTP" first.' });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return res.status(400).json({ error: 'OTP expired. Please click Send OTP to get a new code.' });
    }

    if (record.otp !== otp.trim()) {
        console.log(`⚠️ [OTP REJECTED] Phone: ${phone} | Provided: "${otp.trim()}" | Expected Terminal OTP: "${record.otp}"`);
        return res.status(400).json({ error: 'Invalid OTP code! Only the OTP printed in the terminal will work.' });
    }

    record.verified = true;
    otpStore.set(phone, record);

    console.log(`✅ [OTP VERIFIED SUCCESS] Phone: ${phone} matched terminal OTP.`);
    res.json({ success: true, verified: true, message: 'OTP verified successfully!' });
});

// ── Register Endpoint ─────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
    const { 
        userType = 'public', 
        voterId, 
        password, 
        name, 
        age, 
        phone, 
        email, 
        state, 
        district, 
        gender, 
        department, 
        otp,
        stateCode: reqStateCode, 
        districtCode: reqDistrictCode 
    } = req.body;

    const targetState = reqStateCode || state;
    const targetDistrict = reqDistrictCode || district;

    if (!password || !name || !phone) {
        return res.status(400).json({ error: 'Full Name, phone number, and password are required' });
    }
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }
    if (!targetState) {
        return res.status(400).json({ error: 'Please select a State or Union Territory.' });
    }
    if (!targetDistrict) {
        return res.status(400).json({ error: 'Select District is required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // OTP Enforcement
    const otpRecord = otpStore.get(phone);
    if (!otpRecord) {
        return res.status(400).json({ error: 'OTP verification required. Please click "Send OTP" and check the terminal console.' });
    }
    if (!otpRecord.verified && (!otp || otp.trim() !== otpRecord.otp)) {
        return res.status(400).json({ error: 'Invalid OTP code. Please enter the 6-digit OTP printed in the terminal console.' });
    }

    // Validate that district belongs to state
    const validation = validateStateDistrictPair(targetState, targetDistrict);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
    }

    const finalVoterId = (voterId && voterId.trim().length > 0)
        ? voterId.trim().toUpperCase()
        : ('PUB' + phone.slice(-7));

    const users = readDB('users');
    const existingIdx = users.findIndex(u => (u.voterId && u.voterId.toUpperCase() === finalVoterId) || u.phone === phone);

    let user;
    if (existingIdx !== -1) {
        // Upsert existing account
        users[existingIdx] = {
            ...users[existingIdx],
            userType: userType || 'public',
            voterId: finalVoterId,
            password: hashPassword(password),
            name,
            phone,
            email: email || users[existingIdx].email || '',
            state: validation.stateName,
            stateCode: validation.stateCode,
            district: validation.districtName,
            districtCode: validation.districtCode,
            department: department || users[existingIdx].department || 'Public Works Department (PWD)',
            updatedAt: new Date().toISOString()
        };
        user = users[existingIdx];
        writeDB('users', users);
        console.log(`👤 [USER ACCOUNT UPDATED] Name: ${name} | Voter ID: ${finalVoterId} | State: ${validation.stateName} | District: ${validation.districtName}`);
    } else {
        // Create new user account
        user = {
            id: genId(),
            userType: userType || 'public',
            voterId: finalVoterId,
            employeeId: req.body.employeeId || '',
            designation: req.body.designation || '',
            officeLevel: req.body.officeLevel || '',
            password: hashPassword(password),
            name,
            age: age ? parseInt(age) : 25,
            phone,
            email: email || '',
            state: validation.stateName,
            stateCode: validation.stateCode,
            district: validation.districtName,
            districtCode: validation.districtCode,
            gender: gender || 'male',
            department: department || 'Public Works Department (PWD)',
            role: userType === 'official' ? 'authority' : userType === 'admin' ? 'admin' : 'citizen',
            approved: userType === 'official' ? false : true,
            createdAt: new Date().toISOString(),
        };
        users.push(user);
        writeDB('users', users);
        console.log(`👤 [NEW USER REGISTERED] Name: ${name} | Voter ID: ${finalVoterId} | State: ${validation.stateName} | District: ${validation.districtName}`);
    }

    // Clean up OTP record
    otpStore.delete(phone);

    const { password: _, ...userWithoutPass } = user;
    res.status(201).json({ user: userWithoutPass, message: 'Account registered successfully!' });
});

// ── Login Endpoint ────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { voterId, password, phone, otp } = req.body;

    const users = readDB('users');
    let user = null;

    // Login via Voter ID + Password
    if (voterId) {
        const cleanVoterId = voterId.trim().toUpperCase();
        user = users.find(u => u.voterId === cleanVoterId || u.phone === voterId);
        
        if (!user) {
            return res.status(404).json({ error: 'Voter ID or phone not registered. Please register first.' });
        }

        if (password) {
            if (user.password && hashPassword(password) !== user.password) {
                return res.status(401).json({ error: 'Incorrect password' });
            } else if (!user.password) {
                user.password = hashPassword(password);
                writeDB('users', users);
            }
        }
    } 
    // Login via Phone + OTP
    else if (phone && otp) {
        user = users.find(u => u.phone === phone);
        if (!user) {
            return res.status(404).json({ error: 'Phone number not registered. Please register first.' });
        }

        const otpRecord = otpStore.get(phone);
        if (!otpRecord || otpRecord.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Invalid OTP code. Please check the terminal output for the correct OTP.' });
        }
        otpStore.delete(phone);
    } else {
        return res.status(400).json({ error: 'Please enter your Voter ID and password' });
    }

    console.log(`🔓 [LOGIN SUCCESSFUL] User: ${user.name} (${user.voterId}) | Role: ${user.role}`);

    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass, message: 'Login successful' });
});

// ── Update Profile ────────────────────────────────────────────────────────────
router.put('/profile/:id', (req, res) => {
    const { name, age, phone, gender } = req.body;
    const users = readDB('users');
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    users[idx] = { ...users[idx], name, age: parseInt(age), phone, gender };
    writeDB('users', users);
    res.json({ user: users[idx] });
});

module.exports = router;
