import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, FileText, CheckCircle, ShieldCheck, AlertTriangle, 
  Fingerprint, Send, Plus, Trash2, Clock, Check, Search, Lock, 
  UserCheck, ShieldAlert, Layers, Sparkles, Building2, Eye, RefreshCw
} from 'lucide-react';

export default function BontonNamaRegistrySection() {
  const [subTab, setSubTab] = useState('death_cert'); // 'death_cert' | 'distribution' | 'history'

  // ─────────────────────────────────────────────────────────────
  // 1. Death Certificate Verification State
  // ─────────────────────────────────────────────────────────────
  const [deathForm, setDeathForm] = useState({
    certificate_no: `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    deceased_nid: '',
    deceased_name: '',
    deceased_phone: '',
    deceased_email: '',
    death_date: '',
    cause_of_death: 'বার্ধক্যজনিত / স্বাভাবিক মৃত্যু',
    issuing_authority: 'পৌরসভা / ইউনিয়ন পরিষদ',
    applicant_heir_name: '',
    applicant_heir_nid: '',
    applicant_heir_phone: '',
    relationship_with_deceased: 'পুত্র',
    remarks: ''
  });

  const [registeringDeath, setRegisteringDeath] = useState(false);
  const [deathSuccessMsg, setDeathSuccessMsg] = useState(null);
  const [deathErrorMsg, setDeathErrorMsg] = useState(null);
  const [deathCertificates, setDeathCertificates] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  // Search deceased owner before death registration (Must be found first!)
  const [deceasedSearchNid, setDeceasedSearchNid] = useState('');
  const [searchingDeceased, setSearchingDeceased] = useState(false);
  const [foundDeceasedUser, setFoundDeceasedUser] = useState(null);
  const [deceasedSearchError, setDeceasedSearchError] = useState(null);
  const [foundLandsCount, setFoundLandsCount] = useState(0);

  const handleSearchDeceasedUser = async () => {
    if (!deceasedSearchNid?.trim()) {
      setDeceasedSearchError('অনুগ্রহ করে মৃত ব্যক্তির NID নম্বর লিখুন।');
      return;
    }

    setSearchingDeceased(true);
    setDeceasedSearchError(null);
    setFoundDeceasedUser(null);

    try {
      const res = await axios.get(`/api/bonton/search-deceased/${encodeURIComponent(deceasedSearchNid.trim())}`);
      if (res.data.success && res.data.user) {
        setFoundDeceasedUser(res.data.user);
        setFoundLandsCount(res.data.lands_count || 0);
        setDeathForm(prev => ({
          ...prev,
          deceased_nid: res.data.user.nid,
          deceased_name: res.data.user.name,
          deceased_phone: res.data.user.phone || '',
          deceased_email: res.data.user.email || ''
        }));
      }
    } catch (err) {
      setFoundDeceasedUser(null);
      setDeceasedSearchError(err.response?.data?.message || 'প্রদত্ত NID-এর কোনো নাগরিক ডাটাবেজে পাওয়া যায়নি।');
    } finally {
      setSearchingDeceased(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. Bonton Nama Distribution State
  // ─────────────────────────────────────────────────────────────
  const [selectedDeceased, setSelectedDeceased] = useState(null);
  const [deceasedLands, setDeceasedLands] = useState([]);
  const [loadingLands, setLoadingLands] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);

  // Multi-heir list
  const [heirs, setHeirs] = useState([
    {
      id: 1,
      nid: '',
      name: '',
      phone: '',
      email: '',
      relationship: 'পুত্র',
      share_decimal: '',
      verifying: false,
      verified: false,
      verifyError: null,
      fpScanning: false,
      fpVerified: false
    }
  ]);

  // Distribution OTP
  const [bontonOtp, setBontonOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(null);
  const [otpErrorMsg, setOtpErrorMsg] = useState(null);
  const [submittingBonton, setSubmittingBonton] = useState(false);
  const [bontonSuccessMsg, setBontonSuccessMsg] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // 3. Applications History
  // ─────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchDeathCertificates();
    fetchApplications();
  }, []);

  const fetchDeathCertificates = async () => {
    setLoadingCerts(true);
    try {
      const res = await axios.get('/api/bonton/death-certificates');
      if (res.data.success) {
        setDeathCertificates(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load death certificates:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await axios.get('/api/bonton/applications');
      if (res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bonton applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  // Register & Approve Death Certificate
  const handleRegisterDeath = async (e) => {
    e.preventDefault();
    if (!foundDeceasedUser) {
      alert('অনুগ্রহ করে প্রথমে মৃত ব্যক্তির NID দিয়ে অনুসন্ধান করে নাগরিককে সনাক্ত (User Found) করুন!');
      return;
    }
    if (!deathForm.deceased_nid || !deathForm.deceased_name || !deathForm.death_date || !deathForm.applicant_heir_nid) {
      alert('সকল বাধ্যতামূলক তথ্য প্রদান করুন!');
      return;
    }

    setRegisteringDeath(true);
    setDeathSuccessMsg(null);
    setDeathErrorMsg(null);

    try {
      const res = await axios.post('/api/bonton/death-certificate', deathForm);
      if (res.data.success) {
        setDeathSuccessMsg(res.data.message);
        fetchDeathCertificates();
        setFoundDeceasedUser(null);
        setDeceasedSearchNid('');
        // Reset form
        setDeathForm({
          certificate_no: `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          deceased_nid: '',
          deceased_name: '',
          deceased_phone: '',
          deceased_email: '',
          death_date: '',
          cause_of_death: 'বার্ধক্যজনিত / স্বাভাবিক মৃত্যু',
          issuing_authority: 'পৌরসভা / ইউনিয়ন পরিষদ',
          applicant_heir_name: '',
          applicant_heir_nid: '',
          applicant_heir_phone: '',
          relationship_with_deceased: 'পুত্র',
          remarks: ''
        });
      }
    } catch (err) {
      setDeathErrorMsg(err.response?.data?.message || 'মৃত্যু সনদ অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setRegisteringDeath(false);
    }
  };

  // Select Deceased Owner to load lands
  const handleSelectDeceasedForDistribution = async (cert) => {
    setSelectedDeceased(cert);
    setSelectedLand(null);
    setLoadingLands(true);
    setSubTab('distribution');
    try {
      const res = await axios.get(`/api/bonton/deceased-lands/${encodeURIComponent(cert.deceased_nid)}`);
      if (res.data.success) {
        setDeceasedLands(res.data.data || []);
        if (res.data.data.length > 0) {
          setSelectedLand(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load deceased lands:', err);
    } finally {
      setLoadingLands(false);
    }
  };

  // Heir management
  const addHeir = () => {
    setHeirs(prev => [
      ...prev,
      {
        id: Date.now(),
        nid: '',
        name: '',
        phone: '',
        email: '',
        relationship: 'ওয়ারিশ',
        share_decimal: '',
        verifying: false,
        verified: false,
        verifyError: null,
        fpScanning: false,
        fpVerified: false
      }
    ]);
  };

  const removeHeir = (index) => {
    setHeirs(prev => prev.filter((_, i) => i !== index));
  };

  const updateHeir = (index, field, value) => {
    setHeirs(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const handleVerifyHeirAccount = async (index) => {
    const target = heirs[index];
    if (!target.nid?.trim()) {
      updateHeir(index, 'verifyError', 'ওয়ারিশের NID লিখুন।');
      return;
    }

    updateHeir(index, 'verifying', true);
    updateHeir(index, 'verifyError', null);

    try {
      const res = await axios.post('/api/bonton/verify-heir', { nid: target.nid.trim() });
      if (res.data.success && res.data.user) {
        setHeirs(prev => prev.map((h, i) => i === index ? {
          ...h,
          name: res.data.user.name,
          phone: res.data.user.phone || h.phone,
          email: res.data.user.email || h.email,
          verified: true,
          verifying: false,
          verifyError: null
        } : h));
      }
    } catch (err) {
      updateHeir(index, 'verified', false);
      updateHeir(index, 'verifying', false);
      updateHeir(index, 'verifyError', err.response?.data?.message || 'ওয়ারিশের অ্যাকাউন্ট পাওয়া যায়নি।');
    }
  };

  const handleSimulateHeirFingerprint = (index) => {
    updateHeir(index, 'fpScanning', true);
    setTimeout(() => {
      setHeirs(prev => prev.map((h, i) => i === index ? {
        ...h,
        fpScanning: false,
        fpVerified: true
      } : h));
    }, 1400);
  };

  // Total calculated decimal across heirs
  const totalAllocatedDecimal = heirs.reduce((sum, h) => sum + (parseFloat(h.share_decimal) || 0), 0);
  const landAvailableDecimal = selectedLand ? parseFloat(selectedLand.total_area_decimal || 0) : 0;
  const isAreaExceeded = totalAllocatedDecimal > landAvailableDecimal;

  // Send OTP to primary heir
  const handleSendBontonOtp = async () => {
    if (!selectedLand) {
      alert('অনুগ্রহ করে প্রথমে জমি নির্বাচন করুন!');
      return;
    }
    const primaryHeir = heirs.find(h => h.verified && h.email);
    if (!primaryHeir) {
      alert('কমপক্ষে একজন ওয়ারিশের অ্যাকাউন্ট যাচাই সম্পন্ন এবং ইমেইল নিশ্চিত থাকতে হবে!');
      return;
    }

    setSendingOtp(true);
    setOtpSentMsg(null);
    setOtpErrorMsg(null);

    try {
      const res = await axios.post('/api/bonton/send-heir-otp', {
        heir_email: primaryHeir.email,
        heir_name: primaryHeir.name,
        heir_nid: primaryHeir.nid,
        dag_no: selectedLand.dag_no,
        mouza: selectedLand.mouza,
        khatian_no: selectedLand.khatian_no
      });
      if (res.data.success) {
        setOtpSentMsg(res.data.message || `ওটিপি সফলভাবে পাঠানো হয়েছে: ${primaryHeir.email}`);
      }
    } catch (err) {
      setOtpErrorMsg(err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSendingOtp(false);
    }
  };

  // Submit Bonton Nama Application
  const handleSubmitBontonApplication = async (e) => {
    e.preventDefault();
    if (!selectedLand) {
      alert('অনুগ্রহ করে জমি নির্বাচন করুন!');
      return;
    }
    if (!selectedDeceased) {
      alert('মৃত ব্যক্তির মৃত্যু সনদ নির্বাচন করুন!');
      return;
    }
    if (heirs.length === 0) {
      alert('কমপক্ষে একজন ওয়ারিশের তথ্য প্রদান করুন!');
      return;
    }
    for (let i = 0; i < heirs.length; i++) {
      const h = heirs[i];
      if (!h.verified) {
        alert(`ওয়ারিশ ${i + 1} (${h.name || h.nid})-এর NID সিস্টেমে যাচাই সম্পন্ন করতে হবে!`);
        return;
      }
      if (!h.share_decimal || parseFloat(h.share_decimal) <= 0) {
        alert(`ওয়ারিশ ${i + 1}-এর জন্য প্রাপ্ত জমির পরিমাণ (শতক) সঠিকভাবে লিখুন!`);
        return;
      }
    }

    if (isAreaExceeded) {
      alert(`বণ্টনকৃত জমির পরিমাণ (${totalAllocatedDecimal} শতক) মোট জমির পরিমাণের (${landAvailableDecimal} শতক) চেয়ে বেশি হতে পারে না!`);
      return;
    }

    if (!bontonOtp || bontonOtp.trim().length !== 6) {
      alert('🔒 ওয়ারিশ বণ্টননামা আবেদন সাবমিট করার জন্য ৬ ডিজিটের ওটিপি ভেরিফিকেশন বাধ্যতামূলক!');
      return;
    }

    setSubmittingBonton(true);
    setBontonSuccessMsg(null);

    try {
      const res = await axios.post('/api/bonton/create-application', {
        land_record_id: selectedLand._id,
        death_certificate_no: selectedDeceased.certificate_no,
        heirs: heirs.map(h => ({
          nid: h.nid,
          name: h.name,
          phone: h.phone,
          email: h.email,
          relationship: h.relationship,
          share_decimal: parseFloat(h.share_decimal),
          nid_verified: true,
          otp_verified: true,
          fingerprint_verified: h.fpVerified
        })),
        otp: bontonOtp.trim()
      });

      if (res.data.success) {
        setBontonSuccessMsg('আবেদন পাঠানো সম্পন্ন হলো ।');
        setBontonOtp('');
        setOtpSentMsg(null);
        fetchApplications();
        fetchDeathCertificates();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'বণ্টননামা আবেদন তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingBonton(false);
    }
  };

  return (
    <div style={{ color: '#0f172a' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderLeft: '5px solid #dc2626',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
            }}>
              <Users size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  মৃত জমির মালিকের ওয়ারিশ বণ্টননামা (Bontonnama) ও মালিকানা হস্তান্তর
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #f87171',
                  fontWeight: '700'
                }}>
                  ⚰️ Inheritance Engine
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '13px', margin: '4px 0 0 0' }}>
                মৃত্যু সনদ যাচাই ➔ জমি বিক্রয় সাময়িক স্থগিতকরণ ➔ ওয়ারিশদের মধ্যে আংশিক জমি বণ্টন ➔ এসি ল্যান্ড অফিসে নামজারি প্রেরণ
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#991b1b',
            background: '#fef2f2',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1.5px solid #fecaca',
            fontWeight: '700'
          }}>
            🏛️ সাব-রেজিস্ট্রার এখতিয়ার: বণ্টননামা দলিলের প্রস্তাব ও অনুমোদন
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0', flexWrap: 'wrap' }}>
          {[
            { id: 'death_cert', label: '১. মৃত্যু সনদ যাচাই ও জমি বিক্রয় স্থগিতকরণ', count: deathCertificates.length },
            { id: 'distribution', label: '২. ওয়ারিশদের মধ্যে জমি বণ্টন ও Assign', icon: Layers },
            { id: 'history', label: '৩. প্রেরিত বণ্টননামা আবেদন ট্র্যাকিং', count: applications.length }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: subTab === t.id ? '#dc2626' : '#f8fafc',
                color: subTab === t.id ? '#ffffff' : '#334155',
                border: subTab === t.id ? '1.5px solid #b91c1c' : '1.5px solid #cbd5e1',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: subTab === t.id ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                  color: subTab === t.id ? '#ffffff' : '#475569',
                  fontWeight: '800'
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 1: Death Certificate Verification & Freeze Lands
          ───────────────────────────────────────────────────────────── */}
      {subTab === 'death_cert' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1.15fr) minmax(320px, 1fr)', gap: '24px' }}>
          {/* Left: Death Certificate Submission Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldAlert size={20} color="#dc2626" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                মৃত্যু সনদ যাচাই ও জমি বিক্রয় সাময়িক স্থগিতকরণ ফর্ম
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
              নিয়ম অনুযায়ী প্রথমে মৃত ব্যক্তির NID নম্বর দিয়ে সিস্টেমে নাগরিককে অনুসন্ধান (Search) করে সনাক্ত করতে হবে। নাগরিক সনাক্ত (User Found) হওয়ার পর তাঁর জমাকৃত মৃত্যু সনদ যাচাই করে জমি বিক্রয় স্থগিত করা যাবে।
            </p>

            {/* STEP 1: Search Deceased Citizen by NID (Must be found first!) */}
            <div style={{
              marginBottom: '18px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              borderLeft: '4px solid #2563eb'
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                ১. মৃত ব্যক্তির NID নম্বর দিয়ে অনুসন্ধান করুন <span style={{ color: '#dc2626' }}>* (বাধ্যতামূলক)</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="মৃত ব্যক্তির ১০/১৩/১৭ ডিজিট NID লিখুন"
                  value={deceasedSearchNid}
                  onChange={(e) => {
                    setDeceasedSearchNid(e.target.value);
                    if (foundDeceasedUser) setFoundDeceasedUser(null);
                    setDeceasedSearchError(null);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchDeceasedUser(); } }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '13px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchDeceasedUser}
                  disabled={searchingDeceased || !deceasedSearchNid?.trim()}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (searchingDeceased || !deceasedSearchNid?.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Search size={16} />
                  {searchingDeceased ? 'খোঁজা হচ্ছে...' : 'নাগরিক খুঁজুন (Search)'}
                </button>
              </div>

              {deceasedSearchError && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px', color: '#991b1b', fontSize: '12px', fontWeight: '700' }}>
                  ⚠️ {deceasedSearchError}
                </div>
              )}

              {/* FOUND DECEASED CITIZEN CARD */}
              {foundDeceasedUser && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px',
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} color="#16a34a" />
                      নাগরিক ডাটাবেজে সনাক্ত হয়েছে (User Found)
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: '700', border: '1px solid #86efac' }}>
                      সক্রিয় জমির রেকর্ড: {foundLandsCount} টি
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '12px', color: '#1e293b' }}>
                    <div>মৃত নাগরিক: <strong style={{ color: '#0f172a' }}>{foundDeceasedUser.name}</strong></div>
                    <div>NID: <strong style={{ fontFamily: 'monospace', color: '#047857' }}>{foundDeceasedUser.nid}</strong></div>
                    <div>পিতা: {foundDeceasedUser.father_name}</div>
                    <div>মাতা: {foundDeceasedUser.mother_name}</div>
                    <div>ঠিকানা: {foundDeceasedUser.upazila}, {foundDeceasedUser.district}</div>
                    <div>ফোন: {foundDeceasedUser.phone}</div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Death Certificate & Heir Applicant Form (Only enabled when User is Found!) */}
            {!foundDeceasedUser ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  👉 পরবর্তী ধাপ: মৃত্যু সনদ যাচাই ও জমি লক
                </div>
                প্রথমে উপরে মৃত ব্যক্তির NID নম্বর দিয়ে অনুসন্ধান করে নাগরিককে সনাক্ত (User Found) করুন। নাগরিক পাওয়া গেলেই মৃত্যু সনদ যাচাই ফর্মটি উন্মুক্ত হবে।
              </div>
            ) : (
              <form onSubmit={handleRegisterDeath} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1e40af', fontWeight: '700' }}>
                  ২. সনাক্তকৃত নাগরিকের মৃত্যু সনদ ও ওয়ারিশের বিবরণ পূরণ করুন:
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত ব্যক্তির নাম (স্বয়ংক্রিয়)
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="input-field"
                    value={deathForm.deceased_name}
                    style={{ width: '100%', fontSize: '13px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontWeight: '700', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত ব্যক্তির NID (স্বয়ংক্রিয়)
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="input-field"
                    value={deathForm.deceased_nid}
                    style={{ width: '100%', fontSize: '13px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontFamily: 'monospace', fontWeight: '700', color: '#047857' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত্যু সনদ নম্বর (Death Cert No) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="যেমন: DC-2026-9812"
                    value={deathForm.certificate_no}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, certificate_no: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত্যুর তারিখ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={deathForm.death_date}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, death_date: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    সনদ প্রদানকারী কর্তৃপক্ষ
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={deathForm.issuing_authority}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, issuing_authority: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত্যুর কারণ
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={deathForm.cause_of_death}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, cause_of_death: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                    আবেদনকারী ওয়ারিশের বিবরণ:
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    আবেদনকারী ওয়ারিশের NID <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ওয়ারিশের NID"
                    value={deathForm.applicant_heir_nid}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, applicant_heir_nid: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    আবেদনকারী ওয়ারিশের নাম <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ওয়ারিশের নাম"
                    value={deathForm.applicant_heir_name}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, applicant_heir_name: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    ওয়ারিশের মোবাইল নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="০১৭১১xxxxxx"
                    value={deathForm.applicant_heir_phone}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, applicant_heir_phone: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    মৃত ব্যক্তির সাথে সম্পর্ক
                  </label>
                  <select
                    className="input-field"
                    value={deathForm.relationship_with_deceased}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, relationship_with_deceased: e.target.value }))}
                    style={{ width: '100%', height: '40px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                  >
                    <option value="পুত্র">পুত্র</option>
                    <option value="কন্যা">কন্যা</option>
                    <option value="স্ত্রী">স্ত্রী</option>
                    <option value="স্বামী">স্বামী</option>
                    <option value="পিতা">পিতা</option>
                    <option value="মাতা">মাতা</option>
                    <option value="ভাই">ভাই</option>
                    <option value="বোন">বোন</option>
                    <option value="অন্যান্য বৈধ ওয়ারিশ">অন্যান্য বৈধ ওয়ারিশ</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={registeringDeath}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: registeringDeath ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                    }}
                  >
                    <ShieldAlert size={18} />
                    {registeringDeath ? 'যাচাই ও লক করা হচ্ছে...' : 'মৃত্যু সনদ যাচাই, অনুমোদন ও জমি বিক্রয় স্থগিত করুন'}
                  </button>
                </div>
              </form>
            )}

            {deathSuccessMsg && (
              <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: '700' }}>
                {deathSuccessMsg}
              </div>
            )}
            {deathErrorMsg && (
              <div style={{ marginTop: '14px', padding: '12px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontWeight: '700' }}>
                {deathErrorMsg}
              </div>
            )}
          </div>

          {/* Right: List of Approved Death Certificates & Locked Lands */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#dc2626" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  অনুমোদিত মৃত্যু সনদ ও স্থগিতকৃত জমি
                </h3>
              </div>
              <button
                onClick={fetchDeathCertificates}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} /> রিফ্রেশ
              </button>
            </div>

            {loadingCerts ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>লোড হচ্ছে...</div>
            ) : deathCertificates.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                কোনো মৃত্যু সনদ অনুমোদিত হয়নি। বামপাশের ফর্ম পূরণ করে মৃত্যু সনদ যাচাই ও অনুমোদন করুন।
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', maxHeight: '560px', overflowY: 'auto' }}>
                {deathCertificates.map((cert) => (
                  <div
                    key={cert._id}
                    style={{
                      padding: '14px',
                      background: '#fff5f5',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b' }}>
                        সনদ নং: {cert.certificate_no}
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#fee2e2', color: '#991b1b', fontWeight: '700', border: '1px solid #f87171' }}>
                        🔒 বিক্রয় স্থগিত
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      মৃত ব্যক্তি: {cert.deceased_name} (NID: {cert.deceased_nid})
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                      মৃত্যুর তারিখ: {new Date(cert.death_date).toLocaleDateString('bn-BD')} | লককৃত জমি: <strong style={{ color: '#dc2626' }}>{cert.locked_lands_count || 1} টি</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '10px' }}>
                      আবেদনকারী ওয়ারিশ: <strong>{cert.applicant_heir_name}</strong> ({cert.relationship_with_deceased}) - ফোন: {cert.applicant_heir_phone}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectDeceasedForDistribution(cert)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Layers size={14} /> এই মালিকের ওয়ারিশ বণ্টননামা প্রস্তুত করুন ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 2: Bonton Nama Distribution to Multiple Heirs
          ───────────────────────────────────────────────────────────── */}
      {subTab === 'distribution' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(320px, 1fr)', gap: '24px' }}>
          {/* Left Column: Distribution Builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Select Land */}
            <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={18} color="#2563eb" />
                  ১. মৃত ব্যক্তির জমি নির্বাচন (মৌজা + দাগ + খতিয়ান)
                </h3>
                {selectedDeceased && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#fee2e2', color: '#991b1b', fontWeight: '700' }}>
                    মৃত: {selectedDeceased.deceased_name}
                  </span>
                )}
              </div>

              {/* If no deceased selected yet */}
              {!selectedDeceased && (
                <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af' }}>
                  অনুগ্রহ করে প্রথমে "১. মৃত্যু সনদ যাচাই" ট্যাব থেকে একজন অনুমোদিত মৃত মালিক নির্বাচন করুন অথবা নিম্নের ড্রপডাউন থেকে সিলেক্ট করুন।
                  <div style={{ marginTop: '8px' }}>
                    <select
                      className="input-field"
                      onChange={(e) => {
                        const target = deathCertificates.find(c => c._id === e.target.value);
                        if (target) handleSelectDeceasedForDistribution(target);
                      }}
                      style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1.5px solid #93c5fd', borderRadius: '6px' }}
                    >
                      <option value="">-- অনুমোদিত মৃত ব্যক্তি নির্বাচন করুন --</option>
                      {deathCertificates.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.deceased_name} (NID: {c.deceased_nid}) - সনদ: {c.certificate_no}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Lands of selected deceased */}
              {selectedDeceased && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    মৃত ব্যক্তির নামে প্রাপ্ত জমি নির্বাচন করুন:
                  </div>
                  {loadingLands ? (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>জমি লোড হচ্ছে...</div>
                  ) : deceasedLands.length === 0 ? (
                    <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '12px' }}>
                      এই মৃত ব্যক্তির NID-এ কোনো সক্রিয় জমি পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {deceasedLands.map((land) => (
                        <div
                          key={land._id}
                          onClick={() => setSelectedLand(land)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: selectedLand?._id === land._id ? '#eff6ff' : '#f8fafc',
                            border: `1.5px solid ${selectedLand?._id === land._id ? '#2563eb' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: selectedLand?._id === land._id ? '#1d4ed8' : '#0f172a' }}>
                              মৌজা: {land.mouza} | দাগ নং: {land.dag_no} | খতিয়ান নং: {land.khatian_no}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              জে.এল নং: {land.jl_no} | মোট পরিমাণ: <strong style={{ color: '#16a34a' }}>{land.total_area_decimal} শতক</strong>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: selectedLand?._id === land._id ? '#dbeafe' : '#f1f5f9',
                            color: selectedLand?._id === land._id ? '#1d4ed8' : '#475569',
                            fontWeight: '700'
                          }}>
                            {selectedLand?._id === land._id ? '✓ নির্বাচিত' : 'নির্বাচন করুন'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Multi-Heir Assignment (Partial Ownership) */}
            {selectedLand && (
              <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#16a34a" />
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      ২. ওয়ারিশদের মধ্যে জমি বণ্টন (Partial Ownership)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={addHeir}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1.5px solid #86efac',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} /> + ওয়ারিশ যোগ করুন
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                  প্রত্যেক ওয়ারিশের সিস্টেমে আগে থেকেই User Account থাকতে হবে। NID যাচাই করে আংশিক অংশ (শতক) নির্ধারণ করুন।
                </div>

                {/* Heirs List */}
                <div style={{ display: 'grid', gap: '14px' }}>
                  {heirs.map((h, idx) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '14px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderLeft: `4px solid ${h.verified ? '#16a34a' : '#cbd5e1'}`,
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                          ওয়ারিশ #{idx + 1}
                        </span>
                        {heirs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHeir(idx)}
                            style={{ padding: '2px 6px', fontSize: '11px', color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            <Trash2 size={12} /> মুছুন
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* NID & Verify */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            ওয়ারিশের NID নম্বর <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              placeholder="১০/১৩/১৭ ডিজিট NID"
                              value={h.nid}
                              onChange={(e) => updateHeir(idx, 'nid', e.target.value)}
                              style={{ flex: 1, padding: '7px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyHeirAccount(idx)}
                              disabled={h.verifying}
                              style={{ padding: '7px 10px', fontSize: '11px', fontWeight: '700', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {h.verifying ? '...' : 'যাচাই'}
                            </button>
                          </div>
                          {h.verifyError && (
                            <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>
                              {h.verifyError}
                            </div>
                          )}
                          {h.verified && (
                            <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '2px', fontWeight: '700' }}>
                              ✅ অ্যাকাউন্ট যাচাইকৃত
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            ওয়ারিশের নাম <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="যাচাইয়ের পর আসবে"
                            value={h.name}
                            onChange={(e) => updateHeir(idx, 'name', e.target.value)}
                            style={{ width: '100%', padding: '7px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: h.verified ? '#f0fdf4' : '#ffffff' }}
                          />
                        </div>

                        {/* Allocated Share (Decimal) */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            বণ্টনকৃত জমি (শতক) <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="যেমন: ১০"
                            value={h.share_decimal}
                            onChange={(e) => updateHeir(idx, 'share_decimal', e.target.value)}
                            style={{ width: '100%', padding: '7px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700', color: '#15803d' }}
                          />
                        </div>

                        {/* Relationship */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '2px' }}>
                            মৃত ব্যক্তির সাথে সম্পর্ক
                          </label>
                          <select
                            value={h.relationship}
                            onChange={(e) => updateHeir(idx, 'relationship', e.target.value)}
                            style={{ width: '100%', height: '34px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 6px' }}
                          >
                            <option value="পুত্র">পুত্র</option>
                            <option value="কন্যা">কন্যা</option>
                            <option value="স্ত্রী">স্ত্রী</option>
                            <option value="স্বামী">স্বামী</option>
                            <option value="অন্যান্য ওয়ারিশ">অন্যান্য ওয়ারিশ</option>
                          </select>
                        </div>

                        {/* Fingerprint Simulation (UI Display Only) */}
                        <div style={{ gridColumn: 'span 2', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                            <Fingerprint size={16} color={h.fpVerified ? '#16a34a' : '#64748b'} />
                            <span style={{ fontWeight: '600', color: h.fpVerified ? '#16a34a' : '#475569' }}>
                              {h.fpVerified ? 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সম্পন্ন (UI)' : 'ফিঙ্গারপ্রিন্ট ভেরিফিকেশন (প্রস্তুতিমূলক অপশন)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateHeirFingerprint(idx)}
                            disabled={h.fpScanning}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: h.fpVerified ? '#ecfdf5' : '#f1f5f9',
                              color: h.fpVerified ? '#065f46' : '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {h.fpScanning ? 'স্ক্যান...' : h.fpVerified ? 'পুনরায় টেস্ট' : 'বায়োমেট্রিক টেস্ট (UI)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Land Summary, Validation, OTP & Submit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedLand && (
              <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                  জমি বণ্টন হিসাব ও ভ্যালিডেশন
                </h4>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', display: 'grid', gap: '6px', marginBottom: '14px' }}>
                  <div>মৌজা: <strong>{selectedLand.mouza}</strong></div>
                  <div>দাগ নং: <strong>{selectedLand.dag_no}</strong> | খতিয়ান নং: <strong>{selectedLand.khatian_no}</strong></div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>দাগে মোট জমির পরিমাণ:</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{landAvailableDecimal} শতক</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: isAreaExceeded ? '#dc2626' : '#16a34a' }}>
                    <span>ওয়ারিশদের মধ্যে বণ্টনকৃত:</span>
                    <strong style={{ fontSize: '14px' }}>{totalAllocatedDecimal.toFixed(2)} শতক</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>অবশিষ্ট অবণ্টিত:</span>
                    <strong>{Math.max(0, landAvailableDecimal - totalAllocatedDecimal).toFixed(2)} শতক</strong>
                  </div>
                </div>

                {isAreaExceeded && (
                  <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                    ⚠️ সতর্কতা: বণ্টনকৃত জমির পরিমাণ ({totalAllocatedDecimal} শতক) মোট জমির পরিমাণের ({landAvailableDecimal} শতক) চেয়ে বেশি হতে পারবে না!
                  </div>
                )}

                {/* Heir summary preview */}
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  বণ্টন অনুপাত ({heirs.length} জন ওয়ারিশ):
                </div>
                <div style={{ display: 'grid', gap: '4px', marginBottom: '16px' }}>
                  {heirs.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                      <span>{h.name || `ওয়ারিশ #${i + 1}`} ({h.relationship}):</span>
                      <strong style={{ color: '#15803d' }}>{h.share_decimal || 0} শতক ({landAvailableDecimal > 0 ? ((parseFloat(h.share_decimal || 0) / landAvailableDecimal) * 100).toFixed(1) : 0}%)</strong>
                    </div>
                  ))}
                </div>

                {/* OTP Verification Section */}
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1.5px solid #bfdbfe', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Lock size={16} color="#1d4ed8" />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}>
                      ওয়ারিশ ইমেইল ওটিপি ভেরিফিকেশন <span style={{ color: '#dc2626' }}>*বাধ্যতামূলক</span>
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#1e40af', margin: '0 0 10px 0' }}>
                    ওয়ারিশদের পরিচয়ের নিরাপত্তা নিশ্চিত করতে রেজিস্টার্ড ইমেইলে ওটিপি পাঠানো আবশ্যক।
                  </p>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="৬ ডিজিটের ওটিপি"
                      value={bontonOtp}
                      onChange={(e) => setBontonOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, padding: '8px', fontSize: '13px', fontWeight: '700', letterSpacing: '2px', border: '1px solid #93c5fd', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      onClick={handleSendBontonOtp}
                      disabled={sendingOtp}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {sendingOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  {otpSentMsg && (
                    <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '4px', fontWeight: '700' }}>
                      ✅ {otpSentMsg}
                    </div>
                  )}
                  {otpErrorMsg && (
                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ {otpErrorMsg}
                    </div>
                  )}
                </div>

                {/* Submit Bonton Application */}
                <button
                  type="button"
                  onClick={handleSubmitBontonApplication}
                  disabled={submittingBonton || isAreaExceeded || !selectedLand}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: (isAreaExceeded || !selectedLand) ? '#94a3b8' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (isAreaExceeded || !selectedLand) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: (isAreaExceeded || !selectedLand) ? 'none' : '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <Send size={16} />
                  {submittingBonton ? 'সাবমিট হচ্ছে...' : 'বণ্টননামা আবেদন সাবমিট করুন ➔ এসি ল্যান্ডে পাঠান'}
                </button>

                {bontonSuccessMsg && (
                  <div style={{ marginTop: '12px', padding: '14px 18px', background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: '10px', color: '#166534', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="#166534" />
                    <span>আবেদন পাঠানো সম্পন্ন হলো ।</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 3: Sent Bonton Applications History
          ───────────────────────────────────────────────────────────── */}
      {subTab === 'history' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" />
              প্রেরিত ওয়ারিশ বণ্টননামা আবেদন ও ট্র্যাকিং
            </h3>
            <button
              onClick={fetchApplications}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} /> রিফ্রেশ
            </button>
          </div>

          {loadingApps ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>লোড হচ্ছে...</div>
          ) : applications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              কোনো প্রেরিত বণ্টননামা আবেদন নেই।
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {applications.map((app) => (
                <div
                  key={app._id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: app.status === 'Approved' ? '#f0fdf4' : '#fffbeb',
                    border: `1.5px solid ${app.status === 'Approved' ? '#86efac' : '#fde68a'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                        আবেদন নং: {app.application_no}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: app.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                        color: app.status === 'Approved' ? '#166534' : '#b45309',
                        fontWeight: '700',
                        border: `1px solid ${app.status === 'Approved' ? '#86efac' : '#fde68a'}`
                      }}>
                        {app.status === 'Approved' ? '✅ এসি ল্যান্ড অনুমোদিত ও নামজারি সম্পন্ন' : '⏳ এসি ল্যান্ড অফিসে পর্যালোচনায় অপেক্ষমান'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      তারিখ: {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div>মৃত মালিক: <strong>{app.deceased_name}</strong> (NID: {app.deceased_nid})</div>
                    <div>মৃত্যু সনদ: <strong>{app.death_certificate_no}</strong></div>
                    <div>মৌজা: <strong>{app.mouza}</strong> | দাগ: <strong>{app.dag_no}</strong> | খতিয়ান: <strong>{app.khatian_no}</strong></div>
                    <div>মোট বণ্টনকৃত জমি: <strong style={{ color: '#16a34a' }}>{app.allocated_area_decimal} শতক</strong> (মোট দাগ: {app.total_area_decimal} শতক)</div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    ওয়ারিশগণের অংশ ও বিবরণ ({app.heirs?.length || 0} জন):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {app.heirs?.map((h, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a'
                        }}
                      >
                        <strong>{h.name}</strong> ({h.relationship}): <strong style={{ color: '#059669' }}>{h.share_decimal} শতক</strong> ({h.share_percent}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

