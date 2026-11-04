import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, Shield, Users, FileText, CheckCircle, AlertTriangle,
  Search, RefreshCw, Download, Filter, Clock, Eye, Layers, Building2,
  Calendar, Check, X, ShieldCheck, ChevronLeft, ChevronRight, Terminal, UserCheck
} from 'lucide-react';

export default function SystemLogsAdminSection() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, roleFilter, moduleFilter, statusFilter, startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get('/api/admin/system-logs/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load system log stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        role: roleFilter,
        module: moduleFilter,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined
      };
      const res = await axios.get('/api/admin/system-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setModuleFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো লগ রেকর্ড পাওয়া যায়নি।');
      return;
    }

    const headers = ['Timestamp', 'User Name', 'Role', 'Email', 'NID', 'Action', 'Module', 'Description', 'Target Resource', 'IP Address', 'Status'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toISOString(),
      `"${(l.user_name || '').replace(/"/g, '""')}"`,
      l.user_role || '',
      l.user_email || '',
      `"${l.user_nid || ''}"`,
      l.action_type || '',
      l.module || '',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(l.target_resource || '').replace(/"/g, '""')}"`,
      l.ip_address || '',
      l.status || 'SUCCESS'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format Bengali date
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Relative time helper
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'এইমাত্র';
      if (diffMin < 60) return `${diffMin} মিনিট আগে`;
      if (diffHour < 24) return `${diffHour} ঘণ্টা আগে`;
      if (diffDay < 30) return `${diffDay} দিন আগে`;
      return `${Math.floor(diffDay / 30)} মাস আগে`;
    } catch {
      return '';
    }
  };

  // Role tag badge style
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return {
          label: '🛡️ সুপার এডমিন',
          bg: '#f3e8ff',
          color: '#6b21a8',
          border: '#d8b4fe'
        };
      case 'AC Land Office':
        return {
          label: '🏛️ এসি ল্যান্ড অফিস',
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a'
        };
      case 'Register Office':
        return {
          label: '📜 সাব-রেজিস্ট্রার',
          bg: '#ecfdf5',
          color: '#065f46',
          border: '#a7f3d0'
        };
      case 'User':
        return {
          label: '👤 নাগরিক (User)',
          bg: '#eff6ff',
          color: '#1e40af',
          border: '#bfdbfe'
        };
      default:
        return {
          label: '⚙️ সিস্টেম',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1'
        };
    }
  };

  // Action badge label in Bengali
  const getActionBadge = (action) => {
    const map = {
      ADMIN_LOGIN: { label: 'এডমিন লগইন', color: '#7c3aed' },
      USER_LOGIN: { label: 'ব্যবহারকারী লগইন', color: '#2563eb' },
      USER_REGISTERED: { label: 'নাগরিক নিবন্ধন', color: '#059669' },
      USER_PROFILE_UPDATE: { label: 'প্রোফাইল আপডেট', color: '#0284c7' },
      ADMIN_USER_CREATED: { label: 'ব্যবহারকারী সৃষ্টি', color: '#7c3aed' },
      ADMIN_USER_UPDATED: { label: 'ব্যবহারকারী আপডেট', color: '#7c3aed' },
      ADMIN_ROLE_CHANGED: { label: 'রোল পরিবর্তন', color: '#c026d3' },
      ADMIN_USER_STATUS_TOGGLED: { label: 'স্থিতি পরিবর্তন', color: '#dc2626' },
      ADMIN_USER_DELETED: { label: 'ইউজার অপসারণ', color: '#b91c1c' },
      ADMIN_LAND_CREATED: { label: 'জমি তৈরি', color: '#059669' },
      ADMIN_LAND_UPDATED: { label: 'জমি আপডেট', color: '#059669' },
      ADMIN_LAND_DELETED: { label: 'জমি মুছে ফেলা', color: '#b91c1c' },
      LEGAL_CASE_ASSIGNED: { label: 'মামলা/নিষেধাজ্ঞা', color: '#dc2626' },
      LEGAL_CASE_DELETED: { label: 'মামলা প্রত্যাহার', color: '#059669' },
      DEED_GRANTED: { label: 'দলিল মঞ্জুর', color: '#0d9488' },
      MUTATION_APPROVED: { label: 'নামজারি অনুমোদন', color: '#d97706' },
      MUTATION_PAID: { label: 'নামজারি ফি পরিশোধ', color: '#059669' },
      KHATIAN_UPDATED: { label: 'খতিয়ান আপডেট', color: '#0284c7' },
      GOVT_LAND_ASSIGNED: { label: 'জমি বরাদ্দ প্রস্তাব', color: '#0d9488' },
      GOVT_LAND_DECIDED: { label: 'বরাদ্দ সিদ্ধান্ত', color: '#d97706' },
      DEATH_CERT_VERIFIED: { label: 'মৃত্যু সনদ ও জমি লক', color: '#dc2626' },
      BONTONNAMA_CREATED: { label: 'বণ্টননামা সৃষ্টি', color: '#0d9488' },
      BONTONNAMA_PAID: { label: 'বণ্টননামা ফি পরিশোধ', color: '#059669' },
      BONTONNAMA_APPROVED: { label: 'বণ্টননামা অনুমোদন', color: '#16a34a' },
      LAND_CLAIM_SUBMITTED: { label: 'মালিকানা দাবি', color: '#2563eb' },
      SYSTEM_SEED_RESET: { label: 'সিস্টেম রিসেট', color: '#dc2626' },
      SYSTEM_BOOT: { label: 'সিস্টেম বুট', color: '#475569' }
    };

    return map[action] || { label: action, color: '#475569' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & KPI SUMMARY METRICS
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #1e3a8a)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px' }}>
                <Activity size={24} color="#a5b4fc" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.3px' }}>
                  কেন্দ্রীয় সিস্টেম অডিট লগ ও অ্যাক্টিভিটি হিস্ট্রি (System Logs)
                </h2>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#c7d2fe', lineHeight: 1.4 }}>
                  সিস্টেমের প্রতিটি User, Registrar, AC Land Officer এবং Super Admin-এর সকল কার্যক্রম স্বয়ংক্রিয়ভাবে সংরক্ষিত Complete Audit Trail
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { fetchLogs(); fetchStats(); }}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              {loading ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
              }}
            >
              <Download size={15} />
              অডিট রিপোর্ট (CSV)
            </button>
          </div>
        </div>

        {/* STATS METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '11px', color: '#c7d2fe', textTransform: 'uppercase', fontWeight: '700' }}>সর্বমোট অডিট রেকর্ড</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              {stats?.totalLogs ?? totalCount}
            </div>
            <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '2px' }}>বিগত ২৪ ঘণ্টায়: {stats?.last24hCount || 0} টি</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: '700' }}>👤 নাগরিক (User) কার্যক্রম</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#93c5fd', marginTop: '2px' }}>
              {stats?.userLogs || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#bfdbfe', marginTop: '2px' }}>প্রোফাইল ও দাবি কার্যক্রম</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: '700' }}>📜 সাব-রেজিস্ট্রার কার্যক্রম</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#6ee7b7', marginTop: '2px' }}>
              {stats?.registrarLogs || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>দলিল, বরাদ্দ ও বণ্টননামা</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '11px', color: '#fcd34d', textTransform: 'uppercase', fontWeight: '700' }}>🏛️ এসি ল্যান্ড সিদ্ধান্ত</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#fcd34d', marginTop: '2px' }}>
              {stats?.aclandLogs || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#fde68a', marginTop: '2px' }}>নামজারি ও বণ্টননামা অনুমোদন</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '11px', color: '#e9d5ff', textTransform: 'uppercase', fontWeight: '700' }}>🛡️ সুপার এডমিন একশন</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#e9d5ff', marginTop: '2px' }}>
              {stats?.adminLogs || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#f3e8ff', marginTop: '2px' }}>রোল, মামলা ও প্রশাসন</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER & SEARCH CONTROL TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '20px 24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
            {/* Search Input */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                🔍 সার্চ করুন (নাম, ইমেইল, NID, বিবরণ বা খতিয়ান/দাগ)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="যেমন: Shyshob Don, সাদ, ১২৩৪৫৬৭৮৯১০, গুজিয়া, দাগ ৪৫..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    fontSize: '13px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Search size={15} />
                  খুঁজুন
                </button>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                👥 ব্যবহারকারীর ভূমিকা (Role)
              </label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              >
                <option value="all">সকল ভূমিকা (All Roles)</option>
                <option value="User">👤 নাগরিক (User)</option>
                <option value="Register Office">📜 সাব-রেজিস্ট্রার (Register Office)</option>
                <option value="AC Land Office">🏛️ সহকারী কমিশনার ভূমি (AC Land)</option>
                <option value="Super Admin">🛡️ সুপার এডমিন (Super Admin)</option>
                <option value="System">⚙️ সিস্টেম (System)</option>
              </select>
            </div>

            {/* Module Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                📂 মডিউল বা বিভাগ
              </label>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              >
                <option value="all">সকল মডিউল (All Modules)</option>
                <option value="Deed_Registry">দলিল নিবন্ধন (Deed Registry)</option>
                <option value="Bonton_Nama">ওয়ারিশ বণ্টননামা (Bonton Nama)</option>
                <option value="Mutation">ই-নামজারি (Mutation)</option>
                <option value="Land_Assignment">সরকারি জমি বরাদ্দ (Assignment)</option>
                <option value="Land_Claim">মালিকানা দাবি (Land Claim)</option>
                <option value="Legal_Case">আইনি মামলা ও নিষেধাজ্ঞা (Legal Case)</option>
                <option value="Profile">নাগরিক প্রোফাইল (Profile)</option>
                <option value="User_Management">ইউজার ব্যবস্থাপনা (User Management)</option>
                <option value="Land_Management">ভূমি ব্যবস্থাপনা (Land Management)</option>
                <option value="Auth">প্রবেশ ও নিরাপত্তা (Auth)</option>
                <option value="System">সিস্টেম কন্ট্রোল (System)</option>
              </select>
            </div>

            {/* Reset button */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '9px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ফিল্টার মুছুন
              </button>
            </div>
          </div>
        </form>

        {/* ACTIVE FILTER PILLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
          <span>সক্রিয় ফিল্টার:</span>
          {roleFilter !== 'all' && (
            <span style={{ padding: '3px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: '999px', border: '1px solid #bfdbfe', fontWeight: '700' }}>
              রোল: {roleFilter}
            </span>
          )}
          {moduleFilter !== 'all' && (
            <span style={{ padding: '3px 10px', background: '#f5f3ff', color: '#6d28d9', borderRadius: '999px', border: '1px solid #ddd6fe', fontWeight: '700' }}>
              মডিউল: {moduleFilter}
            </span>
          )}
          {search && (
            <span style={{ padding: '3px 10px', background: '#fef3c7', color: '#92400e', borderRadius: '999px', border: '1px solid #fde68a', fontWeight: '700' }}>
              সার্চ: "{search}"
            </span>
          )}
          {(roleFilter === 'all' && moduleFilter === 'all' && !search) && (
            <span style={{ color: '#059669', fontWeight: '700' }}>সকল কার্যক্রম দৃশ্যমান</span>
          )}
          <span style={{ marginLeft: 'auto', fontWeight: '700', color: '#0f172a' }}>
            মোট পাওয়া গেছে: {totalCount} টি রেকর্ড
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. AUDIT LOG TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', color: '#334155', fontWeight: '800' }}>
                <th style={{ padding: '14px 18px', width: '170px' }}>সময় ও তারিখ</th>
                <th style={{ padding: '14px 18px', width: '220px' }}>ব্যবহারকারী / ভূমিকা</th>
                <th style={{ padding: '14px 18px', width: '170px' }}>কার্যক্রমের ধরন</th>
                <th style={{ padding: '14px 18px' }}>বিস্তারিত পরিবর্তন ও বিবরণ</th>
                <th style={{ padding: '14px 18px', width: '210px' }}>টার্গেট রিসোর্স</th>
                <th style={{ padding: '14px 18px', width: '120px' }}>উৎস / আইপি</th>
                <th style={{ padding: '14px 18px', width: '90px', textAlign: 'center' }}>মেটাডাটা</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px auto' }} />
                    অডিট লগ লোড হচ্ছে...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>কোনো অডিট রেকর্ড পাওয়া যায়নি</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const roleStyle = getRoleBadge(log.user_role);
                  const actionStyle = getActionBadge(log.action_type);

                  return (
                    <tr
                      key={log._id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>
                          {formatDateTime(log.timestamp)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {formatRelativeTime(log.timestamp)}
                        </div>
                      </td>

                      {/* Actor (User/Official) */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', color: '#0f172a' }}>
                              {log.user_name || 'সিস্টেম'}
                            </span>
                          </div>

                          <div>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: roleStyle.bg,
                              color: roleStyle.color,
                              border: `1px solid ${roleStyle.border}`,
                              fontWeight: '800'
                            }}>
                              {roleStyle.label}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                            {log.user_email}
                          </div>
                          {log.user_nid && (
                            <div style={{ fontSize: '11px', color: '#047857', fontFamily: 'monospace', fontWeight: '700' }}>
                              NID: {log.user_nid}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Type & Module */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: '800',
                          color: actionStyle.color,
                          background: `${actionStyle.color}15`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${actionStyle.color}30`
                        }}>
                          {actionStyle.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          মডিউল: {log.module}
                        </div>
                      </td>

                      {/* Detailed Description */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#1e293b', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: '600' }}>
                          {log.description}
                        </div>
                      </td>

                      {/* Target Resource */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        {log.target_resource ? (
                          <div style={{
                            fontSize: '12px',
                            padding: '6px 10px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            fontWeight: '600'
                          }}>
                            {log.target_resource}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                        )}
                      </td>

                      {/* IP & Status */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                          {log.ip_address || '127.0.0.1'}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '4px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: log.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'SUCCESS' ? '#166534' : '#991b1b',
                          fontWeight: '800'
                        }}>
                          {log.status || 'SUCCESS'}
                        </span>
                      </td>

                      {/* View metadata button */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          style={{
                            padding: '6px 10px',
                            background: '#f1f5f9',
                            color: '#1e40af',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={13} />
                          লগ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: '#f8fafc',
          borderTop: '1.5px solid #cbd5e1',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            পৃষ্ঠা <strong style={{ color: '#0f172a' }}>{page}</strong> / <strong>{totalPages}</strong> (মোট <strong>{totalCount}</strong> টি অডিট এন্ট্রি)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: (page <= 1 || loading) ? 'not-allowed' : 'pointer',
                color: (page <= 1 || loading) ? '#94a3b8' : '#0f172a'
              }}
            >
              <ChevronLeft size={14} /> পূর্ববর্তী
            </button>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: (page >= totalPages || loading) ? 'not-allowed' : 'pointer',
                color: (page >= totalPages || loading) ? '#94a3b8' : '#0f172a'
              }}
            >
              পরবর্তী <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. METADATA DETAIL MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1.5px solid #cbd5e1'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1.5px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  অডিট লগ বিস্তারিত বিবরণ (Audit Entry #{selectedLog._id?.slice(-8)})
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>কার্যক্রমের বিবরণ:</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                  {selectedLog.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px', fontSize: '13px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ব্যবহারকারী / কর্মকর্তা</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{selectedLog.user_name}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{selectedLog.user_email}</div>
                  {selectedLog.user_nid && <div style={{ fontSize: '11px', color: '#047857', fontFamily: 'monospace' }}>NID: {selectedLog.user_nid}</div>}
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ভূমিকা ও মডিউল</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{selectedLog.user_role}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>মডিউল: {selectedLog.module}</div>
                  <div style={{ fontSize: '11px', color: '#2563eb' }}>অ্যাকশন: {selectedLog.action_type}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>সময় ও আইপি</div>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{formatDateTime(selectedLog.timestamp)}</div>
                  <div style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>IP: {selectedLog.ip_address}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>টার্গেট রিসোর্স</div>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {selectedLog.target_resource || 'প্রযোজ্য নয়'}
                  </div>
                  <div style={{ fontSize: '11px', color: selectedLog.status === 'SUCCESS' ? '#16a34a' : '#dc2626', fontWeight: '800' }}>
                    স্থিতি: {selectedLog.status}
                  </div>
                </div>
              </div>

              {/* JSON Details */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                  সংরক্ষিত প্রযুক্তিগত মেটাডাটা ও ডিটেইলস (JSON Payload):
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  lineHeight: '1.5',
                  maxHeight: '260px'
                }}>
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 20px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

