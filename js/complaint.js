/**
 * JANSANKET — Complaint Submission Module
 * Handles form, geolocation, file upload, anonymization
 */

import { ComplaintStore, Session } from './store.js';
import { getAnonymousId } from './auth.js';
import { analyzeComplaint } from './ai-analysis.js';
import { showToast } from './notification.js';
import { requireLogin } from './auth.js';

let uploadedFiles = [];

// ── Init ──────────────────────────────────────────────────────────────────────
export function initComplaintForm() {
    if (!requireLogin()) return;
    const user = Session.get();

    // Populate read-only user fields
    const idEl = document.getElementById('displayId');
    const nameEl = document.getElementById('displayName');
    const ageEl = document.getElementById('displayAge');
    const genderEl = document.getElementById('displayGender');
    const anonEl = document.getElementById('displayAnon');

    if (idEl) idEl.textContent = user.voterId;
    if (nameEl) nameEl.textContent = user.name;
    if (ageEl) ageEl.textContent = user.age;
    if (genderEl) genderEl.textContent = user.gender;
    if (anonEl) anonEl.textContent = getAnonymousId(user.voterId) + ' (your complaint identity)';

    // Setup geo button
    const geoBtn = document.getElementById('geoBtn');
    if (geoBtn) geoBtn.addEventListener('click', fetchLocation);

    // Setup file upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault(); dropZone.classList.remove('drag-over');
            handleFiles(Array.from(e.dataTransfer.files));
        });
        fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));
    }

    // Setup form submit
    const form = document.getElementById('complaintForm');
    if (form) form.addEventListener('submit', handleSubmit);
}

// ── Geolocation ────────────────────────────────────────────────────────────────
let currentCoords = null;

function fetchLocation() {
    const btn = document.getElementById('geoBtn');
    const disp = document.getElementById('locationDisplay');
    if (!navigator.geolocation) {
        showToast({ title: 'Geolocation not supported', type: 'error' });
        return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Fetching…';

    navigator.geolocation.getCurrentPosition(
        async pos => {
            currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            // Try reverse geocode via open API
            try {
                const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentCoords.lat}&lon=${currentCoords.lng}&format=json`);
                const d = await r.json();
                const loc = d.display_name || `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`;
                document.getElementById('locationInput').value = loc;
                if (disp) { disp.textContent = '📍 ' + loc; disp.classList.remove('hidden'); }
            } catch {
                const loc = `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`;
                document.getElementById('locationInput').value = loc;
                if (disp) { disp.textContent = '📍 ' + loc; disp.classList.remove('hidden'); }
            }
            btn.disabled = false;
            btn.innerHTML = '📍 Location Detected';
            btn.classList.add('btn-success');
            showToast({ title: 'Location fetched', type: 'success' });
        },
        err => {
            btn.disabled = false;
            btn.innerHTML = '📍 Use My Location';
            showToast({ title: 'Could not fetch location', message: err.message, type: 'error' });
        },
        { timeout: 10000 }
    );
}

// ── File Upload ───────────────────────────────────────────────────────────────
function handleFiles(files) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    files.forEach(file => {
        if (!ALLOWED.includes(file.type)) {
            showToast({ title: 'Unsupported file type', message: `${file.name} is not allowed`, type: 'error' }); return;
        }
        if (file.size > MAX_SIZE) {
            showToast({ title: 'File too large', message: `${file.name} exceeds 5MB`, type: 'error' }); return;
        }
        if (uploadedFiles.some(f => f.name === file.name)) return;
        uploadedFiles.push(file);
    });

    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('fileList');
    if (!list) return;
    if (!uploadedFiles.length) { list.innerHTML = ''; return; }
    list.innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-item">
      <span class="file-item-name">
        ${f.type.startsWith('image') ? '🖼️' : f.type === 'application/pdf' ? '📄' : '🎬'}
        ${f.name} <small>(${(f.size / 1024).toFixed(0)} KB)</small>
      </span>
      <span class="file-remove" onclick="removeFile(${i})">✕ Remove</span>
    </div>
  `).join('');
}
window.removeFile = (i) => { uploadedFiles.splice(i, 1); renderFileList(); };

// ── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
    e.preventDefault();
    const user = Session.get();
    if (!user) return;

    const dept = document.getElementById('department').value.trim();
    const heading = document.getElementById('heading').value.trim();
    const desc = document.getElementById('description').value.trim();
    const location = document.getElementById('locationInput').value.trim();
    const terms = document.getElementById('termsCheck').checked;

    // Validate
    let valid = true;
    clearErrors();
    if (!dept) { setErr('deptErr', 'Please select a department'); valid = false; }
    if (!heading) { setErr('headingErr', 'Heading is required'); valid = false; }
    if (desc.length < 50) { setErr('descErr', 'Please provide at least 50 characters of description'); valid = false; }
    if (!location) { setErr('locationErr', 'Please provide or fetch your location'); valid = false; }
    if (!terms) { showToast({ title: 'Please accept Terms & Conditions', type: 'warning' }); valid = false; }

    if (!valid) return;

    // Disable submit button
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.textContent = '⏳ Submitting…';

    // Store file names (in real app, upload to storage)
    const fileNames = uploadedFiles.map(f => f.name);

    // Create complaint
    const complaint = ComplaintStore.create({
        userId: user.id,
        anonymousId: getAnonymousId(user.voterId),
        name: user.name,
        department: dept,
        heading,
        description: desc,
        location,
        coords: currentCoords,
        files: fileNames,
    });

    showToast({ title: 'Complaint Filed!', message: `ID: ${complaint.id} — AI analysis starting…`, type: 'success' });

    // Trigger AI analysis in background
    analyzeComplaint(complaint.id, user.id);

    // Redirect to status page
    setTimeout(() => {
        window.location.href = `complaint-status.html?id=${complaint.id}`;
    }, 1500);
}

function setErr(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function clearErrors() {
    document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; e.classList.add('hidden'); });
}
