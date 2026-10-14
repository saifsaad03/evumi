import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Layers, AlertTriangle, Plus, Edit, Trash2, CheckCircle, XCircle, Search, RefreshCw, Database, Key, Check, MapPin } from 'lucide-react';
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict
} from '../utils/geoData';

export default function MinistryAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'lands' | 'controls'

  // Stats
  const [stats, setStats] = useState(null);

  // Users Management
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Admin Add User cascade state
  const [adminUserDistricts, setAdminUserDistricts] = useState(getDistrictsForDivision('রাজশাহী'));
  const [adminUserUpazilas, setAdminUserUpazilas] = useState(getUpazilasForDistrict('বগুড়া'));
  const [newUser, setNewUser] = useState({
    name: '',
    father_name: '',
    mother_name: '',
    nid: '',
    division: 'রাজশাহী',
    district: 'বগুড়া',
    upazila: 'শিবগঞ্জ',
    phone: '',
    email: '',
    password: '123456',
    role: 'User'
  });

  const handleAdminUserDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const defDist = districts[0] || '';
    const upazilas = getUpazilasForDistrict(defDist);
    const defUpz = upazilas[0] || '';
    setAdminUserDistricts(districts);
    setAdminUserUpazilas(upazilas);
    setNewUser(p => ({ ...p, division: div, district: defDist, upazila: defUpz }));
  };

  const handleAdminUserDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const defUpz = upazilas[0] || '';
    setAdminUserUpazilas(upazilas);
    setNewUser(p => ({ ...p, district: dist, upazila: defUpz }));
  };

  // Land Management
  const [lands, setLands] = useState([]);
  const [landSearch, setLandSearch] = useState('');
  const [editingLand, setEditingLand] = useState(null);
  const [showAddLandModal, setShowAddLandModal] = useState(false);
  const [newLand, setNewLand] = useState({
    mouza: 'ধানমন্ডি',
    jl_no: '54',
    khatian_no: '',
    dag_no: '',
    owner_name: '',
    owner_nid: '',
    total_area_decimal: 10,
    available_area_decimal: 10,
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    status: 'Active'
  });

  // Legal Status
  const [legalStatuses, setLegalStatuses] = useState([]);
  const [showAddLegalModal, setShowAddLegalModal] = useState(false);
  const [newLegal, setNewLegal] = useState({
    dag_no: '',
    mouza: '',
    jl_no: '54',
    is_khas: false,
    khas_reason: '',
    has_court_case: false,
    case_details: '',
    stay_order: false
  });

  // Seed status
  const [seeding, setSeeding] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchLands();
    fetchLegalStatuses();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (userRoleFilter) params.role = userRoleFilter;
      if (userSearch) params.search = userSearch;
      const res = await axios.get('/api/admin/users', { params });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchLands = async () => {
    try {
      const params = {};
      if (landSearch) params.search = landSearch;
      const res = await axios.get('/api/admin/lands', { params });
      if (res.data.success) setLands(res.data.data);
    } catch (err) {
      console.error('Failed to load lands:', err);
    }
  };

  const fetchLegalStatuses = async () => {
    try {
      const res = await axios.get('/api/admin/legal-statuses');
      if (res.data.success) setLegalStatuses(res.data.data);
    } catch (err) {
      console.error('Failed to load legal statuses:', err);
    }
  };

  // Change user role directly
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}`, { role: newRole });
      if (res.data.success) {
        showFeedback(`ইউজারের রোল পরিবর্তিত হয়ে '${newRole}' হয়েছে!`);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'রোল পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  // Toggle user status
  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try {
      const res = await axios.put(`/api/admin/users/${userId}`, { status: newStatus });
      if (res.data.success) {
        showFeedback(`ইউজার স্ট্যাটাস: '${newStatus}'`);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'স্ট্যাটাস আপডেট ব্যর্থ');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ইউজারকে ডিলিট করতে চান?')) return;
    try {
      const res = await axios.delete(`/api/admin/users/${userId}`);
      if (res.data.success) {
        showFeedback('ইউজার মুছে ফেলা হয়েছে!');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ডিলিট ব্যর্থ হয়েছে');
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/users', newUser);
      if (res.data.success) {
        showFeedback('নতুন ব্যবহারকারী তৈরি হয়েছে!');
        setShowAddUserModal(false);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'তৈরি ব্যর্থ হয়েছে');
    }
  };

  // Save edited user
  const handleSaveEditedUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/admin/users/${editingUser._id}`, editingUser);
      if (res.data.success) {
        showFeedback('ইউজার তথ্য আপডেট হয়েছে!');
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'আপডেট ব্যর্থ');
    }
  };

  // Create Land
  const handleCreateLand = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/lands', newLand);
      if (res.data.success) {
        showFeedback('নতুন জমি সফলভাবে সংরক্ষিত হয়েছে!');
        setShowAddLandModal(false);
        fetchLands();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'জমি তৈরি ব্যর্থ');
    }
  };

  // Delete Land
  const handleDeleteLand = async (landId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই জমির রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      const res = await axios.delete(`/api/admin/lands/${landId}`);
      if (res.data.success) {
        showFeedback('জমির রেকর্ড মুছে ফেলা হয়েছে!');
        fetchLands();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ডিলিট ব্যর্থ');
    }
  };

  // Save edited land
  const handleSaveEditedLand = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/admin/lands/${editingLand._id}`, editingLand);
      if (res.data.success) {
        showFeedback('জমির রেকর্ড আপডেট হয়েছে!');
        setEditingLand(null);
        fetchLands();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'আপডেট ব্যর্থ');
    }
  };

  // Create Legal Status
  const handleCreateLegal = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/legal-statuses', newLegal);
      if (res.data.success) {
        showFeedback('আইনি নোটিশ সংরক্ষিত হয়েছে!');
        setShowAddLegalModal(false);
        fetchLegalStatuses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'সংরক্ষণ ব্যর্থ');
    }
  };

  // Delete Legal Status
  const handleDeleteLegal = async (id) => {
    if (!window.confirm('এই আইনি স্ট্যাটাসটি মুছে ফেলতে চান?')) return;
    try {
      const res = await axios.delete(`/api/admin/legal-statuses/${id}`);
      if (res.data.success) {
        showFeedback('আইনি নোটিশ মুছে ফেলা হয়েছে!');
        fetchLegalStatuses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'মুছে ফেলা ব্যর্থ');
    }
  };

  // Seed demo data
  const handleSeedDatabase = async () => {
    if (!window.confirm('এটি সমস্ত ডেটা রিসেট করে ৪টি রোলের ডেমো ডেটা ও জমি পুনর্নির্মাণ করবে। চালিয়ে যাবেন?')) return;
    setSeeding(true);
    try {
      const res = await axios.post('/api/seed');
      if (res.data.success) {
        showFeedback(res.data.message);
        fetchStats();
        fetchUsers();
        fetchLands();
        fetchLegalStatuses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'সিড ব্যর্থ হয়েছে');
    } finally {
      setSeeding(false);
    }
  };

  const showFeedback = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1400px', margin: '30px auto', padding: '0 24px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{
        padding: '24px 30px',
        marginBottom: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        borderLeft: '4px solid #ec4899'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #be185d, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Shield size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                ভূমি মন্ত্রণালয় - কেন্দ্রীয় প্রশাসন (Super Admin)
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#f472b6',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                fontWeight: '700'
              }}>
                Super Admin Role
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
              প্রশাসক: <strong style={{ color: '#cbd5e1' }}>{user?.name}</strong> | ইমেইল: <span style={{ fontFamily: 'monospace', color: '#f472b6' }}>{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionMessage && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '8px',
            color: '#86efac',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} /> {actionMessage}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px',
        paddingBottom: '4px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'overview', label: '📊 সিস্টেম ওভারভিউ', icon: Shield },
          { id: 'users', label: `👥 ইউজার ম্যানেজমেন্ট ও রোল পরিবর্তন (${users.length})`, icon: Users },
          { id: 'lands', label: `🗺️ ভূমি ডাটা ও আইনি স্ট্যাটাস (${lands.length})`, icon: Layers },
          { id: 'controls', label: '⚙️ পূর্ণ সিস্টেম কন্ট্রোল ও রিসেট', icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: activeTab === tab.id ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              border: activeTab === tab.id ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid transparent',
              color: activeTab === tab.id ? '#f472b6' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: System Overview */}
      {activeTab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="glass-card" style={{ padding: '22px', borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>মোট নিবন্ধিত ব্যবহারকারী</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#60a5fa', margin: '6px 0' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>নাগরিক ও কর্মকর্তা মিলিয়ে</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '3px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>মোট সংরক্ষিত জমি</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#34d399', margin: '6px 0' }}>
                {stats.totalLands}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>সক্রিয় রেকর্ড: {stats.activeLands}টি</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>পেন্ডিং জমি বরাদ্দ (AC Land)</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#fbbf24', margin: '6px 0' }}>
                {stats.pendingAssignments}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>অনুমোদিত বরাদ্দ: {stats.approvedAssignments}টি</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>পেন্ডিং ই-নামজারি</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#a78bfa', margin: '6px 0' }}>
                {stats.pendingMutations}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>মিউটেশন প্রক্রিয়ারধীন</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '3px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>সনাক্তকৃত জালিয়াতির চেষ্টা</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#f87171', margin: '6px 0' }}>
                {stats.totalFraudAttempts}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>P3 ইঞ্জিন দ্বারা প্রতিরোধকৃত</div>
            </div>
          </div>

          {/* User distribution by role */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', marginBottom: '16px' }}>
              👥 রোলের ভিত্তিতে ব্যবহারকারী বণ্টন
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {stats.usersByRole?.map((r) => (
                <div key={r._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{r._id}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#f472b6', marginTop: '4px' }}>{r.count} জন</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Users Management & Role Switcher */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                ব্যবহারকারী ব্যবস্থাপনা ও ভূমিকা পরিবর্তন (CRUD Operation)
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                মন্ত্রণালয় এডমিন যেকোনো ব্যবহারকারীর রোল পরিবর্তন করে 'Register Office' বা 'AC Land Office' এ রূপান্তর করতে পারেন
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddUserModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> নতুন ইউজার/কর্মকর্তা যোগ করুন
              </button>
            </div>
          </div>

          {/* Search & Role Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="নাম, NID, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <select
              className="input-field"
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setTimeout(fetchUsers, 50);
              }}
              style={{ minWidth: '180px', fontSize: '13px' }}
            >
              <option value="">সব রোল (All Roles)</option>
              <option value="User">User (নাগরিক)</option>
              <option value="Register Office">Register Office (সাব-রেজিস্ট্রি)</option>
              <option value="AC Land Office">AC Land Office (এসি ল্যান্ড)</option>
              <option value="Super Admin">Super Admin (মন্ত্রণালয়)</option>
            </select>

            <button onClick={fetchUsers} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
              খুঁজুন
            </button>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>ব্যবহারকারী</th>
                  <th style={{ padding: '12px' }}>NID ও ঠিকানা</th>
                  <th style={{ padding: '12px' }}>যোগাযোগ</th>
                  <th style={{ padding: '12px' }}>বর্তমান রোল (Role Switcher)</th>
                  <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#f1f5f9' }}>{u.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        পিতা: {u.father_name} | মাতা: {u.mother_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontFamily: 'monospace', color: '#22c55e', fontWeight: '600' }}>{u.nid}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.upazila}, {u.district}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: '#cbd5e1' }}>{u.phone}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {/* ROLE SWITCHER DROPDOWN */}
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: u.role === 'Super Admin' ? 'rgba(236,72,153,0.15)' : u.role === 'Register Office' ? 'rgba(59,130,246,0.15)' : u.role === 'AC Land Office' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          border: `1px solid ${u.role === 'Super Admin' ? '#ec4899' : u.role === 'Register Office' ? '#3b82f6' : u.role === 'AC Land Office' ? '#10b981' : '#f59e0b'}50`,
                          color: u.role === 'Super Admin' ? '#f472b6' : u.role === 'Register Office' ? '#93c5fd' : u.role === 'AC Land Office' ? '#6ee7b7' : '#fde047',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="User">User (নাগরিক)</option>
                        <option value="Register Office">Register Office</option>
                        <option value="AC Land Office">AC Land Office</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleStatusToggle(u._id, u.status)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: u.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.status === 'Active' ? '#86efac' : '#fca5a5',
                          border: `1px solid ${u.status === 'Active' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {u.status === 'Active' ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px' }}
                          title="সম্পাদনা"
                        >
                          <Edit size={13} />
                        </button>
                        {u.email !== 'admin@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="btn-danger"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Modal */}
          {showAddUserModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '16px' }}>
                  নতুন ব্যবহারকারী বা কর্মকর্তা তৈরি
                </h3>

                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>নাম *</label>
                      <input type="text" required className="input-field" value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>NID *</label>
                      <input type="text" required className="input-field" value={newUser.nid} onChange={(e) => setNewUser(p => ({ ...p, nid: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>পিতার নাম *</label>
                      <input type="text" required className="input-field" value={newUser.father_name} onChange={(e) => setNewUser(p => ({ ...p, father_name: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মাতার নাম *</label>
                      <input type="text" required className="input-field" value={newUser.mother_name} onChange={(e) => setNewUser(p => ({ ...p, mother_name: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>ইমেইল *</label>
                      <input type="email" required className="input-field" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>ফোন *</label>
                      <input type="tel" required className="input-field" value={newUser.phone} onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Administrative Address Cascade for Bangladesh */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '11px', color: '#86efac', fontWeight: '700', marginBottom: '8px' }}>
                      📍 ঠিকানা নির্ধারণ (বিভাগ ➔ জেলা ➔ উপজেলা)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>বিভাগ *</label>
                        <select className="input-field" value={newUser.division} onChange={(e) => handleAdminUserDivisionChange(e.target.value)} style={{ width: '100%', fontSize: '12px' }}>
                          {BANGLADESH_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>জেলা *</label>
                        <select className="input-field" value={newUser.district} onChange={(e) => handleAdminUserDistrictChange(e.target.value)} style={{ width: '100%', fontSize: '12px' }}>
                          {adminUserDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8' }}>উপজেলা *</label>
                        <select className="input-field" value={newUser.upazila} onChange={(e) => setNewUser(p => ({ ...p, upazila: e.target.value }))} style={{ width: '100%', fontSize: '12px' }}>
                          {adminUserUpazilas.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>পাসওয়ার্ড *</label>
                      <input type="password" required className="input-field" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>নির্ধারিত রোল *</label>
                      <select className="input-field" value={newUser.role} onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))} style={{ width: '100%' }}>
                        <option value="User">User (নাগরিক)</option>
                        <option value="Register Office">Register Office (সাব-রেজিস্ট্রি)</option>
                        <option value="AC Land Office">AC Land Office (এসি ল্যান্ড)</option>
                        <option value="Super Admin">Super Admin (মন্ত্রণালয়)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>সংরক্ষণ করুন</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '16px' }}>
                  ব্যবহারকারী তথ্য সম্পাদনা
                </h3>

                <form onSubmit={handleSaveEditedUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1' }}>নাম</label>
                    <input type="text" className="input-field" value={editingUser.name} onChange={(e) => setEditingUser(p => ({ ...p, name: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1' }}>ফোন নম্বর</label>
                    <input type="tel" className="input-field" value={editingUser.phone} onChange={(e) => setEditingUser(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1' }}>রোল (Role)</label>
                    <select className="input-field" value={editingUser.role} onChange={(e) => setEditingUser(p => ({ ...p, role: e.target.value }))} style={{ width: '100%' }}>
                      <option value="User">User (নাগরিক)</option>
                      <option value="Register Office">Register Office</option>
                      <option value="AC Land Office">AC Land Office</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>আপডেট নিশ্চিত করুন</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Land Records & Legal Status Management */}
      {activeTab === 'lands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Lands section */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  ভূমি রেকর্ড ডাটাবেজ (Land Records CRUD)
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b' }}>সিস্টেমের সমস্ত জমির রেকর্ড পর্যবেক্ষণ ও সংশোধন</p>
              </div>
              <button onClick={() => setShowAddLandModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> নতুন জমির রেকর্ড যুক্ত করুন
              </button>
            </div>

            {/* Lands table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>দাগ ও খতিয়ান</th>
                    <th style={{ padding: '10px' }}>মৌজা ও জে.এল</th>
                    <th style={{ padding: '10px' }}>মালিক ও এনআইডি</th>
                    <th style={{ padding: '10px' }}>পরিমাণ (শতক)</th>
                    <th style={{ padding: '10px' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>একশন</th>
                  </tr>
                </thead>
                <tbody>
                  {lands.map((l) => (
                    <tr key={l._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px' }}>
                        দাগ: <strong>{l.dag_no}</strong> | খতিয়ান: {l.khatian_no}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {l.mouza} (জে.এল: {l.jl_no})
                      </td>
                      <td style={{ padding: '10px' }}>
                        <strong>{l.owner_name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{l.owner_nid}</div>
                      </td>
                      <td style={{ padding: '10px', color: '#22c55e', fontWeight: '700' }}>
                        {l.total_area_decimal} শতক
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          background: l.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: l.status === 'Active' ? '#86efac' : '#fde047'
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setEditingLand(l)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleDeleteLand(l._id)} className="btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal status section */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  আইনি স্থিতি ও খাস জমি নোটিশ (Legal Statuses)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>খাস জমি, মামলার স্টে অর্ডার বা সরকারি অধিগ্রহণ রেকর্ড</p>
              </div>
              <button onClick={() => setShowAddLegalModal(true)} className="btn-primary" style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> আইনি নোটিশ যুক্ত করুন
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {legalStatuses.map((leg) => (
                <div key={leg._id} style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#fca5a5', fontSize: '14px' }}>
                      দাগ নং {leg.dag_no} ({leg.mouza})
                    </strong>
                    <button onClick={() => handleDeleteLegal(leg._id)} className="btn-danger" style={{ padding: '2px 6px', fontSize: '10px' }}>
                      মুছুন
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    {leg.is_khas && <div style={{ color: '#ef4444' }}>🚫 সরকারি খাস জমি: {leg.khas_reason}</div>}
                    {leg.has_court_case && <div style={{ color: '#f59e0b' }}>⚖️ বিচারাধীন মামলা: {leg.case_details}</div>}
                    {leg.stay_order && <div style={{ color: '#dc2626' }}>⛔ আদালতের Stay Order সক্রিয়</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Land Modal */}
          {showAddLandModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '550px', width: '100%', padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '14px' }}>
                  নতুন জমির রেকর্ড তৈরি
                </h3>
                <form onSubmit={handleCreateLand} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মৌজা</label>
                      <input type="text" required className="input-field" value={newLand.mouza} onChange={(e) => setNewLand(p => ({ ...p, mouza: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>দাগ নং</label>
                      <input type="text" required className="input-field" value={newLand.dag_no} onChange={(e) => setNewLand(p => ({ ...p, dag_no: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>খতিয়ান নং</label>
                      <input type="text" required className="input-field" value={newLand.khatian_no} onChange={(e) => setNewLand(p => ({ ...p, khatian_no: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>জে.এল নং</label>
                      <input type="text" required className="input-field" value={newLand.jl_no} onChange={(e) => setNewLand(p => ({ ...p, jl_no: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মালিকের নাম</label>
                      <input type="text" required className="input-field" value={newLand.owner_name} onChange={(e) => setNewLand(p => ({ ...p, owner_name: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মালিকের NID</label>
                      <input type="text" required className="input-field" value={newLand.owner_nid} onChange={(e) => setNewLand(p => ({ ...p, owner_nid: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মোট পরিমাণ (শতক)</label>
                    <input type="number" required className="input-field" value={newLand.total_area_decimal} onChange={(e) => setNewLand(p => ({ ...p, total_area_decimal: parseFloat(e.target.value) || 0, available_area_decimal: parseFloat(e.target.value) || 0 }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" onClick={() => setShowAddLandModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Legal Modal */}
          {showAddLegalModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '14px' }}>
                  আইনি নোটিশ যুক্তকরণ
                </h3>
                <form onSubmit={handleCreateLegal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>দাগ নং *</label>
                      <input type="text" required className="input-field" value={newLegal.dag_no} onChange={(e) => setNewLegal(p => ({ ...p, dag_no: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#cbd5e1' }}>মৌজা *</label>
                      <input type="text" required className="input-field" value={newLegal.mouza} onChange={(e) => setNewLegal(p => ({ ...p, mouza: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={newLegal.is_khas} onChange={(e) => setNewLegal(p => ({ ...p, is_khas: e.target.checked }))} /> এটি সরকারি খাস জমি
                    </label>
                    {newLegal.is_khas && (
                      <input type="text" placeholder="খাস জমির বিবরণ/অধিগ্রহণ কারণ" className="input-field" value={newLegal.khas_reason} onChange={(e) => setNewLegal(p => ({ ...p, khas_reason: e.target.value }))} style={{ width: '100%', marginTop: '6px' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={newLegal.has_court_case} onChange={(e) => setNewLegal(p => ({ ...p, has_court_case: e.target.checked }))} /> আদালতে মামলা রয়েছে
                    </label>
                    {newLegal.has_court_case && (
                      <input type="text" placeholder="মামলা নম্বর ও আদালতের বিবরণ" className="input-field" value={newLegal.case_details} onChange={(e) => setNewLegal(p => ({ ...p, case_details: e.target.value }))} style={{ width: '100%', marginTop: '6px' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={newLegal.stay_order} onChange={(e) => setNewLegal(p => ({ ...p, stay_order: e.target.checked }))} /> Stay Order সক্রিয়
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddLegalModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: System Control & Seed */}
      {activeTab === 'controls' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color="#f472b6" /> ডেমো ডেটাবেজ রিসেট ও পুনর্নির্মাণ
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              হ্যাকার্থন বা মূল্যায়নের জন্য যেকোনো সময় ডেটাবেজকে মূল অবস্থায় ফিরিয়ে নিন। এটি ৪টি প্রাথমিক ভূমিকা ইউজার (Admin, Register Office, AC Land, Citizen) এবং সকল ডেমো জমি ও আইনি নোটিশ নতুন করে তৈরি করবে।
            </p>

            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #be185d, #ec4899)'
              }}
            >
              <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} />
              {seeding ? 'রিসেট হচ্ছে...' : 'সব ডেটা রিসেট ও ৪টি রোলের ডেমো তৈরি করুন'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '14px' }}>
              🔑 ৪টি রোলের স্থায়ী ক্রেডেনশিয়াল রেফারেন্স
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: 'rgba(236,72,153,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(236,72,153,0.3)', color: '#fbcfe8' }}>
                👑 <strong>Super Admin:</strong> admin@gmail.com | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', color: '#bfdbfe' }}>
                🏛️ <strong>Register Office:</strong> registry@evhumi.gov.bd | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', color: '#a7f3d0' }}>
                ⚖️ <strong>AC Land Office:</strong> acland@evhumi.gov.bd | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a' }}>
                👤 <strong>Citizen User:</strong> citizen@example.com | পাসওয়ার্ড: 123456 (NID: 1998567890123)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
