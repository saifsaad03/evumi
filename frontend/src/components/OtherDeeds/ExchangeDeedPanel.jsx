import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowRightLeft,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  Shield,
  Fingerprint,
  UserCheck,
  FileCheck,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import CascadingLandSelector from './CascadingLandSelector';

export default function ExchangeDeedPanel() {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'tracking'
  const [exchangeApplications, setExchangeApplications] = useState([]);
  const [loadingExchangeApps, setLoadingExchangeApps] = useState(false);

  // Party 1 States
  const [p1Nid, setP1Nid] = useState('');
  const [p1User, setP1User] = useState(null);
  const [p1Loc, setP1Loc] = useState({ division: '', district: '', upazila: '', mouza: '', khatian_no: '', dag_no: '' });
  const [p1Land, setP1Land] = useState(null);
  const [p1Searching, setP1Searching] = useState(false);
  const [p1Error, setP1Error] = useState(null);
  const [p1Otp, setP1Otp] = useState('');
  const [p1OtpSending, setP1OtpSending] = useState(false);
  const [p1OtpSentMsg, setP1OtpSentMsg] = useState(null);
  const [p1Biometric, setP1Biometric] = useState(false);

  // Party 2 States
  const [p2Nid, setP2Nid] = useState('');
  const [p2User, setP2User] = useState(null);
  const [p2Loc, setP2Loc] = useState({ division: '', district: '', upazila: '', mouza: '', khatian_no: '', dag_no: '' });
  const [p2Land, setP2Land] = useState(null);
  const [p2Searching, setP2Searching] = useState(false);
  const [p2Error, setP2Error] = useState(null);
  const [p2Otp, setP2Otp] = useState('');
  const [p2OtpSending, setP2OtpSending] = useState(false);
  const [p2OtpSentMsg, setP2OtpSentMsg] = useState(null);
  const [p2Biometric, setP2Biometric] = useState(false);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);

  const fetchExchangeApplications = async () => {
    setLoadingExchangeApps(true);
    try {
      const res = await axios.get('/api/other-deeds/exchange/applications');
      if (res.data?.success) {
        setExchangeApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load exchange applications:', err);
    } finally {
      setLoadingExchangeApps(false);
    }
  };

  useEffect(() => {
    fetchExchangeApplications();
  }, []);

  // Search Land Helper
  const searchPartyLand = async (party, params) => {
    const isP1 = party === 1;
    const nid = (params?.owner_nid || (isP1 ? p1Nid : p2Nid) || '').trim();
    const mouza = (params?.mouza || (isP1 ? p1Loc.mouza : p2Loc.mouza) || '').trim();
    const dag_no = (params?.dag_no || (isP1 ? p1Loc.dag_no : p2Loc.dag_no) || '').trim();
    const khatian_no = (params?.khatian_no || (isP1 ? p1Loc.khatian_no : p2Loc.khatian_no) || '').trim();

    if (!nid || !mouza || !dag_no || !khatian_no) {
      if (isP1) setP1Error('অনুগ্রহ করে মালিক-১ এর NID এবং বিভাগ থেকে দাগ নম্বর পর্যন্ত প্রতিটি অপশন সিলেক্ট করুন।');
      else setP2Error('অনুগ্রহ করে মালিক-২ এর NID এবং বিভাগ থেকে দাগ নম্বর পর্যন্ত প্রতিটি অপশন সিলেক্ট করুন।');
      return;
    }

    if (isP1) { setP1Searching(true); setP1Error(null); setP1Land(null); }
    else { setP2Searching(true); setP2Error(null); setP2Land(null); }

    try {
      // 1. Verify User
      const uRes = await axios.post('/api/other-deeds/verify-user-nid', { nid });
      if (isP1) setP1User(uRes.data.user);
      else setP2User(uRes.data.user);

      // 2. Search Land
      const lRes = await axios.post('/api/other-deeds/search-owner-land', {
        owner_nid: nid,
        mouza,
        dag_no,
        khatian_no,
        division: params?.division || '',
        district: params?.district || '',
        upazila: params?.upazila || ''
      });

      if (lRes.data.success && lRes.data.record) {
        if (isP1) setP1Land(lRes.data.record);
        else setP2Land(lRes.data.record);
      } else {
        if (isP1) setP1Error(lRes.data.message || 'জমি পাওয়া যায়নি।');
        else setP2Error(lRes.data.message || 'জমি পাওয়া যায়নি।');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'অনুসন্ধানে ত্রুটি হয়েছে।';
      if (isP1) setP1Error(msg);
      else setP2Error(msg);
    } finally {
      if (isP1) setP1Searching(false);
      else setP2Searching(false);
    }
  };

  // Send Party OTP
  const sendPartyOtp = async (party) => {
    const isP1 = party === 1;
    const land = isP1 ? p1Land : p2Land;
    const user = isP1 ? p1User : p2User;

    if (!land) return;
    const email = (user?.email || land.owner_email || '').trim().toLowerCase();
    const nid = user?.nid || land.owner_nid;
    const name = user?.name || land.owner_name;

    if (isP1) { setP1OtpSending(true); setP1OtpSentMsg(null); }
    else { setP2OtpSending(true); setP2OtpSentMsg(null); }

    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: email,
        recipient_nid: nid,
        recipient_name: name,
        record_id: land._id,
        deed_title: 'জমি বিনিময় দলিল রেজিস্ট্রেশন',
        deed_no: `EXCH-DAG-${land.dag_no}`
      });

      if (res.data.success) {
        let msg = res.data.message || 'ওটিপি সফলভাবে পাঠানো হয়েছে।';
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        if (isP1) setP1OtpSentMsg(msg);
        else setP2OtpSentMsg(msg);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      if (isP1) setP1OtpSentMsg(`❌ ${errMsg}`);
      else setP2OtpSentMsg(`❌ ${errMsg}`);
    } finally {
      if (isP1) setP1OtpSending(false);
      else setP2OtpSending(false);
    }
  };

  // Generate Declaration Text
  const getDeclarationText = () => {
    if (!p1Land || !p2Land || !p1User || !p2User) {
      return 'উভয় পক্ষের জমি ও মালিকানা যাচাই সম্পন্ন হলে এখানে স্বয়ংক্রিয় দ্বিপাক্ষিক ঘোষণাপত্র প্রদর্শিত হবে।';
    }
    return `আমরা প্রথম পক্ষ ${p1User.name} (NID: ${p1User.nid}), মৌজা: ${p1Land.mouza}, দাগ নং: ${p1Land.dag_no}, খতিয়ান নং: ${p1Land.khatian_no} এ থাকা ${p1Land.available_area_decimal} শতক জমি এবং দ্বিতীয় পক্ষ ${p2User.name} (NID: ${p2User.nid}), মৌজা: ${p2Land.mouza}, দাগ নং: ${p2Land.dag_no}, খতিয়ান নং: ${p2Land.khatian_no} এ থাকা ${p2Land.available_area_decimal} শতক জমি সুস্থ শরীরে, স্বজ্ঞানে ও কোনো প্রকার বলপ্রয়োগ ব্যতিরেকে একে অপরের সাথে বিনিময় করার পূর্ণ সম্মতি জ্ঞাপন করছি। এই বিনিময় সূত্রে আমরা পারস্পরিক স্বত্ব ত্যাগপূর্বক অপর পক্ষের জমির নিরঙ্কুশ মালিকানা প্রদান করছি।`;
  };

  // Submit Exchange Deed
  const handleSubmitExchange = async () => {
    if (!p1Land || !p2Land || !p1User || !p2User) {
      setSubmissionError('উভয় পক্ষের জমি ও পরিচয় যাচাই সম্পন্ন করুন।');
      return;
    }
    if (!p1Otp.trim() || !p2Otp.trim()) {
      setSubmissionError('উভয় মালিকেরই ৬ ডিজিটের ওটিপি (OTP) কোড প্রদান আবশ্যক।');
      return;
    }
    if (!p1Biometric || !p2Biometric) {
      setSubmissionError('উভয় পক্ষের ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setSubmitting(true);
    setSubmissionSuccess(null);
    setSubmissionError(null);

    try {
      const res = await axios.post('/api/other-deeds/exchange/create', {
        owner1_land_id: p1Land._id,
        owner1_nid: p1User.nid,
        owner1_otp: p1Otp.trim(),
        owner2_land_id: p2Land._id,
        owner2_nid: p2User.nid,
        owner2_otp: p2Otp.trim(),
        declaration_text: getDeclarationText()
      });

      if (res.data.success) {
        setSubmissionSuccess('আবেদন পাঠানো সম্পন্ন হলো ।');
        setP1Land(null);
        setP2Land(null);
        setP1User(null);
        setP2User(null);
        setP1Otp('');
        setP2Otp('');
        setP1Biometric(false);
        setP2Biometric(false);
        fetchExchangeApplications();
      } else {
        setSubmissionError(res.data.message || 'বিনিময় দলিল তৈরি ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setSubmissionError(err.response?.data?.message || 'বিনিময় দলিল সৃষ্টিতে সার্ভার ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '4px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(37, 99, 235, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <ArrowRightLeft size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              বিনিময় দলিল রেজিস্ট্রেশন (Land Exchange Deed)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              দুই নাগরিকের মধ্যে পারস্পরিক সম্মতিতে জমি অদলবদল ও যুগপৎ নামজারি (Dual Mutation) সম্পাদন
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          দ্বিপাক্ষিক বিনিময় প্যানেল
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeSubTab === 'create' ? '1.5px solid #1d4ed8' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'create' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#f8fafc',
            color: activeSubTab === 'create' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'create' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <ArrowRightLeft size={16} />
          <span>১. নতুন বিনিময় দলিল সম্পাদন</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('tracking'); fetchExchangeApplications(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeSubTab === 'tracking' ? '1.5px solid #1d4ed8' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'tracking' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#f8fafc',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'tracking' ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>২. প্রেরিত বিনিময় দলিলের স্থিতি ও ট্র্যাকিং</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '999px',
            background: activeSubTab === 'tracking' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#475569',
            fontWeight: '800'
          }}>
            {exchangeApplications.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'create' && (
        <>
          {submissionSuccess && (
            <div style={{
              background: '#dcfce7',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#166534',
              fontSize: '15px',
              fontWeight: '800',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle size={22} color="#166534" />
              <span>আবেদন পাঠানো সম্পন্ন হলো ।</span>
            </div>
          )}

      {/* Side-by-Side Dual Party Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Party 1 Column */}
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '2px solid #93c5fd',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>
              👤 পক্ষ-১ (মালিক-১ এর জমি অনুসন্ধান)
            </span>
            {p1Land && (
              <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                যাচাইকৃত ({p1Land.available_area_decimal} শতক)
              </span>
            )}
          </div>

          <CascadingLandSelector
            nidLabel="মালিক-১ এর NID নম্বর"
            nidPlaceholder="মালিক-১ এর NID লিখুন"
            nidValue={p1Nid}
            onNidChange={setP1Nid}
            onSelectionChange={setP1Loc}
            onSearch={(params) => searchPartyLand(1, params)}
            searching={p1Searching}
            accentColor="#2563eb"
            searchButtonText="🔍 পক্ষ-১ এর জমি ও মালিকানা যাচাই"
            compact={true}
          />

          {p1Error && (
            <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700', marginTop: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px' }}>
              {p1Error}
            </div>
          )}

          {p1Land && p1User && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '10px', fontSize: '12.5px', marginTop: '14px' }}>
              <div style={{ fontWeight: '800', color: '#1e40af', marginBottom: '4px' }}>✅ মালিক-১ নিশ্চিতকরণ:</div>
              <div>মালিক: <strong>{p1User.name}</strong> (NID: {p1User.nid})</div>
              <div>ইমেইল: <strong>{p1Land.owner_email || p1User.email || 'সংরক্ষিত'}</strong></div>
              <div>জমি: <strong>{p1Land.available_area_decimal} শতক</strong> (দাগ: {p1Land.dag_no}, খতিয়ান: {p1Land.khatian_no}, মৌজা: {p1Land.mouza})</div>
              
              {/* OTP & Biometric for P1 */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#1e40af' }}>মালিক-১ ওটিপি (OTP):</span>
                  <button
                    type="button"
                    onClick={() => sendPartyOtp(1)}
                    disabled={p1OtpSending}
                    style={{ fontSize: '11px', background: '#1d4ed8', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                  >
                    {p1OtpSending ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="৬ ডিজিটের কোড"
                  maxLength={6}
                  value={p1Otp}
                  onChange={e => setP1Otp(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px' }}
                />
                {p1OtpSentMsg && (
                  <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '4px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>
                    {p1OtpSentMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setP1Biometric(!p1Biometric)}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    background: p1Biometric ? '#dcfce7' : '#ffffff',
                    color: p1Biometric ? '#166534' : '#475569',
                    border: `1.5px solid ${p1Biometric ? '#86efac' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Fingerprint size={16} />
                  <span>{p1Biometric ? 'মালিক-১ বায়োমেট্রিক সিল সম্পন্ন' : 'মালিক-১ ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Party 2 Column */}
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '2px solid #a7f3d0',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#047857' }}>
              👤 পক্ষ-২ (মালিক-২ এর জমি অনুসন্ধান)
            </span>
            {p2Land && (
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                যাচাইকৃত ({p2Land.available_area_decimal} শতক)
              </span>
            )}
          </div>

          <CascadingLandSelector
            nidLabel="মালিক-২ এর NID নম্বর"
            nidPlaceholder="মালিক-২ এর NID লিখুন"
            nidValue={p2Nid}
            onNidChange={setP2Nid}
            onSelectionChange={setP2Loc}
            onSearch={(params) => searchPartyLand(2, params)}
            searching={p2Searching}
            accentColor="#047857"
            searchButtonText="🔍 পক্ষ-২ এর জমি ও মালিকানা যাচাই"
            compact={true}
          />

          {p2Error && (
            <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700', marginTop: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px' }}>
              {p2Error}
            </div>
          )}

          {p2Land && p2User && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '10px', fontSize: '12.5px', marginTop: '14px' }}>
              <div style={{ fontWeight: '800', color: '#047857', marginBottom: '4px' }}>✅ মালিক-২ নিশ্চিতকরণ:</div>
              <div>মালিক: <strong>{p2User.name}</strong> (NID: {p2User.nid})</div>
              <div>ইমেইল: <strong>{p2Land.owner_email || p2User.email || 'সংরক্ষিত'}</strong></div>
              <div>জমি: <strong>{p2Land.available_area_decimal} শতক</strong> (দাগ: {p2Land.dag_no}, খতিয়ান: {p2Land.khatian_no}, মৌজা: {p2Land.mouza})</div>
              
              {/* OTP & Biometric for P2 */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#047857' }}>মালিক-২ ওটিপি (OTP):</span>
                  <button
                    type="button"
                    onClick={() => sendPartyOtp(2)}
                    disabled={p2OtpSending}
                    style={{ fontSize: '11px', background: '#047857', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                  >
                    {p2OtpSending ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="৬ ডিজিটের কোড"
                  maxLength={6}
                  value={p2Otp}
                  onChange={e => setP2Otp(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px' }}
                />
                {p2OtpSentMsg && (
                  <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '4px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>
                    {p2OtpSentMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setP2Biometric(!p2Biometric)}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    background: p2Biometric ? '#dcfce7' : '#ffffff',
                    color: p2Biometric ? '#166534' : '#475569',
                    border: `1.5px solid ${p2Biometric ? '#86efac' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Fingerprint size={16} />
                  <span>{p2Biometric ? 'মালিক-২ বায়োমেট্রিক সিল সম্পন্ন' : 'মালিক-২ ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Generated Bilateral Declaration Box */}
      <div className="glass-card" style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <FileCheck size={18} color="#2563eb" />
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
            স্বয়ংক্রিয় দ্বিপাক্ষিক ঘোষণাপত্র (Bilateral Mutual Agreement)
          </span>
        </div>
        <div style={{
          background: '#f8fafc',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13.5px',
          color: '#1e293b',
          lineHeight: 1.7
        }}>
          &ldquo;{getDeclarationText()}&rdquo;
        </div>

        {submissionError && (
          <div style={{
            background: '#fee2e2',
            border: '1.5px solid #f87171',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991b1b',
            fontSize: '13px',
            fontWeight: '700',
            marginTop: '16px'
          }}>
            {submissionError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleSubmitExchange}
            disabled={submitting || !p1Land || !p2Land}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: submitting ? 'wait' : (!p1Land || !p2Land ? 'not-allowed' : 'pointer'),
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            <ArrowRightLeft size={18} />
            <span>{submitting ? 'বিনিময় দলিল মঞ্জুর হচ্ছে...' : 'বিনিময় দলিল সম্পাদন করুন (Grant Exchange Deed to AC Land)'}</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* SUB-TAB 2: Dedicated Tracking Table */}
      {activeSubTab === 'tracking' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#2563eb" />
                প্রেরিত বিনিময় দলিলের স্থিতি ও যুগপৎ নামজারি ট্র্যাকিং
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                এসি ল্যান্ড অফিসে প্রেরিত দ্বিপাক্ষিক বিনিময় দলিল ও মিউটেশনের হালনাগাদ অগ্রগতি
              </p>
            </div>
            <button
              onClick={fetchExchangeApplications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                background: '#f1f5f9',
                border: '1.5px solid #94a3b8',
                borderRadius: '8px',
                color: '#0f172a',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loadingExchangeApps ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {loadingExchangeApps ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>তথ্য লোড হচ্ছে...</div>
            </div>
          ) : exchangeApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>এখনো কোনো বিনিময় দলিল প্রেরণ করা হয়নি</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>নতুন বিনিময় দলিল সম্পাদন করলে তা এখানে প্রদর্শিত হবে</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px' }}>দলিল ও আবেদন নং</th>
                    <th style={{ padding: '12px 14px' }}>১ম পক্ষ (মালিক-১ ও জমি)</th>
                    <th style={{ padding: '12px 14px' }}>২য় পক্ষ (মালিক-২ ও জমি)</th>
                    <th style={{ padding: '12px 14px' }}>আবেদনের তারিখ</th>
                    <th style={{ padding: '12px 14px' }}>বর্তমান স্ট্যাটাস</th>
                    <th style={{ padding: '12px 14px' }}>পর্যালোচনা/রেজিস্ট্রার</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeApplications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', color: '#1d4ed8', fontWeight: '800' }}>
                          {app.deed_no || app.application_no}
                        </div>
                        {app.application_no && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>আবেদন: {app.application_no}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{app.exchange?.owner1?.name || 'মালিক-১'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {app.exchange?.owner1?.nid}</div>
                        <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px' }}>
                          দাগ: {app.exchange?.owner1?.dag_no} | খতিয়ান: {app.exchange?.owner1?.khatian_no}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          মৌজা: {app.exchange?.owner1?.mouza} ({app.exchange?.owner1?.area_decimal} শতক)
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{app.exchange?.owner2?.name || 'মালিক-২'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {app.exchange?.owner2?.nid}</div>
                        <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                          দাগ: {app.exchange?.owner2?.dag_no} | খতিয়ান: {app.exchange?.owner2?.khatian_no}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          মৌজা: {app.exchange?.owner2?.mouza} ({app.exchange?.owner2?.area_decimal} শতক)
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: app.status === 'Approved' ? '#dcfce7' : app.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                          color: app.status === 'Approved' ? '#166534' : app.status === 'Rejected' ? '#991b1b' : '#92400e',
                          border: `1px solid ${app.status === 'Approved' ? '#86efac' : app.status === 'Rejected' ? '#f87171' : '#fde68a'}`
                        }}>
                          {app.status === 'Approved'
                            ? '✅ অনুমোদিত ও হস্তান্তরিত'
                            : app.status === 'Rejected'
                            ? '❌ প্রত্যাখ্যাত (Rejected)'
                            : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                        <div>অফিসার: {app.submitted_by_officer || 'সাব-রেজিস্ট্রার'}</div>
                        {app.rejection_reason && (
                          <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '11px', marginTop: '2px' }}>
                            কারণ: {app.rejection_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
