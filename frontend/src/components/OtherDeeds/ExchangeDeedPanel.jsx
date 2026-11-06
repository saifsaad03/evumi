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
  Info
} from 'lucide-react';

export default function ExchangeDeedPanel() {
  // Common locations
  const [divisions, setDivisions] = useState([]);
  useEffect(() => {
    axios.get('/api/locations/divisions').then(res => setDivisions(res.data?.data || [])).catch(() => {});
  }, []);

  // Party 1 States
  const [p1Nid, setP1Nid] = useState('');
  const [p1User, setP1User] = useState(null);
  const [p1Mouza, setP1Mouza] = useState('');
  const [p1Dag, setP1Dag] = useState('');
  const [p1Khatian, setP1Khatian] = useState('');
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
  const [p2Mouza, setP2Mouza] = useState('');
  const [p2Dag, setP2Dag] = useState('');
  const [p2Khatian, setP2Khatian] = useState('');
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

  // Search Land Helper
  const searchPartyLand = async (party) => {
    const isP1 = party === 1;
    const nid = isP1 ? p1Nid.trim() : p2Nid.trim();
    const mouza = isP1 ? p1Mouza.trim() : p2Mouza.trim();
    const dag_no = isP1 ? p1Dag.trim() : p2Dag.trim();
    const khatian_no = isP1 ? p1Khatian.trim() : p2Khatian.trim();

    if (!nid || !mouza || !dag_no || !khatian_no) {
      if (isP1) setP1Error('অনুগ্রহ করে মালিক-১ এর NID, মৌজা, দাগ ও খতিয়ান নম্বর লিখুন।');
      else setP2Error('অনুগ্রহ করে মালিক-২ এর NID, মৌজা, দাগ ও খতিয়ান নম্বর লিখুন।');
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
        khatian_no
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

    if (!land || !user) return;
    const email = (user.email || land.owner_email || '').trim().toLowerCase();
    if (!email) {
      alert(`${isP1 ? 'মালিক-১' : 'মালিক-২'} এর কোনো ইমেইল ঠিকানা পাওয়া যায়নি।`);
      return;
    }

    if (isP1) setP1OtpSending(true);
    else setP2OtpSending(true);

    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: email,
        recipient_name: user.name,
        deed_title: 'জমি বিনিময় দলিল রেজিস্ট্রেশন',
        deed_no: `EXCH-DAG-${land.dag_no}`
      });

      if (res.data.success) {
        if (isP1) setP1OtpSentMsg(res.data.message);
        else setP2OtpSentMsg(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
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
      setSubmissionError('উভয় মালিকেরই ওটিপি (OTP) কোড প্রদান আবশ্যক।');
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
        setSubmissionSuccess(res.data.message);
        setP1Land(null);
        setP2Land(null);
        setP1Otp('');
        setP2Otp('');
        setP1Biometric(false);
        setP2Biometric(false);
      }
    } catch (err) {
      setSubmissionError(err.response?.data?.message || 'বিনিময় দলিল সৃষ্টিতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
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

      {submissionSuccess && (
        <div style={{
          background: '#dcfce7',
          border: '1.5px solid #86efac',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#166534',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} color="#166534" />
          <span>{submissionSuccess}</span>
        </div>
      )}

      {/* Side-by-Side Dual Party Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Party 1 Column */}
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '2px solid #93c5fd',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>
              👤 পক্ষ-১ (মালিক-১ এর জমি)
            </span>
            {p1Land && (
              <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                যাচাইকৃত ({p1Land.available_area_decimal} শতক)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>মালিক-১ এর NID</label>
              <input
                type="text"
                className="input-field"
                placeholder="NID নম্বর"
                value={p1Nid}
                onChange={e => setP1Nid(e.target.value)}
                style={{ width: '100%', marginTop: '3px', fontWeight: '600' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>মৌজা</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: গুজিয়া"
                  value={p1Mouza}
                  onChange={e => setP1Mouza(e.target.value)}
                  style={{ width: '100%', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>দাগ নং</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="দাগ নং"
                  value={p1Dag}
                  onChange={e => setP1Dag(e.target.value)}
                  style={{ width: '100%', marginTop: '3px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>খতিয়ান নং</label>
              <input
                type="text"
                className="input-field"
                placeholder="খতিয়ান নং"
                value={p1Khatian}
                onChange={e => setP1Khatian(e.target.value)}
                style={{ width: '100%', marginTop: '3px' }}
              />
            </div>

            <button
              type="button"
              onClick={() => searchPartyLand(1)}
              disabled={p1Searching}
              style={{
                padding: '8px 14px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: p1Searching ? 'wait' : 'pointer',
                marginTop: '4px'
              }}
            >
              {p1Searching ? 'যাচাই হচ্ছে...' : 'মালিক-১ এর জমি যাচাই করুন'}
            </button>

            {p1Error && <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>{p1Error}</div>}

            {p1Land && p1User && (
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', fontSize: '12px', marginTop: '6px' }}>
                <div>মালিক: <strong>{p1User.name}</strong></div>
                <div>জমি: <strong>{p1Land.available_area_decimal} শতক</strong> (দাগ: {p1Land.dag_no}, খতিয়ান: {p1Land.khatian_no})</div>
                
                {/* OTP & Biometric for P1 */}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700' }}>মালিক-১ ওটিপি:</span>
                    <button
                      type="button"
                      onClick={() => sendPartyOtp(1)}
                      disabled={p1OtpSending}
                      style={{ fontSize: '11px', background: '#1d4ed8', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {p1OtpSending ? '...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিট কোড"
                    maxLength={6}
                    value={p1Otp}
                    onChange={e => setP1Otp(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800' }}
                  />
                  {p1OtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '3px' }}>{p1OtpSentMsg}</div>}

                  <button
                    type="button"
                    onClick={() => setP1Biometric(!p1Biometric)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '6px',
                      background: p1Biometric ? '#dcfce7' : '#ffffff',
                      color: p1Biometric ? '#166534' : '#475569',
                      border: `1px solid ${p1Biometric ? '#86efac' : '#cbd5e1'}`,
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Fingerprint size={14} />
                    <span>{p1Biometric ? 'মালিক-১ বায়োমেট্রিক সম্পন্ন' : 'মালিক-১ ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
              👤 পক্ষ-২ (মালিক-২ এর জমি)
            </span>
            {p2Land && (
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                যাচাইকৃত ({p2Land.available_area_decimal} শতক)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>মালিক-২ এর NID</label>
              <input
                type="text"
                className="input-field"
                placeholder="NID নম্বর"
                value={p2Nid}
                onChange={e => setP2Nid(e.target.value)}
                style={{ width: '100%', marginTop: '3px', fontWeight: '600' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>মৌজা</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: গুজিয়া"
                  value={p2Mouza}
                  onChange={e => setP2Mouza(e.target.value)}
                  style={{ width: '100%', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>দাগ নং</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="দাগ নং"
                  value={p2Dag}
                  onChange={e => setP2Dag(e.target.value)}
                  style={{ width: '100%', marginTop: '3px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>খতিয়ান নং</label>
              <input
                type="text"
                className="input-field"
                placeholder="খতিয়ান নং"
                value={p2Khatian}
                onChange={e => setP2Khatian(e.target.value)}
                style={{ width: '100%', marginTop: '3px' }}
              />
            </div>

            <button
              type="button"
              onClick={() => searchPartyLand(2)}
              disabled={p2Searching}
              style={{
                padding: '8px 14px',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: p2Searching ? 'wait' : 'pointer',
                marginTop: '4px'
              }}
            >
              {p2Searching ? 'যাচাই হচ্ছে...' : 'মালিক-২ এর জমি যাচাই করুন'}
            </button>

            {p2Error && <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>{p2Error}</div>}

            {p2Land && p2User && (
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', fontSize: '12px', marginTop: '6px' }}>
                <div>মালিক: <strong>{p2User.name}</strong></div>
                <div>জমি: <strong>{p2Land.available_area_decimal} শতক</strong> (দাগ: {p2Land.dag_no}, খতিয়ান: {p2Land.khatian_no})</div>
                
                {/* OTP & Biometric for P2 */}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700' }}>মালিক-২ ওটিপি:</span>
                    <button
                      type="button"
                      onClick={() => sendPartyOtp(2)}
                      disabled={p2OtpSending}
                      style={{ fontSize: '11px', background: '#047857', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {p2OtpSending ? '...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিট কোড"
                    maxLength={6}
                    value={p2Otp}
                    onChange={e => setP2Otp(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800' }}
                  />
                  {p2OtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '3px' }}>{p2OtpSentMsg}</div>}

                  <button
                    type="button"
                    onClick={() => setP2Biometric(!p2Biometric)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '6px',
                      background: p2Biometric ? '#dcfce7' : '#ffffff',
                      color: p2Biometric ? '#166534' : '#475569',
                      border: `1px solid ${p2Biometric ? '#86efac' : '#cbd5e1'}`,
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Fingerprint size={14} />
                    <span>{p2Biometric ? 'মালিক-২ বায়োমেট্রিক সম্পন্ন' : 'মালিক-২ ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}

