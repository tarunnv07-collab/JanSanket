/**
 * CivicShield — AI Multimodal Complaint Verification Service Client
 * Connects the Node.js backend to the Python FastAPI Verification Engine (http://localhost:8000)
 */

const http = require('http');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000/api/v1/verify';

async function verifyComplaintWithAI(complaint) {
    const payload = JSON.stringify({
        complaint_text: `${complaint.heading || ''} ${complaint.description || ''}`.trim(),
        latitude: complaint.coords ? complaint.coords.lat : null,
        longitude: complaint.coords ? complaint.coords.lng : null,
        timestamp: complaint.createdAt || new Date().toISOString(),
        image: (complaint.files && complaint.files.length > 0) ? complaint.files[0] : null,
        location_name: complaint.location || 'Pune District',
        metadata: {
            id: complaint.id,
            department: complaint.department
        }
    });

    return new Promise((resolve) => {
        const url = new URL(PYTHON_AI_SERVICE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 8000,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const parsed = JSON.parse(data);
                        resolve({ success: true, verification: parsed });
                    } else {
                        resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
                    }
                } catch (e) {
                    resolve({ success: false, error: `JSON Parse error: ${e.message}` });
                }
            });
        });

        req.on('error', (err) => {
            resolve({
                success: false,
                error: `Python AI Service unavailable: ${err.message}`,
                fallback: {
                    decision: 'INCONCLUSIVE',
                    confidence: 0.50,
                    explanation: 'Python AI verification service offline; defaulted to neutral standby.'
                }
            });
        });

        req.write(payload);
        req.end();
    });
}

module.exports = {
    verifyComplaintWithAI
};
