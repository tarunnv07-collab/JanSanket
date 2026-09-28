/**
 * JANSANKET — Auth Module
 * Voter ID registration, login, terminal OTP, profile updates
 */

import { UserStore, Session, seedDefaults, NotifStore } from './store.js';
import { showToast } from './notification.js';

// ── Voter ID Validation ───────────────────────────────────────────────────────
export function validateVoterId(vid) {
    if (!vid) return false;
    return /^[A-Za-z]{3}[0-9]{7}$/.test(vid.trim()) ||
        /^ADMIN\d{4}$/.test(vid.trim()) ||
        /^AUTH\d{4}$/.test(vid.trim()) ||
        /^PUB\d+$/.test(vid.trim());
}

export function getAnonymousId(voterId) {
    return 'unknown' + voterId.slice(-4).toUpperCase();
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const userType = document.getElementById('userType') ? document.getElementById('userType').value : 'public';
    const name = document.getElementById('name').value.trim();
    const voterIdInput = document.getElementById('voterId');
    const voterId = voterIdInput ? voterIdInput.value.trim().toUpperCase() : '';
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const state = document.getElementById('state') ? document.getElementById('state').value.trim() : '';
    const district = document.getElementById('district') ? document.getElementById('district').value.trim() : '';
    const pass = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput ? otpInput.value.trim() : '';

    let valid = true;

    if (!name) { setError('nameErr', 'Full Name is required'); valid = false; }
    if (voterIdInput && !voterId) { setError('voterIdErr', 'Voter ID Number is required'); valid = false; }
    if (!/^\d{10}$/.test(phone)) { setError('phoneErr', 'Enter a valid 10-digit mobile number'); valid = false; }
    if (email && !/\S+@\S+\.\S+/.test(email)) { setError('emailErr', 'Enter a valid email address'); valid = false; }
    if (!state) { setError('stateErr', 'Please select a State or Union Territory.'); valid = false; }
    if (!district) { setError('districtErr', 'District is required'); valid = false; }
    if (pass.length < 6) { setError('passErr', 'Password must be at least 6 characters'); valid = false; }
    if (pass !== confirm) { setError('confirmErr', 'Passwords do not match'); valid = false; }

    if (userType === 'public' && (!otp || otp.length !== 6)) {
        setError('otpErr', 'Please enter the 6-digit OTP code printed in the terminal');
        valid = false;
    }

    if (!valid) return;

    try {
        const payload = {
            userType,
            voterId,
            name,
            phone,
            email,
            state,
            district,
            password: pass,
            otp,
            employeeId: document.getElementById('employeeId') ? document.getElementById('employeeId').value.trim() : '',
            designation: document.getElementById('designation') ? document.getElementById('designation').value.trim() : '',
            department: document.getElementById('department') ? document.getElementById('department').value : 'Public Works Department (PWD)',
            officeLevel: document.getElementById('officeLevel') ? document.getElementById('officeLevel').value : ''
        };

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.error && data.error.includes('OTP')) {
                setError('otpErr', data.error);
            } else if (data.error && data.error.includes('Phone')) {
                setError('phoneErr', data.error);
            } else {
                showToast({ title: 'Registration Failed', message: data.error || 'Server error', type: 'error' });
            }
            return;
        }

        // Save local session & user store
        seedDefaults();
        const user = UserStore.create(data.user);
        Session.set(user);

        NotifStore.push(user.id, {
            title: 'Welcome to JanSanket!',
            desc: 'Your account has been created successfully.',
            type: 'success',
        });

        showToast({ title: 'Registration Successful', message: `Welcome, ${name}!`, type: 'success' });
        setTimeout(() => window.location.href = 'dashboard.html', 1000);

    } catch (err) {
        showToast({ title: 'Connection Error', message: 'Unable to reach backend auth service', type: 'error' });
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const voterId = document.getElementById('voterId').value.trim();
    const passwordEl = document.getElementById('password');
    const password = passwordEl ? passwordEl.value : '';

    let valid = true;
    if (!voterId) { setError('voterIdErr', 'Voter ID is required'); valid = false; }
    if (!password) { setError('passErr', 'Password is required'); valid = false; }
    if (!valid) return;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voterId, password })
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.error && data.error.includes('password')) {
                setError('passErr', data.error);
            } else {
                setError('voterIdErr', data.error || 'Login failed');
            }
            return;
        }

        seedDefaults();
        const user = UserStore.create(data.user);
        Session.set(user);

        const dest = user.role === 'admin' ? 'admin.html'
            : user.role === 'authority' ? 'authority.html'
                : 'dashboard.html';

        showToast({ title: 'Login Successful', message: `Welcome back, ${user.name}!`, type: 'success' });
        setTimeout(() => window.location.href = dest, 1000);

    } catch (err) {
        // Fallback local authentication
        seedDefaults();
        const user = UserStore.getByVoterId(voterId);
        if (!user) {
            setError('voterIdErr', 'Voter ID not registered. Please sign up first.');
            return;
        }
        if (user.password && user.password !== password) {
            setError('passErr', 'Incorrect password');
            return;
        }
        Session.set(user);
        const dest = user.role === 'admin' ? 'admin.html'
            : user.role === 'authority' ? 'authority.html'
                : 'dashboard.html';
        showToast({ title: 'Login Successful', message: `Welcome back, ${user.name}!`, type: 'success' });
        setTimeout(() => window.location.href = dest, 1000);
    }
}

// ── Guard ─────────────────────────────────────────────────────────────────────
export function requireLogin(role = null) {
    if (!Session.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    const user = Session.get();
    if (role && user.role !== role) {
        showToast({ title: 'Access Denied', message: 'You do not have permission to view this page.', type: 'error' });
        setTimeout(() => window.location.href = user.role === 'admin' ? 'admin.html' : user.role === 'authority' ? 'authority.html' : 'dashboard.html', 1500);
        return false;
    }
    return true;
}

// ── Profile Update ────────────────────────────────────────────────────────────
export function handleProfileUpdate(e) {
    e.preventDefault();
    const user = Session.get();
    if (!user) return;

    const name = document.getElementById('profileName').value.trim();
    const age = parseInt(document.getElementById('profileAge').value);
    const phone = document.getElementById('profilePhone').value.trim();
    const gender = document.getElementById('profileGender').value;

    let valid = true;
    if (!name) { setError('profileNameErr', 'Name is required'); valid = false; }
    if (!age || age < 18) { setError('profileAgeErr', 'Enter a valid age'); valid = false; }
    if (!/^\d{10}$/.test(phone)) { setError('profilePhoneErr', 'Enter valid 10-digit phone'); valid = false; }
    if (!valid) return;

    const updated = UserStore.update(user.id, { name, age, phone, gender });
    Session.set(updated);
    showToast({ title: 'Profile Updated', message: 'Your details have been saved.', type: 'success' });
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function logout() {
    Session.clear();
    window.location.href = 'login.html';
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────
function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    const inputId = id.replace('Err', '');
    const input = document.getElementById(inputId);
    if (input) input.classList.add('error');
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; e.classList.add('hidden'); });
    document.querySelectorAll('.form-input.error').forEach(e => e.classList.remove('error'));
}
