import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
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
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import CascadingLandSelector from './CascadingLandSelector';

export default function BaynaDeedPanel() {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'unlock' | 'tracking'

  // Creation form states
  const [sellerNid, setSellerNid] = useState('');
  const [landLoc, setLandLoc] = useState({ division: '', district: '', upazila: '', mouza: '', khatian_no: '', dag_no: '' });

  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Bayna buyer states
  const [buyerNid, setBuyerNid] = useState('');
  const [verifyingBuyer, setVerifyingBuyer] = useState(false);
  const [buyerData, setBuyerData] = useState(null);
  const [buyerError, setBuyerError] = useState(null);

  // Bayna terms
  const [baynaAmount, setBaynaAmount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [baynaDate, setBaynaDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');

  // Seller OTP & biometric
  const [sellerOtp, setSellerOtp] = useState('');
  const [sendingSellerOtp, setSendingSellerOtp] = useState(false);
  const [sellerOtpSentMsg, setSellerOtpSentMsg] = useState(null);
  const [sellerBiometricVerified, setSellerBiometricVerified] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Unlock tab states
  const [lockedLands, setLockedLands] = useState([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [selectedLandForUnlock, setSelectedLandForUnlock] = useState(null);
  const [unlockBuyerNid, setUnlockBuyerNid] = useState('');
  const [unlockOtp, setUnlockOtp] = useState('');
  const [sendingUnlockOtp, setSendingUnlockOtp] = useState(false);
  const [unlockOtpSentMsg, setUnlockOtpSentMsg] = useState(null);
  const [unlockBiometricVerified, setUnlockBiometricVerified] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(null);
  const [unlockError, setUnlockError] = useState(null);

  useEffect(() => {
    fetchLockedLands();
  }, [activeSubTab]);

  const fetchLockedLands = async () => {
    setLoadingLocked(true);
    try {
      const res = await axios.get('/api/other-deeds/bayna/locked-lands');
      setLockedLands(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load bayna lands:', err);
    } finally {
      setLoadingLocked(false);
    }
  };

  // Search Land
  const handleSearchLand = async (params) => {
    const nid = (params?.owner_nid || sellerNid || '').trim();
    const mouza = (params?.mouza || landLoc.mouza || '').trim();
    const dag_no = (params?.dag_no || landLoc.dag_no || '').trim();
    const khatian_no = (params?.khatian_no || landLoc.khatian_no || '').trim();

    if (!nid || !mouza || !dag_no || !khatian_no) {
      setSearchError('অনুগ্রহ করে বিক্রেতার NID এবং বিভাগ থেকে শুরু করে দাগ নম্বর পর্যন্ত প্রতিটি ড্রপডাউন সিলেক্ট করুন।');
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/other-deeds/search-owner-land', {
        owner_nid: nid,
        mouza,
        dag_no,
        khatian_no,
        division: params?.division || landLoc.division || '',
        district: params?.district || landLoc.district || '',
        upazila: params?.upazila || landLoc.upazila || ''
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

  // Verify Buyer
  const handleVerifyBuyer = async () => {
    if (!buyerNid.trim()) {
      setBuyerError('অনুগ্রহ করে বায়না ক্রেতার NID লিখুন।');
      return;
    }
    setVerifyingBuyer(true);
    setBuyerData(null);
    setBuyerError(null);

    try {
      const res = await axios.post('/api/other-deeds/verify-user-nid', {
        nid: buyerNid.trim()
      });
      if (res.data.success) {
        setBuyerData(res.data.user);
      } else {
        setBuyerError(res.data.message || 'নাগরিক পাওয়া যায়নি।');
      }
    } catch (err) {
      setBuyerError(err.response?.data?.message || 'যাচাইয়ে ত্রুটি হয়েছে।');
    } finally {
      setVerifyingBuyer(false);
    }
  };

  // Send Seller OTP
  const handleSendSellerOtp = async () => {
    if (!searchResult) return;
    setSendingSellerOtp(true);
    setSellerOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: searchResult.owner_email || '',
        recipient_nid: searchResult.owner_nid || sellerNid,
        recipient_name: searchResult.owner_name,
        record_id: searchResult._id,
        deed_title: 'বায়নাপত্র দলিল সম্পাদন ও লকিং',
        deed_no: `BAYNA-DAG-${searchResult.dag_no}`
      });
      if (res.data.success) {
        let msg = res.data.message || 'ওটিপি সফলভাবে পাঠানো হয়েছে।';
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        setSellerOtpSentMsg(msg);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      setSellerOtpSentMsg(`❌ ${errMsg}`);
    } finally {
      setSendingSellerOtp(false);
    }
  };

  // Submit Bayna Deed
  const handleSubmitBayna = async (e) => {
    if (e) e.preventDefault();
    if (!searchResult || !buyerData) {
      setSubmitError('বিক্রেতা ও বায়না গ্রহীতার তথ্য সঠিকভাবে যাচাই করুন।');
      return;
    }
    if (!baynaAmount || parseFloat(baynaAmount) <= 0) {
      setSubmitError('বায়নার পরিমাণ সঠিকভাবে উল্লেখ করুন।');
      return;
    }
    if (!sellerOtp.trim()) {
      setSubmitError('বিক্রেতার ৬ ডিজিটের ওটিপি কোড প্রদান আবশ্যক।');
      return;
    }
    if (!sellerBiometricVerified) {
      setSubmitError('বিক্রেতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/other-deeds/bayna/create', {
        land_record_id: searchResult._id,
        seller_nid: searchResult.owner_nid,
        bayna_buyer_nid: buyerData.nid,
        bayna_amount: parseFloat(baynaAmount),
        total_agreed_price: totalPrice ? parseFloat(totalPrice) : 0,
        bayna_date: baynaDate,
        expiry_date: expiryDate || null,
        seller_otp: sellerOtp.trim()
      });

      if (res.data.success) {
        setSubmitSuccess(res.data.message || 'বায়নাপত্র দলিল সফলভাবে নিবন্ধিত হয়েছে এবং জমিটি বায়নাসূত্রে লক করা হয়েছে।');
        setSearchResult(null);
        setBuyerData(null);
        setBuyerNid('');
        setBaynaAmount('');
        setTotalPrice('');
        setSellerOtp('');
        setSellerBiometricVerified(false);
        setSellerOtpSentMsg(null);
      } else {
        setSubmitError(res.data.message || 'বায়নাপত্র দলিল সৃষ্টিতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'বায়নাপত্র দলিল সৃষ্টিতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Unlock OTP to Bayna Buyer
  const handleSendUnlockOtp = async () => {
    if (!selectedLandForUnlock) return;
    const bDetails = selectedLandForUnlock.bayna_details || {};
    setSendingUnlockOtp(true);
    setUnlockOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: bDetails.bayna_buyer_email || '',
        recipient_nid: bDetails.bayna_buyer_nid || unlockBuyerNid,
        recipient_name: bDetails.bayna_buyer_name,
        record_id: selectedLandForUnlock._id,
        deed_title: 'বায়নাপত্র দায়মুক্তি ও আনলক অনুমোদন',
        deed_no: bDetails.bayna_deed_no || `BAYNA-RELEASE-${selectedLandForUnlock.dag_no}`
      });
      if (res.data.success) {
        let msg = res.data.message || 'ওটিপি সফলভাবে পাঠানো হয়েছে।';
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        setUnlockOtpSentMsg(msg);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      setUnlockOtpSentMsg(`❌ ${errMsg}`);
    } finally {
      setSendingUnlockOtp(false);
    }
  };

  // Submit Unlock
  const handleUnlockBayna = async () => {
    if (!selectedLandForUnlock) return;
    if (!unlockBuyerNid.trim()) {
      setUnlockError('বায়না গ্রহীতার NID প্রদান করুন।');
      return;
    }
    if (!unlockOtp.trim()) {
      setUnlockError('বায়না গ্রহীতার ৬ ডিজিটের ওটিপি কোড প্রদান আবশ্যক।');
      return;
    }
    if (!unlockBiometricVerified) {
      setUnlockError('বায়না গ্রহীতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setUnlocking(true);
    setUnlockSuccess(null);
    setUnlockError(null);

    try {
      const res = await axios.post('/api/other-deeds/bayna/unlock', {
        land_record_id: selectedLandForUnlock._id,
        bayna_buyer_nid: unlockBuyerNid.trim(),
        bayna_buyer_otp: unlockOtp.trim()
      });

      if (res.data.success) {
        setUnlockSuccess(res.data.message || 'বায়না লক প্রত্যাহার সম্পন্ন হয়েছে এবং জমিটি দায়মুক্ত হয়েছে।');
        setSelectedLandForUnlock(null);
        setUnlockBuyerNid('');
        setUnlockOtp('');
        setUnlockBiometricVerified(false);
        setUnlockOtpSentMsg(null);
        fetchLockedLands();
      } else {
        setUnlockError(res.data.message || 'বায়না আনলক করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setUnlockError(err.response?.data?.message || 'বায়না আনলক করতে সমস্যা হয়েছে।');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #c2410c, #ea580c)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(234, 88, 12, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <FileText size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              বায়নাপত্র দলিল ব্যবস্থাপনা (Agreement for Sale / Bayna Deed)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              সম্পত্তি কেনাবেচার চূড়ান্ত চুক্তি, বায়না লক নিশ্চিতকরণ ও চুক্তি প্রত্যাহার/সম্পাদন ব্যবস্থাপনা
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Create vs Unlock vs Tracking */}
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
            border: activeSubTab === 'create' ? '1.5px solid #c2410c' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'create' ? '#c2410c' : '#f8fafc',
            color: activeSubTab === 'create' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'create' ? '0 4px 12px rgba(194, 65, 12, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Lock size={16} />
          <span>১. নতুন বায়নাপত্র দলিল ও জমি লক</span>
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
            border: activeSubTab === 'unlock' ? '1.5px solid #c2410c' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'unlock' ? '#c2410c' : '#f8fafc',
            color: activeSubTab === 'unlock' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'unlock' ? '0 4px 12px rgba(194, 65, 12, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Unlock size={16} />
          <span>২. বায়নাপত্র দায়মুক্তি / আনলক</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('tracking'); fetchLockedLands(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeSubTab === 'tracking' ? '1.5px solid #c2410c' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'tracking' ? '#c2410c' : '#f8fafc',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'tracking' ? '0 4px 12px rgba(194, 65, 12, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>৩. প্রেরিত বায়নাকৃত দলিলের স্থিতি ও ট্র্যাকিং</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '999px',
            background: activeSubTab === 'tracking' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#475569',
            fontWeight: '800'
          }}>
            {lockedLands.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CREATE BAYNA */}
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

          {/* Step 1: Search Seller's Land */}
          <div className="glass-card" style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} color="#c2410c" />
                <span>১. বিক্রেতার জমি অনুসন্ধান ও অ্যান্টি ডাবল-সেলিং ভেরিফিকেশন</span>
              </h3>
              <span style={{ fontSize: '11px', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                ধাপ ১ / ৩
              </span>
            </div>

            <CascadingLandSelector
              nidLabel="বিক্রেতার NID নম্বর"
              nidPlaceholder="বিক্রেতার ১০/১৩/১৭ ডিজিট NID লিখুন"
              nidValue={sellerNid}
              onNidChange={setSellerNid}
              onSelectionChange={setLandLoc}
              onSearch={handleSearchLand}
              searching={searching}
              accentColor="#c2410c"
              searchButtonText="🔍 বিক্রেতার জমি অনুসন্ধান ও অ্যান্টি ডাবল-সেলিং চেক"
            />

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
              <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={16} color="#c2410c" />
                  <span style={{ fontWeight: '800', color: '#9a3412', fontSize: '14px' }}>
                    বিক্রেতার সক্রিয় জমি নিশ্চিতকৃত (দাগ নং {searchResult.dag_no}, খতিয়ান নং {searchResult.khatian_no}, মৌজা: {searchResult.mouza})
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
                  <div>মালিক: <strong>{searchResult.owner_name}</strong></div>
                  <div>NID: <strong>{searchResult.owner_nid}</strong></div>
                  <div>জমি: <strong>{searchResult.total_area_decimal} শতক</strong></div>
                  <div>ইমেইল: <strong>{searchResult.owner_email || 'সংরক্ষিত'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Bayna Buyer & Terms */}
          {searchResult && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#c2410c" />
                  <span>২. বায়না সূত্রে ক্রেতা ও বায়না চুক্তির শর্তাবলী</span>
                </h3>
                <span style={{ fontSize: '11px', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  ধাপ ২ / ৩
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বায়না ক্রেতার NID <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="NID নম্বর লিখুন"
                      value={buyerNid}
                      onChange={e => setBuyerNid(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyBuyer}
                      disabled={verifyingBuyer}
                      style={{
                        padding: '8px 16px',
                        background: '#c2410c',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {verifyingBuyer ? '...' : 'যাচাই'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বায়না মূল্য (পরিশোধিত টাকা) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="যেমন: ২০০০০০"
                    value={baynaAmount}
                    onChange={e => setBaynaAmount(e.target.value)}
                    style={{ width: '100%', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    মোট চুক্তি মূল্য (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="যেমন: ১০-লাখ"
                    value={totalPrice}
                    onChange={e => setTotalPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বায়নার তারিখ
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={baynaDate}
                    onChange={e => setBaynaDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {buyerError && (
                <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '700', marginBottom: '14px' }}>
                  {buyerError}
                </div>
              )}

              {buyerData && (
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>বায়না ক্রেতা: <strong>{buyerData.name}</strong></div>
                    <div>NID: <strong>{buyerData.nid}</strong></div>
                    <div>ইমেইল: <strong>{buyerData.email || 'নেই'}</strong></div>
                  </div>
                </div>
              )}

              {/* Warning Notice */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#9a3412',
                lineHeight: 1.6
              }}>
                ℹ️ <strong>বায়নাপত্র অ্যান্টি ডাবল-সেলিং গার্ড:</strong> এই দলিলটি সম্পন্ন হওয়ার সাথে সাথে জমিটি 'Bayna_Locked' হয়ে যাবে। চুক্তির নিষ্পত্তি ব্যতিরেকে অন্য কোনো ব্যক্তির কাছে এই জমি বিক্রি বা দলিল করা সম্পূর্ণ আইনত নিষিদ্ধ থাকবে। বিক্রেতা ও ক্রেতা উভয়ের ড্যাশবোর্ডেই জমিটি বায়নাকৃত হিসেবে দৃশ্যমান থাকবে।
              </div>
            </div>
          )}

          {/* Step 3: Seller OTP & Biometrics */}
          {searchResult && buyerData && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#c2410c" />
                  <span>৩. বিক্রেতা মালিকের ওটিপি ও বায়োমেট্রিক সিল</span>
                </h3>
                <span style={{ fontSize: '11px', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  ধাপ ৩ / ৩
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>বিক্রেতার ইমেইল ওটিপি (OTP):</span>
                    <button
                      type="button"
                      onClick={handleSendSellerOtp}
                      disabled={sendingSellerOtp}
                      style={{ fontSize: '11.5px', background: '#c2410c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      {sendingSellerOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিটের কোড"
                    maxLength={6}
                    value={sellerOtp}
                    onChange={e => setSellerOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px' }}
                  />
                  {sellerOtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>{sellerOtpSentMsg}</div>}
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                    বিক্রেতার বায়োমেট্রিক নিশ্চিতকরণ
                  </span>
                  <button
                    type="button"
                    onClick={() => setSellerBiometricVerified(!sellerBiometricVerified)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: sellerBiometricVerified ? '#dcfce7' : '#ffffff',
                      color: sellerBiometricVerified ? '#166534' : '#475569',
                      border: `1.5px solid ${sellerBiometricVerified ? '#86efac' : '#cbd5e1'}`,
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
                    <span>{sellerBiometricVerified ? 'বিক্রেতার ফিঙ্গারপ্রিন্ট সম্পন্ন' : 'ফিঙ্গারপ্রিন্ট স্ক্যান করুন'}</span>
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
                  onClick={handleSubmitBayna}
                  disabled={submitting}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #c2410c, #ea580c)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Lock size={18} />
                  <span>{submitting ? 'সম্পাদন হচ্ছে...' : 'বায়নাপত্র দলিল সম্পাদন ও জমি লক করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNLOCK BAYNA */}
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
                  বর্তমানে বায়নাকৃত জমির তালিকা ({lockedLands.length}টি)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  চুক্তি বাতিল বা দায়মুক্তির জন্য সংশ্লিষ্ট জমিটি নির্বাচন করুন
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
                বর্তমানে কোনো জমি বায়নাকৃত বা লক অবস্থায় নেই।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lockedLands.map(land => {
                  const b = land.bayna_details || {};
                  const isSelected = selectedLandForUnlock?._id === land._id;
                  return (
                    <div
                      key={land._id}
                      onClick={() => {
                        setSelectedLandForUnlock(land);
                        setUnlockBuyerNid(b.bayna_buyer_nid || '');
                        setUnlockOtp('');
                        setUnlockOtpSentMsg(null);
                        setUnlockBiometricVerified(false);
                      }}
                      style={{
                        border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                        background: isSelected ? '#fff7ed' : '#ffffff',
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
                          <span style={{ fontSize: '11px', background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                            🔒 Bayna_Locked
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                          বিক্রেতা: <strong>{land.owner_name}</strong> (NID: {land.owner_nid}) | জমি: <strong>{land.total_area_decimal} শতক</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '2px' }}>
                          বায়না ক্রেতা: <strong>{b.bayna_buyer_name}</strong> (NID: {b.bayna_buyer_nid}) | পরিশোধিত বায়না: <strong>৳{b.bayna_amount}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: '6px 16px',
                          background: isSelected ? '#c2410c' : '#f1f5f9',
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
              border: '2px solid #ea580c',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#c2410c', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={18} />
                <span>বায়নাপত্র দায়মুক্তি যাচাইকরণ ও আনলকিং (দাগ নং: {selectedLandForUnlock.dag_no})</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    বায়না ক্রেতার NID নিশ্চিতকরণ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={unlockBuyerNid}
                    onChange={e => setUnlockBuyerNid(e.target.value)}
                    style={{ width: '100%', fontWeight: '700' }}
                    readOnly
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    ক্রেতা: {selectedLandForUnlock.bayna_details?.bayna_buyer_name}
                  </span>
                </div>

                <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#c2410c' }}>ক্রেতার ইমেইল ওটিপি (OTP):</span>
                    <button
                      type="button"
                      onClick={handleSendUnlockOtp}
                      disabled={sendingUnlockOtp}
                      style={{ fontSize: '11px', background: '#c2410c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      {sendingUnlockOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="৬ ডিজিট ওটিপি"
                    maxLength={6}
                    value={unlockOtp}
                    onChange={e => setUnlockOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px' }}
                  />
                  {unlockOtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>{unlockOtpSentMsg}</div>}
                </div>

                <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#c2410c', marginBottom: '8px' }}>
                    বায়না ক্রেতার বায়োমেট্রিক সিল
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnlockBiometricVerified(!unlockBiometricVerified)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: unlockBiometricVerified ? '#dcfce7' : '#ffffff',
                      color: unlockBiometricVerified ? '#166534' : '#475569',
                      border: `1.5px solid ${unlockBiometricVerified ? '#86efac' : '#cbd5e1'}`,
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
                    <span>{unlockBiometricVerified ? 'দায়মুক্তি ফিঙ্গারপ্রিন্ট সম্পন্ন' : 'ক্রেতার ফিঙ্গারপ্রিন্ট স্ক্যান'}</span>
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
                  onClick={handleUnlockBayna}
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
                  <span>{unlocking ? 'আনলক হচ্ছে...' : 'বায়না দায়মুক্তি অনুমোদন ও জমি আনলক করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Dedicated Bayna Tracking Table */}
      {activeSubTab === 'tracking' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#c2410c" />
                প্রেরিত বায়নাকৃত দলিলের স্থিতি ও জমি ট্র্যাকিং
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                সম্পত্তি বিক্রয় চুক্তির আওতায় বায়নাবদ্ধ সকল জমির বর্তমান আইনগত ও দায় সংক্রান্ত স্থিতি
              </p>
            </div>
            <button
              onClick={fetchLockedLands}
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
              <RefreshCw size={14} className={loadingLocked ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {loadingLocked ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>তথ্য লোড হচ্ছে...</div>
            </div>
          ) : lockedLands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>বর্তমানে কোনো বায়নাবদ্ধ জমি নেই</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>নতুন বায়নাপত্র দলিল সম্পাদন করা হলে তা এখানে প্রদর্শিত হবে</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px' }}>বায়না দলিল নং</th>
                    <th style={{ padding: '12px 14px' }}>মূল মালিক (বিক্রেতা)</th>
                    <th style={{ padding: '12px 14px' }}>জমির বিবরণ</th>
                    <th style={{ padding: '12px 14px' }}>বায়না গ্রহীতা (ক্রেতা)</th>
                    <th style={{ padding: '12px 14px' }}>বায়না ও মোট মূল্য</th>
                    <th style={{ padding: '12px 14px' }}>মেয়াদ ও স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedLands.map((land) => {
                    const b = land.bayna_details || {};
                    return (
                      <tr key={land._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontFamily: 'monospace', color: '#c2410c', fontWeight: '800' }}>
                            {b.bayna_deed_no || `BAYNA-${land.dag_no}`}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{land.owner_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {land.owner_nid}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ color: '#0f172a' }}>দাগ: <strong>{land.dag_no}</strong> | খতিয়ান: {land.khatian_no}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            মৌজা: {land.mouza} ({land.available_area_decimal} শতক)
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{b.bayna_buyer_name || 'বায়না ক্রেতা'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {b.bayna_buyer_nid || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '800', color: '#c2410c' }}>
                            বায়না: ৳ {Number(b.bayna_amount_bdt || 0).toLocaleString('bn-BD')}
                          </div>
                          {b.total_price_bdt && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              মোট: ৳ {Number(b.total_price_bdt).toLocaleString('bn-BD')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: '#ffedd5',
                            color: '#9a3412',
                            border: '1px solid #fdba74'
                          }}>
                            <Lock size={12} />
                            <span>বায়নাকৃত লক (Bayna Locked)</span>
                          </span>
                          {b.expiry_date && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                              মেয়াদ: {b.expiry_date}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
