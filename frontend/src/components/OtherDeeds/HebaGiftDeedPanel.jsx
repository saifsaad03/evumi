import React, { useState } from 'react';
import axios from 'axios';
import {
  Gift,
  Heart,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  Shield,
  Fingerprint,
  RefreshCw,
  UserCheck,
  FileCheck,
  Info,
  Clock
} from 'lucide-react';
import CascadingLandSelector from './CascadingLandSelector';

const ALLOWED_RELATIONS = [
  'পিতা',
  'মাতা',
  'পুত্র',
  'কন্যা',
  'দাদা',
  'দাদী',
  'নাতি',
  'নাতনি',
  'আপন ভাই',
  'আপন বোন',
  'স্বামী',
  'স্ত্রী'
];

export default function HebaGiftDeedPanel() {
  // Donor search parameters
  const [donorNid, setDonorNid] = useState('');
  const [landLocation, setLandLocation] = useState({
    division: '',
    district: '',
    upazila: '',
    mouza: '',
    khatian_no: '',
    dag_no: ''
  });

  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Recipient verification states
  const [recipientNid, setRecipientNid] = useState('');
  const [verifyingRecipient, setVerifyingRecipient] = useState(false);
  const [recipientData, setRecipientData] = useState(null);
  const [recipientError, setRecipientError] = useState(null);

  // Heba deed parameters
  const [relationship, setRelationship] = useState(ALLOWED_RELATIONS[0]);
  const [relationVerifiedCheck, setRelationVerifiedCheck] = useState(false);
  const [giftArea, setGiftArea] = useState('');

  // Donor OTP and biometric states
  const [donorOtp, setDonorOtp] = useState('');
  const [sendingDonorOtp, setSendingDonorOtp] = useState(false);
  const [donorOtpSentMsg, setDonorOtpSentMsg] = useState(null);
  const [donorBiometricVerified, setDonorBiometricVerified] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);

  // Search donor's land
  const handleSearchLand = async (searchParams) => {
    const nid = (searchParams?.owner_nid || donorNid || '').trim();
    const mouza = (searchParams?.mouza || landLocation.mouza || '').trim();
    const dag_no = (searchParams?.dag_no || landLocation.dag_no || '').trim();
    const khatian_no = (searchParams?.khatian_no || landLocation.khatian_no || '').trim();

    if (!nid || !mouza || !dag_no || !khatian_no) {
      setSearchError('অনুগ্রহ করে দাতার NID নম্বর এবং বিভাগ থেকে শুরু করে দাগ নম্বর পর্যন্ত প্রতিটি ড্রপডাউন ক্রমানুসারে সিলেক্ট করুন।');
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setSubmissionSuccess(null);
    setSubmissionError(null);

    try {
      const res = await axios.post('/api/other-deeds/search-owner-land', {
        owner_nid: nid,
        mouza,
        dag_no,
        khatian_no,
        division: searchParams?.division || landLocation.division || '',
        district: searchParams?.district || landLocation.district || '',
        upazila: searchParams?.upazila || landLocation.upazila || ''
      });

      if (res.data.success && res.data.record) {
        setSearchResult(res.data.record);
        setGiftArea(res.data.record.available_area_decimal || '');
      } else {
        setSearchError(res.data.message || 'জমি অনুসন্ধান সফল হয়নি।');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'জমি অনুসন্ধানে সার্ভার সমস্যা হয়েছে।');
    } finally {
      setSearching(false);
    }
  };

  // Verify Recipient NID
  const handleVerifyRecipient = async () => {
    if (!recipientNid.trim()) {
      setRecipientError('অনুগ্রহ করে গ্রহীতার NID নম্বর লিখুন।');
      return;
    }
    if (recipientNid.trim() === donorNid.trim()) {
      setRecipientError('দাতা ও গ্রহীতার NID একই হতে পারে না।');
      return;
    }

    setVerifyingRecipient(true);
    setRecipientData(null);
    setRecipientError(null);

    try {
      const res = await axios.post('/api/other-deeds/verify-user-nid', {
        nid: recipientNid.trim()
      });

      if (res.data.success && res.data.user) {
        setRecipientData(res.data.user);
      } else {
        setRecipientError(res.data.message || 'গ্রহীতার তথ্য পাওয়া যায়নি।');
      }
    } catch (err) {
      setRecipientError(err.response?.data?.message || 'গ্রহীতা অনুসন্ধানে সমস্যা হয়েছে।');
    } finally {
      setVerifyingRecipient(false);
    }
  };

  // Send Donor OTP
  const handleSendDonorOtp = async () => {
    if (!searchResult) return;
    setSendingDonorOtp(true);
    setDonorOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: searchResult.owner_email || '',
        recipient_nid: searchResult.owner_nid || donorNid,
        recipient_name: searchResult.owner_name,
        record_id: searchResult._id,
        deed_title: 'দানপত্র / হেবা দলিল রেজিস্ট্রেশন',
        deed_no: `HEBA-DAG-${searchResult.dag_no}`
      });

      if (res.data.success) {
        let msg = res.data.message || `ওটিপি সফলভাবে পাঠানো হয়েছে।`;
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        setDonorOtpSentMsg(msg);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'দাতার ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      setDonorOtpSentMsg(`❌ ${errMsg}`);
    } finally {
      setSendingDonorOtp(false);
    }
  };

  // Submit Heba Deed to AC Land
  const handleSubmitHebaDeed = async (e) => {
    if (e) e.preventDefault();
    if (!searchResult || !recipientData) {
      setSubmissionError('দাতা ও গ্রহীতার তথ্য সঠিকভাবে যাচাই করুন।');
      return;
    }
    if (!relationVerifiedCheck) {
      setSubmissionError('অনুগ্রহ করে NID তথ্য অনুযায়ী সম্পর্ক ভেরিফিকেশন চেকবক্সে টিক দিন।');
      return;
    }
    if (!donorOtp.trim()) {
      setSubmissionError('দাতার ইমেইলে প্রেরিত ৬ ডিজিটের ওটিপি কোড প্রদান আবশ্যক।');
      return;
    }
    if (!donorBiometricVerified) {
      setSubmissionError('দাতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    const gArea = parseFloat(giftArea);
    if (isNaN(gArea) || gArea <= 0 || gArea > searchResult.available_area_decimal) {
      setSubmissionError(`উপহারের পরিমাণ বৈধ নয় (সর্বোচ্চ ${searchResult.available_area_decimal} শতক)।`);
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);

    try {
      const res = await axios.post('/api/other-deeds/heba/create', {
        land_record_id: searchResult._id,
        donor_nid: donorNid.trim() || searchResult.owner_nid,
        recipient_nid: recipientData.nid,
        relationship,
        gift_area_decimal: gArea,
        relationship_verified: true,
        donor_otp: donorOtp.trim()
      });

      if (res.data.success) {
        setSubmissionSuccess(res.data.message || 'হেবা দলিল সফলভাবে অনুমোদনের জন্য এসি ল্যান্ড কার্যালয়ে পাঠানো হয়েছে।');
        setSearchResult(null);
        setRecipientData(null);
        setDonorOtp('');
        setDonorBiometricVerified(false);
        setRelationVerifiedCheck(false);
      } else {
        setSubmissionError(res.data.message || 'হেবা দলিল তৈরি ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setSubmissionError(err.response?.data?.message || 'সার্ভার সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '4px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(4, 120, 87, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <Gift size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              দানপত্র / হেবা দলিল রেজিস্ট্রেশন (Gift / Heba Deed)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              মুসলিম পারিবারিক আইন অনুযায়ী নিকটাত্মীয়দের মধ্যে হেবা দলিল সম্পাদন ও নামজারি প্রক্রিয়াকরণ
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
          সাব-রেজিস্ট্রি প্যানেল
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

      {/* Step 1: Donor & Land Search */}
      <div className="glass-card" style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#047857" />
            <span>১. দাতার জমি অনুসন্ধান ও মালিকানা যাচাই (Donor & Land Verification)</span>
          </h3>
          <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
            ধাপ ১ / ৩
          </span>
        </div>

        <CascadingLandSelector
          nidLabel="দাতার NID নম্বর"
          nidPlaceholder="দাতার ১০/১৩/১৭ ডিজিট NID লিখুন"
          nidValue={donorNid}
          onNidChange={setDonorNid}
          onSelectionChange={setLandLocation}
          onSearch={handleSearchLand}
          searching={searching}
          accentColor="#047857"
          searchButtonText="🔍 দাতার জমি অনুসন্ধান ও মালিকানা যাচাই করুন"
        />

        {searchError && (
          <div style={{
            background: '#fee2e2',
            border: '1.5px solid #f87171',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#991b1b',
            fontSize: '13.5px',
            fontWeight: '700',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} color="#991b1b" />
            <span>{searchError}</span>
          </div>
        )}

        {searchResult && (
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '18px 20px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#166534" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                  দাতার বৈধ জমি সক্রিয় পাওয়া গেছে
                </span>
              </div>
              <span style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '800'
              }}>
                স্ট্যাটাস: {searchResult.status}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontSize: '13px',
              background: '#ffffff',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <div>
                <span style={{ color: '#64748b' }}>দাতার নাম:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{searchResult.owner_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>NID:</span>{' '}
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{searchResult.owner_nid}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>মৌজা:</span> <strong>{searchResult.mouza}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>দাগ নং:</span>{' '}
                <strong style={{ color: '#047857' }}>{searchResult.dag_no}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>খতিয়ান নং:</span>{' '}
                <strong style={{ color: '#047857' }}>{searchResult.khatian_no}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>মোট জমি:</span>{' '}
                <strong>{searchResult.total_area_decimal} শতক</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>হস্তান্তরযোগ্য জমি:</span>{' '}
                <strong style={{ color: '#166534', fontSize: '14px' }}>
                  {searchResult.available_area_decimal} শতক
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>নিবন্ধিত ইমেইল:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{searchResult.owner_email || 'সংরক্ষিত আছে'}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Recipient Verification & Relationship */}
      {searchResult && (
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#047857" />
              <span>২. গ্রহীতার NID ও রক্তের সম্পর্ক যাচাই (Recipient & Relation Verification)</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              ধাপ ২ / ৩
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                গ্রহীতার NID নম্বর <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যাকে দান করা হবে তার NID লিখুন"
                  value={recipientNid}
                  onChange={e => setRecipientNid(e.target.value)}
                  style={{ width: '100%', color: '#0f172a', fontWeight: '600' }}
                  required
                />
                <button
                  type="button"
                  onClick={handleVerifyRecipient}
                  disabled={verifyingRecipient}
                  style={{
                    padding: '8px 18px',
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: verifyingRecipient ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {verifyingRecipient ? 'যাচাই...' : 'যাচাই'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                দাতার সাথে গ্রহীতার রক্তের সম্পর্ক <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="input-field"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                style={{ width: '100%', color: '#0f172a', fontWeight: '600', background: '#ffffff' }}
              >
                {ALLOWED_RELATIONS.map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                দানকৃত জমির পরিমাণ (শতক) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                placeholder="যেমন: ৫"
                value={giftArea}
                onChange={e => setGiftArea(e.target.value)}
                max={searchResult.available_area_decimal}
                style={{ width: '100%', color: '#0f172a', fontWeight: '700', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          {recipientError && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #f87171',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px'
            }}>
              {recipientError}
            </div>
          )}

          {recipientData && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={16} color="#059669" />
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#059669' }}>
                  গ্রহীতার পরিচয় নিশ্চিতকৃত (ডাটাবেজে নিবন্ধিত সক্রিয় নাগরিক)
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
                <div>নাম: <strong>{recipientData.name}</strong></div>
                <div>NID: <strong>{recipientData.nid}</strong></div>
                <div>মোবাইল: <strong>{recipientData.phone || 'তথ্য নেই'}</strong></div>
                <div>ইমেইল: <strong>{recipientData.email || 'তথ্য নেই'}</strong></div>
              </div>
            </div>
          )}

          {/* Relation Verification Checkbox */}
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <input
              type="checkbox"
              id="relationCheck"
              checked={relationVerifiedCheck}
              onChange={e => setRelationVerifiedCheck(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="relationCheck" style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', cursor: 'pointer' }}>
              আমি প্রত্যয়ন করছি যে, দাতা ({searchResult.owner_name}) এবং গ্রহীতার মধ্যে <strong>'{relationship}'</strong> সম্পর্ক বিদ্যমান এবং NID ও ওয়ারিশান তথ্যাদি অনুযায়ী তা শতভাগ যাচাই করা হলো।
            </label>
          </div>
        </div>
      )}

      {/* Step 3: Donor OTP, Biometrics & Grant Deed */}
      {searchResult && recipientData && (
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#047857" />
              <span>৩. দাতার সম্মতি, ওটিপি (OTP) ও বায়োমেট্রিক সিল (Grant Deed)</span>
            </h3>
            <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              ধাপ ৩ / ৩
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* OTP Section */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>দাতার ইমেইল ওটিপি (OTP)</span>
                <button
                  type="button"
                  onClick={handleSendDonorOtp}
                  disabled={sendingDonorOtp}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: sendingDonorOtp ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Send size={12} />
                  {sendingDonorOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="৬ ডিজিটের ওটিপি লিখুন"
                value={donorOtp}
                onChange={e => setDonorOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', fontSize: '16px' }}
              />
              {donorOtpSentMsg && (
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '6px', fontWeight: '600', background: '#dcfce7', padding: '6px 10px', borderRadius: '6px' }}>
                  {donorOtpSentMsg}
                </div>
              )}
            </div>

            {/* Biometric Fingerprint Simulation */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                দাতার বায়োমেট্রিক / ফিঙ্গারপ্রিন্ট ভেরিফিকেশন
              </span>
              <button
                type="button"
                onClick={() => setDonorBiometricVerified(!donorBiometricVerified)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px 16px',
                  background: donorBiometricVerified ? '#dcfce7' : '#ffffff',
                  color: donorBiometricVerified ? '#166534' : '#475569',
                  border: `1.5px solid ${donorBiometricVerified ? '#86efac' : '#cbd5e1'}`,
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Fingerprint size={20} color={donorBiometricVerified ? '#166534' : '#64748b'} />
                <span>{donorBiometricVerified ? 'দাতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক যাচাই সম্পন্ন' : 'ফিঙ্গারপ্রিন্ট স্ক্যান করুন'}</span>
              </button>
            </div>
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
              marginBottom: '16px'
            }}>
              {submissionError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmitHebaDeed}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #065f46, #047857)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.35)'
              }}
            >
              <Gift size={18} />
              <span>{submitting ? 'দলিল মঞ্জুর হচ্ছে...' : 'দানপত্র / হেবা দলিল মঞ্জুর করুন (Grant Deed to AC Land)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
