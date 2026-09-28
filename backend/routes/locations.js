/**
 * JANSANKET — Location API & Verification Service
 * Source of truth: backend/data/india_location_directory.json
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const JSON_FILE_PATH = path.join(__dirname, '../data/india_location_directory.json');

function getLocationData() {
    try {
        const raw = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to read location directory JSON:', e);
        return { states: [] };
    }
}

function findStateInDB(stateCodeOrName) {
    if (!stateCodeOrName) return null;
    const db = getLocationData();
    const q = stateCodeOrName.trim().toLowerCase();

    return db.states.find(s => 
        s.code.toLowerCase() === q || 
        s.name.toLowerCase() === q
    ) || null;
}

function validateStateDistrictPair(stateCode, districtCode) {
    const stateObj = findStateInDB(stateCode);
    if (!stateObj) {
        return { valid: false, reason: 'Invalid State/UT code' };
    }

    if (!districtCode) {
        return { valid: false, reason: 'District code is required' };
    }

    const dq = districtCode.trim().toLowerCase();
    const distObj = stateObj.districts.find(d => 
        d.code.toLowerCase() === dq || 
        d.name.toLowerCase() === dq ||
        dq.includes(d.name.toLowerCase())
    );

    if (!distObj) {
        return {
            valid: false,
            reason: `District "${districtCode}" does not belong to ${stateObj.name}`
        };
    }

    return {
        valid: true,
        stateCode: stateObj.code,
        stateName: stateObj.name,
        stateType: stateObj.type,
        districtCode: distObj.code,
        districtName: distObj.name
    };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

const handleGetStates = (req, res) => {
    const db = getLocationData();
    const states = db.states.map(s => ({
        code: s.code,
        name: s.name,
        type: s.type
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json(states);
};

const handleGetDistricts = (req, res) => {
    const stateCode = req.query.stateCode || req.query.state;
    if (!stateCode) {
        return res.status(400).json({ error: 'stateCode parameter is required' });
    }

    const stateObj = findStateInDB(stateCode);
    if (!stateObj) {
        return res.status(404).json({ error: 'State or Union Territory not found', districts: [] });
    }

    const sortedDistricts = [...stateObj.districts].sort((a, b) => a.name.localeCompare(b.name));

    res.json({
        stateCode: stateObj.code,
        stateName: stateObj.name,
        stateType: stateObj.type,
        count: sortedDistricts.length,
        districts: sortedDistricts
    });
};

const handleValidate = (req, res) => {
    const stateCode = req.query.stateCode || req.query.state;
    const districtCode = req.query.districtCode || req.query.district;

    const result = validateStateDistrictPair(stateCode, districtCode);
    if (!result.valid) {
        return res.status(400).json(result);
    }
    res.json(result);
};

// ── Router Mappings ───────────────────────────────────────────────────────────

router.get('/states', handleGetStates);
router.get('/districts', handleGetDistricts);
router.get('/location/validate', handleValidate);
router.get('/validate', handleValidate);
router.get('/locations/states', handleGetStates);
router.get('/locations/districts', handleGetDistricts);

module.exports = router;
module.exports.validateStateDistrictPair = validateStateDistrictPair;
