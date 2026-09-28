/**
 * JANSANKET — Centralized Department Routing Registry
 * Definite rules, descriptions, keywords, excluded terms, and priority guidelines.
 */

const DEPARTMENTS = {
    'Public Works Department (PWD)': {
        name: 'Public Works Department (PWD)',
        description: 'Handles: road repairs, potholes, damaged footpaths, street infrastructure, government building maintenance.',
        keywords: ['pothole', 'road', 'street light', 'streetlight', 'bridge', 'drainage', 'sewage', 'waterlogging', 'footpath', 'construction', 'repair', 'broken road', 'asphalt', 'divider', 'tar', 'infrastructure', 'building'],
        excludedKeywords: [],
        defaultPriority: 'MEDIUM',
        escalationDays: 6,
    },
    'Municipal Corporation – Solid Waste Management / Sanitation Department': {
        name: 'Municipal Corporation – Solid Waste Management / Sanitation Department',
        description: 'Handles: garbage not collected, overflowing bins, street cleaning, illegal dumping, sanitation issues.',
        keywords: ['garbage', 'waste', 'dump', 'dustbin', 'bin', 'cleanliness', 'cleaning', 'sanitation', 'trash', 'litter', 'smell', 'dumping', 'hygiene'],
        excludedKeywords: [],
        defaultPriority: 'MEDIUM',
        escalationDays: 6,
    }
};

const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.85,             // Auto-route cleanly to AI_ROUTED
    MEDIUM: 0.60,           // Auto-route with AI_ROUTED_REVIEW_RECOMMENDED
    NEEDS_REVIEW: 0.60      // Below 0.60 -> Pause auto-assignment, set NEEDS_CLARIFICATION / ROUTING_REVIEW
};

module.exports = {
    DEPARTMENTS,
    CONFIDENCE_THRESHOLDS,
};
