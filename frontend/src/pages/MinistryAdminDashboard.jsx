import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Layers, AlertTriangle, Plus, Edit, Trash2, CheckCircle, XCircle, Search, RefreshCw, Database, Key, Check, MapPin, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
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
  const navItems = [
    {
      id: 'overview',
      label: 'সিস্টেম ওভারভিউ ও অ্যানালিটিক্স',
      icon: Shield,
    },
    {
      id: 'users',
      label: 'ইউজার ও কর্মকর্তা ম্যানেজমেন্ট',
      icon: Users,
      badge: users.length,
      badgeColor: '#6d28d9',
      badgeBg: '#f5f3ff'
    },
    {
      id: 'lands',
      label: 'ভূমি ডাটা ও আইনি স্ট্যাটাস',
      icon: Layers,
      badge: lands.length,
      badgeColor: '#047857',
      badgeBg: '#ecfdf5'
    },
    {
      id: 'controls',
      label: 'সিস্টেম কন্ট্রোল ও ডেটাবেস রিসেট',
      icon: Database,
    }
  ];

  const statItems = [
    { label: 'মোট ব্যবহারকারী', value: stats?.totalUsers || users.length, color: '#6d28d9' },
    { label: 'মোট ভূমি রেকর্ড', value: stats?.totalLands || lands.length, color: '#047857' },
    { label: 'পেন্ডিং মিউটেশন', value: stats?.pendingMutations || 0, color: '#b45309' },
    { label: 'প্রতিরোধকৃত ফ্রড', value: stats?.totalFraudAttempts || 0, color: '#dc2626' },
  ];

  return (
    <DashboardLayout
      title="ভূমি মন্ত্রণালয় - কেন্দ্রীয় প্রশাসন (Super Admin)"
      subtitle={`প্রশাসক: ${user?.name || 'মন্ত্রণালয় এডমিন'} | ইমেইল: ${user?.email || 'admin@evhumi.gov.bd'} | কেন্দ্রীয় জাতীয় পোর্টাল`}
      badge={{ label: 'Super Admin' }}
      icon={Shield}
      roleTheme="purple"
      stats={statItems}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={actionMessage && (
        <div style={{
          padding: '8px 16px',
          background: '#dcfce7',
          border: '1.5px solid #86efac',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} /> {actionMessage}
        </div>
      )}
    >

      {/* TAB 1: System Overview */}
      {activeTab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #2563eb', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>মোট নিবন্ধিত ব্যবহারকারী</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#1d4ed8', margin: '6px 0' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>নাগরিক ও কর্মকর্তা মিলিয়ে</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #059669', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>মোট সংরক্ষিত জমি</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#047857', margin: '6px 0' }}>
                {stats.totalLands}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>সক্রিয় রেকর্ড: {stats.activeLands}টি</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #d97706', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>পেন্ডিং জমি বরাদ্দ (AC Land)</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#b45309', margin: '6px 0' }}>
                {stats.pendingAssignments}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>অনুমোদিত বরাদ্দ: {stats.approvedAssignments}টি</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #7c3aed', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>পেন্ডিং ই-নামজারি</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#6d28d9', margin: '6px 0' }}>
                {stats.pendingMutations}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>মিউটেশন প্রক্রিয়ারধীন</div>
            </div>

            <div className="glass-card" style={{ padding: '22px', borderTop: '4px solid #dc2626', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: '700' }}>সনাক্তকৃত জালিয়াতির চেষ্টা</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#b91c1c', margin: '6px 0' }}>
                {stats.totalFraudAttempts}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>P3 ইঞ্জিন দ্বারা প্রতিরোধকৃত</div>
            </div>
          </div>

          {/* User distribution by role */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
              👥 রোলের ভিত্তিতে ব্যবহারকারী বণ্টন
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {stats.usersByRole?.map((r) => (
                <div key={r._id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{r._id}</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#6d28d9', marginTop: '4px' }}>{r.count} জন</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Users Management & Role Switcher */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                ব্যবহারকারী ব্যবস্থাপনা ও ভূমিকা পরিবর্তন (CRUD Operation)
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
                মন্ত্রণালয় এডমিন যেকোনো ব্যবহারকারীর রোল পরিবর্তন করে 'Register Office' বা 'AC Land Office' এ রূপান্তর করতে পারেন
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddUserModal(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> নতুন ইউজার/কর্মকর্তা যোগ করুন
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
                style={{ width: '100%', fontSize: '13px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 14px', borderRadius: '8px' }}
              />
            </div>

            <select
              className="input-field"
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setTimeout(fetchUsers, 50);
              }}
              style={{ minWidth: '180px', fontSize: '13px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }}
            >
              <option value="">সব রোল (All Roles)</option>
              <option value="User">User (নাগরিক)</option>
              <option value="Register Office">Register Office (সাব-রেজিস্ট্রি)</option>
              <option value="AC Land Office">AC Land Office (এসি ল্যান্ড)</option>
              <option value="Super Admin">Super Admin (মন্ত্রণালয়)</option>
            </select>

            <button onClick={fetchUsers} className="btn-secondary" style={{ padding: '9px 18px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700' }}>
              খুঁজুন
            </button>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc', fontWeight: '700' }}>
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
                  <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>{u.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        পিতা: {u.father_name} | মাতা: {u.mother_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontFamily: 'monospace', color: '#047857', fontWeight: '700' }}>{u.nid}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.upazila}, {u.district}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: '#0f172a', fontWeight: '600' }}>{u.phone}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {/* ROLE SWITCHER DROPDOWN */}
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: u.role === 'Super Admin' ? '#fdf2f8' : u.role === 'Register Office' ? '#eff6ff' : u.role === 'AC Land Office' ? '#ecfdf5' : '#fffbeb',
                          border: `1.5px solid ${u.role === 'Super Admin' ? '#f472b6' : u.role === 'Register Office' ? '#93c5fd' : u.role === 'AC Land Office' ? '#6ee7b7' : '#fde047'}`,
                          color: u.role === 'Super Admin' ? '#9d174d' : u.role === 'Register Office' ? '#1e40af' : u.role === 'AC Land Office' ? '#065f46' : '#92400e',
                          fontWeight: '800',
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
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: u.status === 'Active' ? '1px solid #86efac' : '1px solid #fca5a5',
                          background: u.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: u.status === 'Active' ? '#047857' : '#991b1b',
                          cursor: 'pointer'
                        }}
                      >
                        {u.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
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
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  নতুন ব্যবহারকারী বা কর্মকর্তা তৈরি
                </h3>

                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>নাম *</label>
                      <input type="text" required className="input-field" value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>NID *</label>
                      <input type="text" required className="input-field" value={newUser.nid} onChange={(e) => setNewUser(p => ({ ...p, nid: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>পিতার নাম *</label>
                      <input type="text" required className="input-field" value={newUser.father_name} onChange={(e) => setNewUser(p => ({ ...p, father_name: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মাতার নাম *</label>
                      <input type="text" required className="input-field" value={newUser.mother_name} onChange={(e) => setNewUser(p => ({ ...p, mother_name: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>ইমেইল *</label>
                      <input type="email" required className="input-field" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>ফোন *</label>
                      <input type="tel" required className="input-field" value={newUser.phone} onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>

                  {/* Administrative Address Cascade for Bangladesh */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#047857', fontWeight: '800', marginBottom: '8px' }}>
                      📍 ঠিকানা নির্ধারণ (বিভাগ ➔ জেলা ➔ উপজেলা)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>বিভাগ *</label>
                        <select className="input-field" value={newUser.division} onChange={(e) => handleAdminUserDivisionChange(e.target.value)} style={{ width: '100%', fontSize: '12px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}>
                          {BANGLADESH_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>জেলা *</label>
                        <select className="input-field" value={newUser.district} onChange={(e) => handleAdminUserDistrictChange(e.target.value)} style={{ width: '100%', fontSize: '12px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}>
                          {adminUserDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>উপজেলা *</label>
                        <select className="input-field" value={newUser.upazila} onChange={(e) => setNewUser(p => ({ ...p, upazila: e.target.value }))} style={{ width: '100%', fontSize: '12px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}>
                          {adminUserUpazilas.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>পাসওয়ার্ড *</label>
                      <input type="password" required className="input-field" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>নির্ধারিত রোল *</label>
                      <select className="input-field" value={newUser.role} onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }}>
                        <option value="User">User (নাগরিক)</option>
                        <option value="Register Office">Register Office (সাব-রেজিস্ট্রি)</option>
                        <option value="AC Land Office">AC Land Office (এসি ল্যান্ড)</option>
                        <option value="Super Admin">Super Admin (মন্ত্রণালয়)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-secondary" style={{ padding: '8px 18px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', borderRadius: '8px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>সংরক্ষণ করুন</button>
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
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  ব্যবহারকারী তথ্য সম্পাদনা
                </h3>

                <form onSubmit={handleSaveEditedUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>নাম</label>
                    <input type="text" className="input-field" value={editingUser.name} onChange={(e) => setEditingUser(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>ফোন নম্বর</label>
                    <input type="tel" className="input-field" value={editingUser.phone} onChange={(e) => setEditingUser(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>রোল (Role)</label>
                    <select className="input-field" value={editingUser.role} onChange={(e) => setEditingUser(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }}>
                      <option value="User">User (নাগরিক)</option>
                      <option value="Register Office">Register Office</option>
                      <option value="AC Land Office">AC Land Office</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ padding: '8px 18px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', borderRadius: '8px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>আপডেট নিশ্চিত করুন</button>
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
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  ভূমি রেকর্ড ডাটাবেজ (Land Records CRUD)
                </h2>
                <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>সিস্টেমের সমস্ত জমির রেকর্ড পর্যবেক্ষণ ও সংশোধন</p>
              </div>
              <button onClick={() => setShowAddLandModal(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> নতুন জমির রেকর্ড যুক্ত করুন
              </button>
            </div>

            {/* Lands table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc', fontWeight: '700' }}>
                    <th style={{ padding: '12px 10px' }}>দাগ ও খতিয়ান</th>
                    <th style={{ padding: '12px 10px' }}>মৌজা ও জে.এল</th>
                    <th style={{ padding: '12px 10px' }}>মালিক ও এনআইডি</th>
                    <th style={{ padding: '12px 10px' }}>পরিমাণ (শতক)</th>
                    <th style={{ padding: '12px 10px' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>একশন</th>
                  </tr>
                </thead>
                <tbody>
                  {lands.map((l) => (
                    <tr key={l._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ color: '#0f172a' }}>দাগ: <strong style={{ color: '#059669' }}>{l.dag_no}</strong> | খতিয়ান: <strong style={{ color: '#059669' }}>{l.khatian_no}</strong></div>
                      </td>
                      <td style={{ padding: '12px 10px', color: '#0f172a', fontWeight: '600' }}>
                        {l.mouza} (জে.এল: {l.jl_no})
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <strong style={{ color: '#0f172a' }}>{l.owner_name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{l.owner_nid}</div>
                      </td>
                      <td style={{ padding: '12px 10px', color: '#059669', fontWeight: '800' }}>
                        {l.total_area_decimal} শতক
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: l.status === 'Active' ? '#dcfce7' : '#fef3c7',
                          color: l.status === 'Active' ? '#047857' : '#92400e',
                          border: `1px solid ${l.status === 'Active' ? '#86efac' : '#fde68a'}`
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setEditingLand(l)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}>
                            <Edit size={13} />
                          </button>
                          <button onClick={() => handleDeleteLand(l._id)} className="btn-danger" style={{ padding: '5px 10px', fontSize: '11px' }}>
                            <Trash2 size={13} />
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
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  আইনি স্থিতি ও খাস জমি নোটিশ (Legal Statuses)
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>খাস জমি, মামলার স্টে অর্ডার বা সরকারি অধিগ্রহণ রেকর্ড</p>
              </div>
              <button onClick={() => setShowAddLegalModal(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> আইনি নোটিশ যুক্ত করুন
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {legalStatuses.map((leg) => (
                <div key={leg._id} style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#991b1b', fontSize: '14px' }}>
                      দাগ নং {leg.dag_no} ({leg.mouza})
                    </strong>
                    <button onClick={() => handleDeleteLegal(leg._id)} className="btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>
                      মুছুন
                    </button>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569' }}>
                    {leg.is_khas && <div style={{ color: '#dc2626', fontWeight: '700' }}>🚫 সরকারি খাস জমি: {leg.khas_reason}</div>}
                    {leg.has_court_case && <div style={{ color: '#d97706', fontWeight: '700', marginTop: '2px' }}>⚖️ বিচারাধীন মামলা: {leg.case_details}</div>}
                    {leg.stay_order && <div style={{ color: '#b91c1c', fontWeight: '800', marginTop: '2px' }}>⛔ আদালতের Stay Order সক্রিয়</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Land Modal */}
          {showAddLandModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '550px', width: '100%', padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  নতুন জমির রেকর্ড তৈরি
                </h3>
                <form onSubmit={handleCreateLand} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মৌজা</label>
                      <input type="text" required className="input-field" value={newLand.mouza} onChange={(e) => setNewLand(p => ({ ...p, mouza: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>দাগ নং</label>
                      <input type="text" required className="input-field" value={newLand.dag_no} onChange={(e) => setNewLand(p => ({ ...p, dag_no: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>খতিয়ান নং</label>
                      <input type="text" required className="input-field" value={newLand.khatian_no} onChange={(e) => setNewLand(p => ({ ...p, khatian_no: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>জে.এল নং</label>
                      <input type="text" required className="input-field" value={newLand.jl_no} onChange={(e) => setNewLand(p => ({ ...p, jl_no: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মালিকের নাম</label>
                      <input type="text" required className="input-field" value={newLand.owner_name} onChange={(e) => setNewLand(p => ({ ...p, owner_name: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মালিকের NID</label>
                      <input type="text" required className="input-field" value={newLand.owner_nid} onChange={(e) => setNewLand(p => ({ ...p, owner_nid: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মোট পরিমাণ (শতক)</label>
                    <input type="number" required className="input-field" value={newLand.total_area_decimal} onChange={(e) => setNewLand(p => ({ ...p, total_area_decimal: parseFloat(e.target.value) || 0, available_area_decimal: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="button" onClick={() => setShowAddLandModal(false)} className="btn-secondary" style={{ padding: '8px 18px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', borderRadius: '8px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>সংরক্ষণ</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Legal Modal */}
          {showAddLegalModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: '20px'
            }}>
              <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  আইনি নোটিশ যুক্তকরণ
                </h3>
                <form onSubmit={handleCreateLegal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>দাগ নং *</label>
                      <input type="text" required className="input-field" value={newLegal.dag_no} onChange={(e) => setNewLegal(p => ({ ...p, dag_no: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>মৌজা *</label>
                      <input type="text" required className="input-field" value={newLegal.mouza} onChange={(e) => setNewLegal(p => ({ ...p, mouza: e.target.value }))} style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={newLegal.is_khas} onChange={(e) => setNewLegal(p => ({ ...p, is_khas: e.target.checked }))} /> এটি সরকারি খাস জমি
                    </label>
                    {newLegal.is_khas && (
                      <input type="text" placeholder="খাস জমির বিবরণ/অধিগ্রহণ কারণ" className="input-field" value={newLegal.khas_reason} onChange={(e) => setNewLegal(p => ({ ...p, khas_reason: e.target.value }))} style={{ width: '100%', marginTop: '6px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={newLegal.has_court_case} onChange={(e) => setNewLegal(p => ({ ...p, has_court_case: e.target.checked }))} /> আদালতে মামলা রয়েছে
                    </label>
                    {newLegal.has_court_case && (
                      <input type="text" placeholder="মামলা নম্বর ও আদালতের বিবরণ" className="input-field" value={newLegal.case_details} onChange={(e) => setNewLegal(p => ({ ...p, case_details: e.target.value }))} style={{ width: '100%', marginTop: '6px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={newLegal.stay_order} onChange={(e) => setNewLegal(p => ({ ...p, stay_order: e.target.checked }))} /> Stay Order সক্রিয়
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddLegalModal(false)} className="btn-secondary" style={{ padding: '8px 18px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', borderRadius: '8px' }}>বাতিল</button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>সংরক্ষণ</button>
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
          <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color="#7c3aed" /> ডেমো ডেটাবেজ রিসেট ও পুনর্নির্মাণ
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
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

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
              🔑 ৪টি রোলের স্থায়ী ক্রেডেনশিয়াল রেফারেন্স
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ background: '#fdf2f8', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #fbcfe8', color: '#9d174d', fontWeight: '600' }}>
                👑 <strong>Super Admin:</strong> admin@gmail.com | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #bfdbfe', color: '#1e40af', fontWeight: '600' }}>
                🏛️ <strong>Register Office:</strong> registry@evhumi.gov.bd | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #a7f3d0', color: '#065f46', fontWeight: '600' }}>
                ⚖️ <strong>AC Land Office:</strong> acland@evhumi.gov.bd | পাসওয়ার্ড: 123456
              </div>
              <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #fde68a', color: '#92400e', fontWeight: '600' }}>
                👤 <strong>Citizen User:</strong> citizen@example.com | পাসওয়ার্ড: 123456 (NID: 1998567890123)
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
