/**
 * JANSANKET — AI Complaint Analysis
 * RAG (Red/Amber/Green) classifier using keyword heuristics + Gemini API
 * Set GEMINI_API_KEY to enable real AI; falls back to smart heuristics.
 */

import { ComplaintStore, NotifStore } from './store.js';
import { showToast } from './notification.js';

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your key

// ── Spam / Duplicate Detection ────────────────────────────────────────────────
const SPAM_KEYWORDS = ['test', 'testing', 'fake', 'spam', 'hello', 'hi', 'abc', 'demo', 'sample', 'nothing'];
const THREAT_KEYWORDS = ['pothole', 'garbage', 'waste', 'water', 'electricity', 'road', 'sewage', 'light', 'drainage', 'corruption', 'bribe', 'delay', 'repair', 'hospital', 'school', 'police', 'noise', 'fire', 'flood', 'encroachment', 'illegal', 'violation'];

function isSpam(text) {
    const lower = text.toLowerCase();
    if (text.trim().length < 30) return true;
    return SPAM_KEYWORDS.some(k => lower.includes(k)) && !THREAT_KEYWORDS.some(k => lower.includes(k));
}

function isDuplicate(complaint) {
    const all = ComplaintStore.getAll();
    const recent = all.filter(c => c.id !== complaint.id && c.status !== 'rejected');
    return recent.some(c =>
        c.department === complaint.department &&
        similarity(c.description, complaint.description) > 0.72
    );
}

function similarity(a, b) {
    const wa = new Set(a.toLowerCase().split(/\s+/));
    const wb = new Set(b.toLowerCase().split(/\s+/));
    const inter = [...wa].filter(w => wb.has(w)).length;
    return inter / Math.max(wa.size, wb.size, 1);
}

// ── Heuristic RAG Classifier ──────────────────────────────────────────────────
function heuristicClassify(complaint) {
    const text = `${complaint.heading} ${complaint.description}`.toLowerCase();
    const dept = complaint.department.toLowerCase();

    if (isSpam(text)) {
        return { tag: 'red', reason: 'This complaint appears to be spam or lacks sufficient detail (minimum 30 meaningful characters required).' };
    }
    if (isDuplicate(complaint)) {
        return { tag: 'amber', reason: 'A similar complaint has already been filed. This has been flagged for admin review to avoid duplication.' };
    }
    const score = THREAT_KEYWORDS.filter(k => text.includes(k)).length;
    if (score >= 2 || text.length > 100) {
        return { tag: 'green', reason: 'Complaint contains sufficient detail, relevant keywords, and appears valid. Approved for administrative action.' };
    }
    return { tag: 'amber', reason: 'Complaint requires manual admin verification as it could not be fully auto-validated.' };
}

// ── Gemini API Analysis ────────────────────────────────────────────────────────
async function geminiClassify(complaint) {
    const prompt = `You are an AI complaint officer for a civic complaint management system. Analyze the following complaint and classify it as:
- "green" (valid, clear, actionable civic issue)
- "amber" (needs admin verification, unclear or possibly duplicate)
- "red" (spam, fake, irrelevant, or abusive)

Respond ONLY with a JSON object: {"tag":"green|amber|red","reason":"one sentence explanation"}

Complaint Details:
Department: ${complaint.department}
Heading: ${complaint.heading}
Description: ${complaint.description}
Location: ${complaint.location}
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) throw new Error('Gemini API error');
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\{[^}]+\}/);
    if (!match) throw new Error('No JSON in response');
    return JSON.parse(match[0]);
}

// ── Main Analysis Entry ───────────────────────────────────────────────────────
export async function analyzeComplaint(complaintId, userId) {
    const complaint = ComplaintStore.getById(complaintId);
    if (!complaint) return;

    // Step 1: Mark as under AI review
    ComplaintStore.addTimelineEvent(complaintId, 'ai_review', 'AI is analyzing your complaint for validity and relevance…');
    NotifStore.push(userId, {
        title: '🤖 AI Analysis Started',
        desc: 'Your complaint is being analyzed by our AI system.',
        type: 'info',
        complaintId,
        link: `complaint-status.html?id=${complaintId}`,
    });

    // Simulate AI processing delay (2-4s)
    await new Promise(r => setTimeout(r, 2500));

    let result = null;

    // Step 2: Try Gemini API, fallback to heuristics
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
        try {
            result = await geminiClassify(complaint);
        } catch (err) {
            console.warn('Gemini failed, using heuristics:', err.message);
            result = heuristicClassify(complaint);
        }
    } else {
        result = heuristicClassify(complaint);
    }

    // Step 3: Handle result
    if (result.tag === 'red') {
        ComplaintStore.update(complaintId, { ragTag: 'red', aiReason: result.reason });
        ComplaintStore.addTimelineEvent(complaintId, 'rejected', `AI flagged complaint as invalid: ${result.reason}`);
        NotifStore.push(userId, {
            title: '❌ Complaint Not Accepted',
            desc: `AI Review: ${result.reason}`,
            type: 'error',
            complaintId,
            link: `complaint-status.html?id=${complaintId}`,
        });
    } else {
        // amber or green → forward to admin
        ComplaintStore.update(complaintId, { ragTag: result.tag, aiReason: result.reason });
        ComplaintStore.addTimelineEvent(complaintId, 'admin_review', `AI classified as ${result.tag.toUpperCase()}. Forwarded to department admin for review.`);
        NotifStore.push(userId, {
            title: result.tag === 'green' ? '✅ Complaint Validated' : '🟡 Complaint Flagged for Review',
            desc: `${result.reason} Forwarded to the admin.`,
            type: result.tag === 'green' ? 'success' : 'warning',
            complaintId,
            link: `complaint-status.html?id=${complaintId}`,
        });
    }

    return result;
}

// ── Government Order Template Generator ───────────────────────────────────────
export function generateOrderDocument(complaint) {
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const content = `
GOVERNMENT ORDER — CIVIC COMPLAINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order No : GO/${complaint.id}/${new Date().getFullYear()}
Date     : ${date}
Department: ${complaint.department}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBJECT: Complaint Reference — ${complaint.heading}

COMPLAINT ID : ${complaint.id}
FILED BY     : ${complaint.anonymousId}
LOCATION     : ${complaint.location}
AI VERDICT   : ${(complaint.ragTag || 'PENDING').toUpperCase()}

DESCRIPTION:
${complaint.description}

DIRECTIVE:
The concerned authority is hereby directed to investigate
and resolve the above complaint within 6 working days from
the date of this order. Failure to do so may result in
escalation and legal action under applicable civic laws.

Issued by,
JanSanket AI Review Board
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a system-generated document. | jansanket.gov.in
`;

    // Create downloadable text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GO_${complaint.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
