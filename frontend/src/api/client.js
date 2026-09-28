/**
 * JanSanket API Client
 * All calls go to http://localhost:5002/api/...
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

async function req(method, url, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    try {
        const u = JSON.parse(sessionStorage.getItem('cs_user'));
        if (u) {
            if (u.id) headers['X-User-Id'] = u.id;
            if (u.department) headers['X-User-Department'] = u.department;
            if (u.role) headers['X-User-Role'] = u.role;
        }
    } catch {}

    const opts = {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const res = await fetch(`${BASE}${url}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth
export const register = (data) => req('POST', '/auth/register', data);
export const login = (data) => req('POST', '/auth/login', data);
export const updateProfile = (id, d) => req('PUT', `/auth/profile/${id}`, d);

// Complaints
export const getComplaints = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/complaints${qs ? '?' + qs : ''}`);
};
export const getComplaint = (id) => req('GET', `/complaints/${id}`);
export const createComplaint = (data) => req('POST', '/complaints', data);
export const updateComplaint = (id, d) => req('PATCH', `/complaints/${id}`, d);
export const deleteComplaint = (id) => req('DELETE', `/complaints/${id}`);
export const downloadComplaintFile = (id) => req('GET', `/complaints/${id}/download`);
export const acceptComplaint = (id, d) => req('POST', `/complaints/${id}/accept`, d);
export const rejectComplaint = (id, d) => req('POST', `/complaints/${id}/reject`, d);
export const resolveComplaint = (id, d) => req('POST', `/complaints/${id}/resolve`, d);
export const setConsent = (id, d) => req('POST', `/complaints/${id}/consent`, d);
export const submitClarification = (id, d) => req('POST', `/complaints/${id}/clarify`, d);
export const reassignDepartment = (id, d) => req('POST', `/complaints/${id}/reassign`, d);
export const getAuditLogs = (id) => req('GET', `/complaints/${id}/audit-logs`);
export const getDepartmentRegistry = () => req('GET', '/complaints/departments/registry');

// Notifications
export const getNotifications = (uid) => req('GET', `/notifications/${uid}`);
export const getUnreadCount = (uid) => req('GET', `/notifications/${uid}/unread-count`);
export const markRead = (id) => req('PATCH', `/notifications/${id}/read`);
export const markAllRead = (uid) => req('PATCH', `/notifications/mark-all/${uid}`);
