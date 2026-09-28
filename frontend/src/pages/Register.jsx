import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OFFICE_LEVELS = [
    "State Level",
    "District Level",
    "Sub-Division Level",
    "Block / Taluk Level",
    "Municipal Corporation / Local Body Level"
];

const ALLOWED_DEPARTMENTS = [
    "Public Works Department (PWD)",
    "Municipal Corporation – Solid Waste Management / Sanitation Department"
];

// Searchable State/UT Combobox Component
function SearchableStateSelect({ statesList, selectedCode, onSelectState, error, loading }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedObj = statesList.find(s => s.code === selectedCode);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input on open
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const search = searchTerm.trim().toLowerCase();

    const statesOnly = statesList
        .filter(s => {
            const isState = s.type === 'STATE' || s.type === 'State' || (!s.type && !s.name.includes('Island'));
            const matches = !search || s.name.toLowerCase().includes(search);
            return isState && matches;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const utsOnly = statesList
        .filter(s => {
            const isUT = s.type === 'UNION_TERRITORY' || s.type === 'Union Territory';
            const matches = !search || s.name.toLowerCase().includes(search);
            return isUT && matches;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleSelect = (s) => {
        onSelectState(s.code, s.name);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
            <label className="form-label">
                Select State / Union Territory <span className="text-accent">*</span>
            </label>

            {/* Trigger Button */}
            <button
                type="button"
                className="form-input form-select"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                style={{
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: loading ? 'wait' : 'pointer',
                    background: 'var(--color-bg-1)',
                    borderColor: error ? '#ef4444' : isOpen ? 'var(--color-accent)' : 'var(--color-border)',
                    padding: '12px 14px',
                    fontSize: '0.92rem'
                }}
            >
                <span style={{ color: selectedObj ? 'var(--color-text-1)' : 'var(--color-text-3)', fontWeight: selectedObj ? 600 : 400 }}>
                    {loading ? '⏳ Loading States...' : selectedObj ? selectedObj.name : 'Select State / Union Territory'}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                        marginTop: 4,
                        maxHeight: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Search Field */}
                    <div style={{ padding: 8, borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="form-input"
                            placeholder="Search State or Union Territory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setIsOpen(false);
                            }}
                            style={{ fontSize: '0.85rem', padding: '8px 12px', flex: 1 }}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.9rem' }}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                        {statesOnly.length === 0 && utsOnly.length === 0 ? (
                            <div style={{ padding: '16px 16px', color: 'var(--color-text-3)', fontSize: '0.88rem', textAlign: 'center' }}>
                                No matching State or UT found
                            </div>
                        ) : (
                            <>
                                {statesOnly.length > 0 && (
                                    <div>
                                        <div style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--color-bg-3)' }}>
                                            STATES ({statesOnly.length})
                                        </div>
                                        {statesOnly.map(s => (
                                            <div
                                                key={s.code}
                                                onClick={() => handleSelect(s)}
                                                style={{
                                                    padding: '10px 16px',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    background: selectedCode === s.code ? 'var(--color-accent-pale)' : 'transparent',
                                                    color: selectedCode === s.code ? 'var(--color-accent)' : 'var(--color-text-1)',
                                                    fontWeight: selectedCode === s.code ? 700 : 400,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (selectedCode !== s.code) e.currentTarget.style.background = 'var(--color-bg-3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedCode !== s.code) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span>{s.name}</span>
                                                {selectedCode === s.code && <span>✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {utsOnly.length > 0 && (
                                    <div>
                                        <div style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: 1, background: 'var(--color-bg-3)', marginTop: statesOnly.length > 0 ? 6 : 0 }}>
                                            UNION TERRITORIES ({utsOnly.length})
                                        </div>
                                        {utsOnly.map(ut => (
                                            <div
                                                key={ut.code}
                                                onClick={() => handleSelect(ut)}
                                                style={{
                                                    padding: '10px 16px',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    background: selectedCode === ut.code ? 'var(--color-accent-pale)' : 'transparent',
                                                    color: selectedCode === ut.code ? 'var(--color-accent)' : 'var(--color-text-1)',
                                                    fontWeight: selectedCode === ut.code ? 700 : 400,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (selectedCode !== ut.code) e.currentTarget.style.background = 'var(--color-bg-3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedCode !== ut.code) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span>{ut.name}</span>
                                                {selectedCode === ut.code && <span>✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {error && <span className="form-error visible">{error}</span>}
        </div>
    );
}

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [statesList, setStatesList] = useState([]);
    const [loadingStates, setLoadingStates] = useState(true);

    const [userType, setUserType] = useState('public');
    const [form, setForm] = useState({
        name: '',
        employeeId: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        officeLevel: '',
        stateCode: '',
        stateName: '',
        districtCode: '',
        districtName: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });

    const [districtsList, setDistrictsList] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [districtError, setDistrictError] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');

    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [submittedApproval, setSubmittedApproval] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Load list of States & UTs on mount
    useEffect(() => {
        setLoadingStates(true);
        fetch('/api/states')
            .then(res => res.json())
            .then(data => {
                const sorted = Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : [];
                setStatesList(sorted);
                setLoadingStates(false);
            })
            .catch(() => {
                setLoadingStates(false);
            });
    }, []);

    // Handle State selection from searchable combobox
    const handleSelectState = (selectedCode, selectedName) => {
        // Reset district state immediately when state changes
        setForm(f => ({
            ...f,
            stateCode: selectedCode,
            stateName: selectedName,
            districtCode: '',
            districtName: ''
        }));
        setErrors(e => ({ ...e, state: '' }));
        setDistrictSearch('');
        setDistrictsList([]);
        setDistrictError('');

        if (!selectedCode) return;

        setLoadingDistricts(true);
        fetch(`/api/districts?stateCode=${encodeURIComponent(selectedCode)}`)
            .then(async res => {
                if (!res.ok) {
                    throw new Error('Unable to load districts. Please try again.');
                }
                return res.json();
            })
            .then(data => {
                setLoadingDistricts(false);
                if (data.districts && data.districts.length > 0) {
                    const sortedDistricts = [...data.districts].sort((a, b) => a.name.localeCompare(b.name));
                    setDistrictsList(sortedDistricts);
                } else {
                    setDistrictError('No districts found');
                }
            })
            .catch(err => {
                setLoadingDistricts(false);
                setDistrictError(err.message || 'Unable to load districts. Please try again.');
            });
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value;
        const distObj = districtsList.find(d => d.code === code);
        setForm(f => ({
            ...f,
            districtCode: code,
            districtName: distObj ? distObj.name : code
        }));
        setErrors(e => ({ ...e, district: '' }));
    };

    const change = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({
            ...f,
            [name]: type === 'checkbox' ? checked : value
        }));
        setErrors(e => ({ ...e, [name]: '' }));
    };

    const handleSendOtp = () => {
        if (!/^\d{10}$/.test(form.phone)) {
            return setErrors(e => ({ ...e, phone: 'Enter a valid 10-digit mobile number' }));
        }
        setSendingOtp(true);
        setTimeout(() => {
            setSendingOtp(false);
            setOtpSent(true);
            setOtpVerified(true);
        }, 800);
    };

    async function submit(e) {
        e.preventDefault();
        const errs = {};

        if (userType === 'public') {
            if (!form.name.trim()) errs.name = 'Full Name is required';
            if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Valid 10-digit mobile number is required';
            if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email address is required';
            if (!form.stateCode) errs.state = 'Please select a State or Union Territory.';
            if (!form.districtCode && !form.districtName) errs.district = 'Select District is required';
            if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
            if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
            if (!form.agreeTerms) errs.agreeTerms = 'You must agree to the Terms and Privacy Policy';
        } else if (userType === 'official') {
            if (!form.name.trim()) errs.name = 'Full Name is required';
            if (!form.employeeId.trim()) errs.employeeId = 'Employee ID is required';
            if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Official Email is required';
            if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Valid 10-digit mobile number is required';
            if (!form.designation.trim()) errs.designation = 'Designation is required';
            if (!form.department) errs.department = 'Please select a department';
            if (!form.officeLevel) errs.officeLevel = 'Please select office level';
            if (!form.stateCode) errs.state = 'Please select a State or Union Territory.';
            if (!form.districtCode && !form.districtName) errs.district = 'Select District is required';
            if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
            if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errs).length) return setErrors(errs);

        setLoading(true);
        try {
            const user = await register({
                userType,
                name: form.name,
                employeeId: form.employeeId,
                email: form.email,
                phone: form.phone,
                designation: form.designation,
                department: form.department || 'Public Works Department (PWD)',
                officeLevel: form.officeLevel,
                state: form.stateName || form.stateCode,
                stateCode: form.stateCode,
                district: form.districtName || form.districtCode,
                districtCode: form.districtCode,
                password: form.password,
            });

            if (userType === 'official') {
                setSubmittedApproval(true);
            } else {
                navigate(user.role === 'admin' ? '/admin' : user.role === 'authority' ? '/authority' : '/dashboard');
            }
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    }

    const filteredDistricts = districtsList.filter(d =>
        d.name.toLowerCase().includes(districtSearch.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Left panel */}
            <div style={{ background: 'linear-gradient(160deg, var(--color-bg-2), var(--color-bg-3))', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 60%, hsla(0,85%,55%,0.1), transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Link to="/" className="nav-logo" style={{ marginBottom: 40, display: 'inline-flex' }}>
                        <div className="logo-icon">🛡️</div> JanSanket
                    </Link>
                    <h2 style={{ marginBottom: 16, fontSize: '2rem' }}>
                        {userType === 'official' ? 'Government Officer Portal' : 'Join the Civic Movement'}
                    </h2>
                    <p style={{ marginBottom: 32 }}>
                        {userType === 'official'
                            ? 'Register your official credentials to access administrative grievance resolution workflows.'
                            : 'Create your Public Citizen Account to file complaints, track resolutions, and hold authorities accountable.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            ['🛡️', 'Secure multi-department administrative access'],
                            ['🏛️', 'Official verification & administrative oversight'],
                            ['🤖', 'Automated AI routing and priority tagging'],
                            ['📦', 'Real-time SLA tracking & legal escalations'],
                        ].map(([icon, text]) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '1.3rem', width: 32, textAlign: 'center' }}>{icon}</span>
                                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-2)' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: 460 }}>
                    {submittedApproval ? (
                        <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Submitted for Approval</h3>
                            <p style={{ color: 'var(--color-text-2)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
                                Your Government Officer registration request for <strong>{form.name}</strong> ({form.department}) has been sent to the System Administrator for verification.
                            </p>
                            <Link to="/login" className="btn btn-primary btn-full">Return to Login</Link>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create Account</h3>
                            </div>

                            <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Select User Type */}
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 700 }}>Select User Type <span className="text-accent">*</span></label>
                                    <select
                                        className="form-input form-select"
                                        value={userType}
                                        onChange={(e) => {
                                            setUserType(e.target.value);
                                            setErrors({});
                                        }}
                                        style={{ fontSize: '0.95rem', padding: '12px 14px' }}
                                    >
                                        <option value="public">Public / Citizen</option>
                                        <option value="official">Government Officer</option>
                                    </select>
                                </div>

                                {userType === 'public' && (
                                    <>
                                        {/* Full Name */}
                                        <div className="form-group">
                                            <label className="form-label">Full Name <span className="text-accent">*</span></label>
                                            <input name="name" className="form-input" value={form.name} onChange={change} placeholder="Full Name" />
                                            {errors.name && <span className="form-error visible">{errors.name}</span>}
                                        </div>

                                        {/* Mobile Number + Send OTP */}
                                        <div className="form-group">
                                            <label className="form-label">Mobile Number <span className="text-accent">*</span></label>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <input name="phone" type="tel" className="form-input" value={form.phone} onChange={change} placeholder="Mobile Number" maxLength={10} style={{ flex: 1 }} />
                                                <button type="button" className="btn btn-secondary" onClick={handleSendOtp} disabled={sendingOtp || otpVerified} style={{ whiteSpace: 'nowrap', padding: '0 16px', fontSize: '0.85rem' }}>
                                                    {sendingOtp ? '⏳ Sending...' : otpVerified ? '✅ OTP Verified' : 'Send OTP'}
                                                </button>
                                            </div>
                                            {errors.phone && <span className="form-error visible">{errors.phone}</span>}
                                        </div>

                                        {/* Email Address */}
                                        <div className="form-group">
                                            <label className="form-label">Email Address <span className="text-accent">*</span></label>
                                            <input name="email" type="email" className="form-input" value={form.email} onChange={change} placeholder="Email Address" />
                                            {errors.email && <span className="form-error visible">{errors.email}</span>}
                                        </div>

                                        {/* Searchable State / Union Territory Dropdown */}
                                        <SearchableStateSelect
                                            statesList={statesList}
                                            selectedCode={form.stateCode}
                                            onSelectState={handleSelectState}
                                            error={errors.state}
                                            loading={loadingStates}
                                        />

                                        {/* Select District (Dependent Dropdown) */}
                                        <div className="form-group">
                                            <label className="form-label">Select District <span className="text-accent">*</span></label>
                                            
                                            {districtsList.length > 8 && (
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="🔍 Search district..."
                                                    value={districtSearch}
                                                    onChange={e => setDistrictSearch(e.target.value)}
                                                    style={{ marginBottom: 6, fontSize: '0.82rem', padding: '6px 10px' }}
                                                />
                                            )}

                                            <select
                                                className="form-input form-select"
                                                value={form.districtCode}
                                                onChange={handleDistrictChange}
                                                disabled={!form.stateCode || loadingDistricts}
                                                required
                                            >
                                                {!form.stateCode ? (
                                                    <option value="">Please select a State / UT first</option>
                                                ) : loadingDistricts ? (
                                                    <option value="">⏳ Loading districts...</option>
                                                ) : districtError ? (
                                                    <option value="">⚠️ {districtError}</option>
                                                ) : (
                                                    <>
                                                        <option value="">Select District ▼</option>
                                                        {filteredDistricts.map(d => (
                                                            <option key={d.code} value={d.code}>{d.name}</option>
                                                        ))}
                                                    </>
                                                )}
                                            </select>

                                            {loadingDistricts && (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', marginTop: 4, display: 'block' }}>
                                                    ⏳ Retrieving district directory...
                                                </span>
                                            )}
                                            {districtError && !loadingDistricts && (
                                                <span className="form-error visible">{districtError}</span>
                                            )}
                                            {errors.district && <span className="form-error visible">{errors.district}</span>}
                                        </div>

                                        {/* Passwords */}
                                        <div className="form-group">
                                            <label className="form-label">Password <span className="text-accent">*</span></label>
                                            <input name="password" type="password" className="form-input" value={form.password} onChange={change} placeholder="Password" />
                                            {errors.password && <span className="form-error visible">{errors.password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password <span className="text-accent">*</span></label>
                                            <input name="confirmPassword" type="password" className="form-input" value={form.confirmPassword} onChange={change} placeholder="Confirm Password" />
                                            {errors.confirmPassword && <span className="form-error visible">{errors.confirmPassword}</span>}
                                        </div>

                                        {/* Checkbox */}
                                        <div className="form-group" style={{ marginTop: 4 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                                                <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={change} style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }} />
                                                <span>I agree to the <strong>Terms and Privacy Policy</strong></span>
                                            </label>
                                            {errors.agreeTerms && <span className="form-error visible">{errors.agreeTerms}</span>}
                                        </div>
                                    </>
                                )}

                                {userType === 'official' && (
                                    <>
                                        {/* Full Name */}
                                        <div className="form-group">
                                            <label className="form-label">Full Name <span className="text-accent">*</span></label>
                                            <input name="name" className="form-input" value={form.name} onChange={change} placeholder="Full Name" />
                                            {errors.name && <span className="form-error visible">{errors.name}</span>}
                                        </div>

                                        {/* Employee ID */}
                                        <div className="form-group">
                                            <label className="form-label">Employee ID <span className="text-accent">*</span></label>
                                            <input name="employeeId" className="form-input" value={form.employeeId} onChange={change} placeholder="Employee ID" />
                                            {errors.employeeId && <span className="form-error visible">{errors.employeeId}</span>}
                                        </div>

                                        {/* Official Email */}
                                        <div className="form-group">
                                            <label className="form-label">Official Email <span className="text-accent">*</span></label>
                                            <input name="email" type="email" className="form-input" value={form.email} onChange={change} placeholder="Official Email" />
                                            {errors.email && <span className="form-error visible">{errors.email}</span>}
                                        </div>

                                        {/* Mobile Number */}
                                        <div className="form-group">
                                            <label className="form-label">Mobile Number <span className="text-accent">*</span></label>
                                            <input name="phone" type="tel" className="form-input" value={form.phone} onChange={change} placeholder="Mobile Number" maxLength={10} />
                                            {errors.phone && <span className="form-error visible">{errors.phone}</span>}
                                        </div>

                                        {/* Designation */}
                                        <div className="form-group">
                                            <label className="form-label">Designation <span className="text-accent">*</span></label>
                                            <input name="designation" className="form-input" value={form.designation} onChange={change} placeholder="Designation" />
                                            {errors.designation && <span className="form-error visible">{errors.designation}</span>}
                                        </div>

                                        {/* Department */}
                                        <div className="form-group">
                                            <label className="form-label">Department <span className="text-accent">*</span></label>
                                            <select name="department" className="form-input form-select" value={form.department} onChange={change} required>
                                                <option value="" disabled>Select Department ▼</option>
                                                {ALLOWED_DEPARTMENTS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                            {errors.department && <span className="form-error visible">{errors.department}</span>}
                                        </div>

                                        {/* Office Level */}
                                        <div className="form-group">
                                            <label className="form-label">Office Level <span className="text-accent">*</span></label>
                                            <select name="officeLevel" className="form-input form-select" value={form.officeLevel} onChange={change} required>
                                                <option value="" disabled>Select Office Level ▼</option>
                                                {OFFICE_LEVELS.map(lvl => (
                                                    <option key={lvl} value={lvl}>{lvl}</option>
                                                ))}
                                            </select>
                                            {errors.officeLevel && <span className="form-error visible">{errors.officeLevel}</span>}
                                        </div>

                                        {/* Searchable State / Union Territory Dropdown */}
                                        <SearchableStateSelect
                                            statesList={statesList}
                                            selectedCode={form.stateCode}
                                            onSelectState={handleSelectState}
                                            error={errors.state}
                                            loading={loadingStates}
                                        />

                                        {/* Select District (Dependent Dropdown) */}
                                        <div className="form-group">
                                            <label className="form-label">Select District <span className="text-accent">*</span></label>
                                            
                                            {districtsList.length > 8 && (
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="🔍 Search district..."
                                                    value={districtSearch}
                                                    onChange={e => setDistrictSearch(e.target.value)}
                                                    style={{ marginBottom: 6, fontSize: '0.82rem', padding: '6px 10px' }}
                                                />
                                            )}

                                            <select
                                                className="form-input form-select"
                                                value={form.districtCode}
                                                onChange={handleDistrictChange}
                                                disabled={!form.stateCode || loadingDistricts}
                                                required
                                            >
                                                {!form.stateCode ? (
                                                    <option value="">Please select a State / UT first</option>
                                                ) : loadingDistricts ? (
                                                    <option value="">⏳ Loading districts...</option>
                                                ) : districtError ? (
                                                    <option value="">⚠️ {districtError}</option>
                                                ) : (
                                                    <>
                                                        <option value="">Select District ▼</option>
                                                        {filteredDistricts.map(d => (
                                                            <option key={d.code} value={d.code}>{d.name}</option>
                                                        ))}
                                                    </>
                                                )}
                                            </select>
                                            {errors.district && <span className="form-error visible">{errors.district}</span>}
                                        </div>

                                        {/* Password & Confirm Password */}
                                        <div className="form-group">
                                            <label className="form-label">Password <span className="text-accent">*</span></label>
                                            <input name="password" type="password" className="form-input" value={form.password} onChange={change} placeholder="Password" />
                                            {errors.password && <span className="form-error visible">{errors.password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password <span className="text-accent">*</span></label>
                                            <input name="confirmPassword" type="password" className="form-input" value={form.confirmPassword} onChange={change} placeholder="Confirm Password" />
                                            {errors.confirmPassword && <span className="form-error visible">{errors.confirmPassword}</span>}
                                        </div>
                                    </>
                                )}

                                {errors.submit && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem' }}>
                                        ⚠️ {errors.submit}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={loading}
                                    style={{ marginTop: 8, padding: '14px', fontSize: '1rem', fontWeight: 700 }}
                                >
                                    {loading
                                        ? '⏳ Submitting...'
                                        : userType === 'official'
                                            ? 'Submit for Administrator Approval'
                                            : 'Create Public Account'}
                                </button>
                            </form>

                            <div className="divider-text" style={{ margin: '20px 0' }}>already registered?</div>
                            <Link to="/login" className="btn btn-ghost btn-full">Log In Instead →</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
