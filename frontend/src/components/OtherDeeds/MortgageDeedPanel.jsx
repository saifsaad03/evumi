import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Lock,
  Unlock,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  Shield,
  Fingerprint,
  RefreshCw,
  UserCheck,
  FileCheck,
  Building2,
  DollarSign
} from 'lucide-react';

export default function MortgageDeedPanel() {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' or 'unlock'

  // Locations
  const [divisions, setDivisions] = useState([]);
  useEffect(() => {
    axios.get('/api/locations/divisions').then(r => setDivisions(r.data?.data || [])).catch(() => {});
  }, []);

  // Creation form states
  const [ownerNid, setOwnerNid] = useState('');
  const [mouza, setMouza] = useState('');
  const [dagNo, setDagNo] = useState('');
  const [khatianNo, setKhatianNo] = useState('');

  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Mortgagee states
  const [mortgageeNid, setMortgageeNid] = useState('');
  const [verifyingMortgagee, setVerifyingMortgagee] = useState(false);
  const [mortgageeData, setMortgageeData] = useState(null);
  const [mortgageeError, setMortgageeError] = useState(null);

  // Loan states
  const [loanAmount, setLoanAmount] = useState('');
  const [mortgageDate, setMortgageDate] = useState(new Date().toISOString().split('T')[0]);

  // Owner OTP & biometric
  const [ownerOtp, setOwnerOtp] = useState('');
  const [sendingOwnerOtp, setSendingOwnerOtp] = useState(false);
  const [ownerOtpSentMsg, setOwnerOtpSentMsg] = useState(null);
  const [ownerBiometricVerified, setOwnerBiometricVerified] = useState(false);

  // Creation submit
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Unlock tab states
  const [lockedLands, setLockedLands] = useState([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [selectedLandForUnlock, setSelectedLandForUnlock] = useState(null);
  const [unlockMortgageeNid, setUnlockMortgageeNid] = useState('');
  const [unlockOtp, setUnlockOtp] = useState('');
  const [sendingUnlockOtp, setSendingUnlockOtp] = useState(false);
  const [unlockOtpSentMsg, setUnlockOtpSentMsg] = useState(null);
  const [unlockBiometricVerified, setUnlockBiometricVerified] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(null);
  const [unlockError, setUnlockError] = useState(null);

  useEffect(() => {
    if (activeSubTab === 'unlock') {
      fetchLockedLands();
    }
  }, [activeSubTab]);

  const fetchLockedLands = async () => {
    setLoadingLocked(true);
    try {
      const res = await axios.get('/api/other-deeds/mortgage/locked-lands');
      setLockedLands(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load mortgaged lands:', err);
    } finally {
      setLoadingLocked(false);
    }
  };

  // Search Land
  const handleSearchLand = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/other-deeds/search-owner-land', {
        owner_nid: ownerNid.trim(),
        mouza: mouza.trim(),
        dag_no: dagNo.trim(),
        khatian_no: khatianNo.trim()
      });

      if (res.data.success && res.data.record) {
        setSearchResult(res.data.record);
      } else {
        setSearchError(res.data.message || 'জমি অনুসন্ধান ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'জমি অনুসন্ধানে সমস্যা হয়েছে।');
    } finally {
      setSearching(false);
    }
  };

  // Verify Mortgagee NID
  const handleVerifyMortgagee = async () => {
    if (!mortgageeNid.trim()) {
      setMortgageeError('অনুগ্রহ করে বন্ধকগ্রহীতার NID লিখুন।');
      return;
    }
    setVerifyingMortgagee(true);
    setMortgageeData(null);
    setMortgageeError(null);

    try {
      const res = await axios.post('/api/other-deeds/verify-user-nid', {
        nid: mortgageeNid.trim()
      });

      if (res.data.success) {
        setMortgageeData(res.data.user);
      } else {
        setMortgageeError(res.data.message || 'নাগরিক পাওয়া যায়নি।');
      }
    } catch (err) {
      setMortgageeError(err.response?.data?.message || 'যাচাইয়ে ত্রুটি হয়েছে।');
    } finally {
      setVerifyingMortgagee(false);
    }
  };

  // Send Owner OTP
  const handleSendOwnerOtp = async () => {
    if (!searchResult) return;
    const email = (searchResult.owner_email || '').trim().toLowerCase();
    if (!email) {
      alert('মালিকের কোনো ইমেইল ঠিকানা পাওয়া যায়নি।');
      return;
    }
    setSendingOwnerOtp(true);
    setOwnerOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: email,
        recipient_name: searchResult.owner_name,
        deed_title: 'বন্ধকি দলিল রেজিস্ট্রেশন ও লকিং',
        deed_no: `MORT-DAG-${searchResult.dag_no}`
      });
      if (res.data.success) {
        setOwnerOtpSentMsg(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSendingOwnerOtp(false);
    }
  };

  // Submit Mortgage Deed
  const handleSubmitMortgage = async (e) => {
    e.preventDefault();
    if (!searchResult || !mortgageeData) {
      setSubmitError('মালিক ও বন্ধকগ্রহীতার তথ্য সঠিকভাবে যাচাই করুন।');
      return;
    }
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      setSubmitError('ঋণের পরিমাণ সঠিকভাবে উল্লেখ করুন।');
      return;
    }
    if (!ownerOtp.trim()) {
      setSubmitError('মালিকের ওটিপি প্রদান আবশ্যক।');
      return;
    }
    if (!ownerBiometricVerified) {
      setSubmitError('মালিকের ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/other-deeds/mortgage/create', {
        land_record_id: searchResult._id,
        owner_nid: searchResult.owner_nid,
        mortgagee_nid: mortgageeData.nid,
        loan_amount: parseFloat(loanAmount),
        mortgage_date: mortgageDate,
        owner_otp: ownerOtp.trim()
      });

      if (res.data.success) {
        setSubmitSuccess(res.data.message);
        setSearchResult(null);
        setMortgageeData(null);
        setMortgageeNid('');
        setLoanAmount('');
        setOwnerOtp('');
        setOwnerBiometricVerified(false);
        setOwnerOtpSentMsg(null);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'বন্ধকি দলিল সম্পাদন ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Unlock OTP to Mortgagee
  const handleSendUnlockOtp = async () => {
    if (!selectedLandForUnlock) return;
    const mDetails = selectedLandForUnlock.mortgage_details || {};
    const email = (mDetails.mortgagee_email || '').trim().toLowerCase();
    if (!email) {
      alert('বন্ধকগ্রহীতার কোনো ইমেইল ঠিকানা পাওয়া যায়নি।');
      return;
    }

    setSendingUnlockOtp(true);
    setUnlockOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: email,
        recipient_name: mDetails.mortgagee_name,
        deed_title: 'বন্ধক দায়মুক্তি ও আনলক অনুমোদন',
        deed_no: mDetails.mortgage_deed_no || `MORT-RELEASE-${selectedLandForUnlock.dag_no}`
      });
      if (res.data.success) {
        setUnlockOtpSentMsg(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSendingUnlockOtp(false);
    }
  };

  // Submit Unlock
  const handleUnlockMortgage = async () => {
    if (!selectedLandForUnlock) return;
    if (!unlockMortgageeNid.trim()) {
      setUnlockError('বন্ধকগ্রহীতার NID প্রদান করুন।');
      return;
    }
    if (!unlockOtp.trim()) {
      setUnlockError('বন্ধকগ্রহীতার ওটিপি কোড প্রদান আবশ্যক।');
      return;
    }
    if (!unlockBiometricVerified) {
      setUnlockError('বন্ধকগ্রহীতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setUnlocking(true);
    setUnlockSuccess(null);
    setUnlockError(null);

    try {
      const res = await axios.post('/api/other-deeds/mortgage/unlock', {
        land_record_id: selectedLandForUnlock._id,
        mortgagee_nid: unlockMortgageeNid.trim(),
        mortgagee_otp: unlockOtp.trim()
      });

      if (res.data.success) {
        setUnlockSuccess(res.data.message);
        setSelectedLandForUnlock(null);
        setUnlockMortgageeNid('');
        setUnlockOtp('');
        setUnlockBiometricVerified(false);
        setUnlockOtpSentMsg(null);
        fetchLockedLands();
      }
    } catch (err) {
      setUnlockError(err.response?.data?.message || 'আনলক করতে সমস্যা হয়েছে।');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #701a75, #a21caf)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(162, 28, 175, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <Lock size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              বন্ধকি দলিল ব্যবস্থাপনা (Mortgage Deed & Lien Management)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              ঋণ গ্রহণের বিপরীতে নির্দিষ্ট মালিকের জমি বন্ধক লক ও ঋণ পরিশোধ সাপেক্ষে আনলকিং ব্যবস্থাপনা
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Create vs Unlock */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'create' ? '#701a75' : '#f1f5f9',
            color: activeSubTab === 'create' ? '#ffffff' : '#475569',
            transition: 'all 0.2s'
          }}
        >
          <Lock size={16} />
          <span>১. নতুন বন্ধকি দলিল সম্পাদন ও জমি লক</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('unlock')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'unlock' ? '#701a75' : '#f1f5f9',
            color: activeSubTab === 'unlock' ? '#ffffff' : '#475569',
            transition: 'all 0.2s'
          }}
        >
          <Unlock size={16} />
          <span>২. বন্ধক দায়মুক্তি ও জমি আনলক ({lockedLands.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATE MORTGAGE */}
      {activeSubTab === 'create' && (
        <div>
          {submitSuccess && (
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
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Step 1: Search Owner's Land */}
          <div className="glass-card" style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="#701a75" />
              <span>১. বন্ধকদাতার জমি অনুসন্ধান ও মালিকানা যাচাই</span>
            </h3>

            <form onSubmit={handleSearchLand}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    মালিকের NID নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="NID লিখুন"
                    value={ownerNid}
                    onChange={e => setOwnerNid(e.target.value)}
                    style={{ width: '100%', fontWeight: '600' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    মৌজা <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="মৌজার নাম লিখুন"
                    value={mouza}
                    onChange={e => setMouza(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    দাগ নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="দাগ নম্বর লিখুন"
                    value={dagNo}
                    onChange={e => setDagNo(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    খতিয়ান নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="খতিয়ান নম্বর লিখুন"
                    value={khatianNo}
                    onChange={e => setKhatianNo(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={searching}
                  style={{
                    padding: '10px 24px',
                    background: '#701a75',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: searching ? 'wait' : 'pointer'
                  }}
                >
                  {searching ? 'যাচাই হচ্ছে...' : 'জমি যাচাই করুন'}
                </button>
              </div>
            </form>

            {searchError && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                padding: '12px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '700',
                marginTop: '16px'
              }}>
                {searchError}
              </div>
            )}

            {searchResult && (
              <div style={{ background: '#fdf4ff', border: '1.5px solid #f0abfc', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={16} color="#a21caf" />
                  <span style={{ fontWeight: '800', color: '#86198f', fontSize: '14px' }}>
                    মালিকের সক্রিয় জমি নিশ্চিতকৃত (দাগ নং {searchResult.dag_no}, খতিয়ান নং {searchResult.khatian_no})
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
                  <div>মালিক: <strong>{searchResult.owner_name}</strong></div>
                  <div>NID: <strong>{searchResult.owner_nid}</strong></div>
                  <div>জমি: <strong>{searchResult.total_area_decimal} শতক</strong></div>
                  <div>ইমেইল: <strong>{searchResult.owner_email || 'নেই'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Mortgagee & Loan Details */}
          {searchResult && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#701a75" />
                <span>২. বন্ধকগ্রহীতা (ব্যাংক/ব্যক্তি) ও ঋণের শর্তাবলী</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বন্ধকগ্রহীতার NID নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="NID নম্বর লিখুন"
                      value={mortgageeNid}
                      onChange={e => setMortgageeNid(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMortgagee}
                      disabled={verifyingMortgagee}
                      style={{
                        padding: '8px 16px',
                        background: '#701a75',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {verifyingMortgagee ? '...' : 'যাচাই'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    ঋণের পরিমাণ (টাকা) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="যেমন: ৫০০০০০"
                    value={loanAmount}
                    onChange={e => setLoanAmount(e.target.value)}
                    style={{ width: '100%', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বন্ধকের তারিখ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={mortgageDate}
                    onChange={e => setMortgageDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {mortgageeError && (
                <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '700', marginBottom: '14px' }}>
                  {mortgageeError}
                </div>
              )}

              {mortgageeData && (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>বন্ধকগ্রহীতা: <strong>{mortgageeData.name}</strong></div>
                    <div>NID: <strong>{mortgageeData.nid}</strong></div>
                    <div>ইমেইল: <strong>{mortgageeData.email || 'নেই'}</strong></div>
                  </div>
                </div>
              )}

              {/* Warning Notice */}
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#9f1239',
                lineHeight: 1.6
              }}>
                ℹ️ <strong>লকিং নোটিশ:</strong> এই দলিলটি সম্পাদন করার সাথে সাথে জমিটি 'Mortgage_Locked' স্ট্যাটাসে চলে যাবে। ঋণ পরিশোধ ও দায়মুক্তি আনলক না করা পর্যন্ত এই জমির ওপর কোনো প্রকার ক্রয়-বিক্রয় বা নামজারি কার্যকর করা যাবে না। একই দাগে অন্যান্য সহ-মালিক থাকলে তারা সম্পূর্ণ সুরক্ষিত থাকবে।
              </div>
            </div>
          )}

          {/* Step 3: Owner OTP & Biometrics */}
          {searchResult && mortgageeData && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#701a75" />
                <span>৩. বন্ধকদাতা মালিকের ওটিপি ও বায়োমেট্রিক সিল</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>মালিকের ইমেইল ওটিপি:</span>
                    <button
                      type="button"
                      onClick={handleSendOwnerOtp}
                      disabled={sendingOwnerOtp}
                      style={{ fontSize: '11.5px', background: '#701a75', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      {sendingOwnerOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিটের কোড"
                    maxLength={6}
                    value={ownerOtp}
                    onChange={e => setOwnerOtp(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800' }}
                  />
                  {ownerOtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>{ownerOtpSentMsg}</div>}
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                    মালিকের বায়োমেট্রিক নিশ্চিতকরণ
                  </span>
                  <button
                    type="button"
                    onClick={() => setOwnerBiometricVerified(!ownerBiometricVerified)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: ownerBiometricVerified ? '#dcfce7' : '#ffffff',
                      color: ownerBiometricVerified ? '#166534' : '#475569',
                      border: `1.5px solid ${ownerBiometricVerified ? '#86efac' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Fingerprint size={18} />
                    <span>{ownerBiometricVerified ? 'মালিকের ফিঙ্গারপ্রিন্ট সম্পন্ন' : 'ফিঙ্গারপ্রিন্ট স্ক্যান করুন'}</span>
                  </button>
                </div>
              </div>

              {submitError && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSubmitMortgage}
                  disabled={submitting}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #701a75, #a21caf)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(162, 28, 175, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Lock size={18} />
                  <span>{submitting ? 'সম্পাদন হচ্ছে...' : 'বন্ধকি দলিল সম্পাদন ও জমি লক করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNLOCK MORTGAGE */}
      {activeSubTab === 'unlock' && (
        <div>
          {unlockSuccess && (
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
              <span>{unlockSuccess}</span>
            </div>
          )}

          <div className="glass-card" style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  বর্তমানে বন্ধকাবদ্ধ জমির তালিকা ({lockedLands.length}টি)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  যে জমিটির বন্ধক দায়মুক্তি সম্পন্ন করতে চান, সেটি নির্বাচন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLockedLands}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={loadingLocked ? 'animate-spin' : ''} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {lockedLands.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                বর্তমানে কোনো জমি বন্ধকাবদ্ধ অবস্থায় নেই।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lockedLands.map(land => {
                  const m = land.mortgage_details || {};
                  const isSelected = selectedLandForUnlock?._id === land._id;
                  return (
                    <div
                      key={land._id}
                      onClick={() => {
                        setSelectedLandForUnlock(land);
                        setUnlockMortgageeNid(m.mortgagee_nid || '');
                        setUnlockOtp('');
                        setUnlockOtpSentMsg(null);
                        setUnlockBiometricVerified(false);
                      }}
                      style={{
                        border: isSelected ? '2px solid #a21caf' : '1px solid #e2e8f0',
                        background: isSelected ? '#fdf4ff' : '#ffffff',
                        padding: '16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                            {land.mouza} | দাগ: {land.dag_no} | খতিয়ান: {land.khatian_no}
                          </span>
                          <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                            🔒 Mortgage_Locked
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                          মালিক: <strong>{land.owner_name}</strong> (NID: {land.owner_nid}) | জমি: <strong>{land.total_area_decimal} শতক</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#701a75', marginTop: '2px' }}>
                          বন্ধকগ্রহীতা: <strong>{m.mortgagee_name}</strong> (NID: {m.mortgagee_nid}) | ঋণ: <strong>৳{m.loan_amount}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: '6px 16px',
                          background: isSelected ? '#701a75' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? 'নির্বাচিত' : 'দায়মুক্তি নির্বাচন'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unlock Execution Panel */}
          {selectedLandForUnlock && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '2px solid #a21caf',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#701a75', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={18} />
                <span>বন্ধক দায়মুক্তি যাচাইকরণ ও আনলকিং (দাগ নং: {selectedLandForUnlock.dag_no})</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বন্ধকগ্রহীতার NID নিশ্চিতকরণ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={unlockMortgageeNid}
                    onChange={e => setUnlockMortgageeNid(e.target.value)}
                    style={{ width: '100%', fontWeight: '700' }}
                    readOnly
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    বন্ধকগ্রহীতা: {selectedLandForUnlock.mortgage_details?.mortgagee_name}
                  </span>
                </div>

                <div style={{ background: '#fdf4ff', padding: '14px', borderRadius: '8px', border: '1px solid #f0abfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#701a75' }}>বন্ধকগ্রহীতার ইমেইল ওটিপি:</span>
                    <button
                      type="button"
                      onClick={handleSendUnlockOtp}
                      disabled={sendingUnlockOtp}
                      style={{ fontSize: '11px', background: '#701a75', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {sendingUnlockOtp ? '...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিট ওটিপি"
                    maxLength={6}
                    value={unlockOtp}
                    onChange={e => setUnlockOtp(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800' }}
                  />
                  {unlockOtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>{unlockOtpSentMsg}</div>}
                </div>

                <div style={{ background: '#fdf4ff', padding: '14px', borderRadius: '8px', border: '1px solid #f0abfc' }}>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#701a75', marginBottom: '8px' }}>
                    বন্ধকগ্রহীতার বায়োমেট্রিক সিল
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnlockBiometricVerified(!unlockBiometricVerified)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: unlockBiometricVerified ? '#dcfce7' : '#ffffff',
                      color: unlockBiometricVerified ? '#166534' : '#475569',
                      border: `1px solid ${unlockBiometricVerified ? '#86efac' : '#cbd5e1'}`,
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Fingerprint size={16} />
                    <span>{unlockBiometricVerified ? 'দায়মুক্তি ফিঙ্গারপ্রিন্ট সম্পন্ন' : 'বন্ধকগ্রহীতার ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
                  </button>
                </div>
              </div>

              {unlockError && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                  {unlockError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleUnlockMortgage}
                  disabled={unlocking}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: unlocking ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Unlock size={18} />
                  <span>{unlocking ? 'আনলক হচ্ছে...' : 'বন্ধক দায়মুক্তি অনুমোদন ও জমি আনলক করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

