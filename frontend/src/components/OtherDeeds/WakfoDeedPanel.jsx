import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2,
  Search,
  CheckCircle,
  AlertTriangle,
  Send,
  Shield,
  Fingerprint,
  RefreshCw,
  Clock,
  Landmark,
  FileCheck,
  Info
} from 'lucide-react';
import CascadingLandSelector from './CascadingLandSelector';

const INSTITUTION_TYPES = [
  'মসজিদ (Mosque)',
  'কওমি / আলিয়া মাদ্রাসা (Madrasa)',
  'কবরস্থান / ঈদগাহ (Graveyard / Eidgah)',
  'এতিমখানা (Orphanage)',
  'স্কুল / কলেজ / শিক্ষা প্রতিষ্ঠান (School / College)',
  'দাতব্য চিকিৎসালয় / হাসপাতাল (Charitable Hospital)',
  'অন্যান্য ধর্মীয় ও জনকল্যাণমূলক ওয়াকফ (Other Waqf)'
];

export default function WakfoDeedPanel() {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'tracking'

  // Donor search states
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

  // Institution Recipient states
  const [institutionNid, setInstitutionNid] = useState('');
  const [verifyingInstitution, setVerifyingInstitution] = useState(false);
  const [institutionData, setInstitutionData] = useState(null);
  const [institutionError, setInstitutionError] = useState(null);

  // Wakfo Terms
  const [institutionType, setInstitutionType] = useState('মসজিদ (Mosque)');
  const [wakfoArea, setWakfoArea] = useState('');
  const [wakfoPurpose, setWakfoPurpose] = useState('');

  // Donor OTP & Biometric
  const [donorOtp, setDonorOtp] = useState('');
  const [sendingDonorOtp, setSendingDonorOtp] = useState(false);
  const [donorOtpSentMsg, setDonorOtpSentMsg] = useState(null);
  const [donorBiometricVerified, setDonorBiometricVerified] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Tracking List states
  const [wakfoApplications, setWakfoApplications] = useState([]);
  const [loadingWakfoApps, setLoadingWakfoApps] = useState(false);

  const fetchWakfoApplications = async () => {
    setLoadingWakfoApps(true);
    try {
      const res = await axios.get('/api/other-deeds/wakfo/applications');
      if (res.data?.success) {
        setWakfoApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load Wakfo applications:', err);
    } finally {
      setLoadingWakfoApps(false);
    }
  };

  useEffect(() => {
    fetchWakfoApplications();
  }, [activeSubTab]);

  // Sub-Registrar Authority: Custody & Mutawalli Management State
  const [institutionsList, setInstitutionsList] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [selectedInst, setSelectedInst] = useState(null);
  const [instSearchQuery, setInstSearchQuery] = useState('');
  const [custodyForm, setCustodyForm] = useState({
    name: '',
    representative_name: '',
    representative_designation: 'মোতাওয়াল্লী / সভাপতি',
    reason: '',
    resolution_no: '',
    effective_date: new Date().toISOString().split('T')[0],
    phone: '',
    email: ''
  });
  const [submittingCustody, setSubmittingCustody] = useState(false);
  const [custodySuccessMsg, setCustodySuccessMsg] = useState(null);
  const [custodyErrMsg, setCustodyErrMsg] = useState(null);

  const fetchInstitutionsList = async () => {
    setLoadingInstitutions(true);
    try {
      const res = await axios.get('/api/user/institutions-list');
      if (res.data?.success) {
        setInstitutionsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load institutions list:', err);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleSelectInstitution = (inst) => {
    setSelectedInst(inst);
    setCustodyForm({
      name: inst.name || '',
      representative_name: inst.representative_name || inst.father_name || '',
      representative_designation: inst.representative_designation || 'মোতাওয়াল্লী / সভাপতি',
      reason: '',
      resolution_no: 'SR-MEMO-' + Date.now().toString().slice(-4),
      effective_date: new Date().toISOString().split('T')[0],
      phone: inst.phone || '',
      email: inst.email || ''
    });
    setCustodySuccessMsg(null);
    setCustodyErrMsg(null);
  };

  const handleCustodySubmit = async (e) => {
    e.preventDefault();
    if (!selectedInst) {
      setCustodyErrMsg('অনুগ্রহ করে প্রথমে একটি প্রতিষ্ঠান নির্বাচন করুন।');
      return;
    }
    if (!custodyForm.representative_name?.trim()) {
      setCustodyErrMsg('অনুগ্রহ করে নতুন দায়িত্বরত মোতাওয়াল্লী / প্রতিনিধির নাম লিখুন।');
      return;
    }
    if (!custodyForm.reason?.trim()) {
      setCustodyErrMsg('অনুগ্রহ করে পরিবর্তনের কারণ ও রেজুলেশন বিবরণ লিখুন।');
      return;
    }

    setSubmittingCustody(true);
    setCustodySuccessMsg(null);
    setCustodyErrMsg(null);

    try {
      const res = await axios.put('/api/user/institution-custody', {
        institution_id: selectedInst._id,
        name: custodyForm.name,
        representative_name: custodyForm.representative_name,
        representative_designation: custodyForm.representative_designation,
        reason: custodyForm.reason,
        resolution_no: custodyForm.resolution_no,
        effective_date: custodyForm.effective_date,
        phone: custodyForm.phone,
        email: custodyForm.email
      });

      if (res.data?.success) {
        setCustodySuccessMsg(res.data.message || 'সাব-রেজিস্ট্রার কর্তৃক মোতাওয়াল্লী ও নাম সফলভাবে হালনাগাদ করা হয়েছে!');
        setSelectedInst(res.data.user);
        fetchInstitutionsList();
      } else {
        setCustodyErrMsg(res.data?.message || 'পরিবর্তন সম্পন্ন করা যায়নি।');
      }
    } catch (err) {
      setCustodyErrMsg(err.response?.data?.message || 'সার্ভার ত্রুটি: পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setSubmittingCustody(false);
    }
  };

  // Search Donor Land
  const handleSearchLand = async (params) => {
    const nid = (params?.owner_nid || donorNid || '').trim();
    const mouza = (params?.mouza || landLocation.mouza || '').trim();
    const dag_no = (params?.dag_no || landLocation.dag_no || '').trim();
    const khatian_no = (params?.khatian_no || landLocation.khatian_no || '').trim();

    if (!nid || !mouza || !dag_no || !khatian_no) {
      setSearchError('অনুগ্রহ করে দাতার NID এবং বিভাগ থেকে দাগ নম্বর পর্যন্ত প্রতিটি অপশন ক্রমানুসারে সিলেক্ট করুন।');
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
        division: params?.division || landLocation.division || '',
        district: params?.district || landLocation.district || '',
        upazila: params?.upazila || landLocation.upazila || ''
      });

      if (res.data.success && res.data.record) {
        setSearchResult(res.data.record);
        if (res.data.record.available_area_decimal) {
          setWakfoArea(res.data.record.available_area_decimal.toString());
        }
      } else {
        setSearchError(res.data.message || 'উক্ত তথ্যাদির অনুকূলে কোনো বৈধ মালিকানার রেকর্ড পাওয়া যায়নি।');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'জমি অনুসন্ধানে সার্ভার ত্রুটি হয়েছে।');
    } finally {
      setSearching(false);
    }
  };

  // Verify Institution by NID & ensure role === 'Institution'
  const handleVerifyInstitution = async () => {
    if (!institutionNid.trim()) {
      setInstitutionError('অনুগ্রহ করে প্রতিষ্ঠান প্রতিনিধি / মোতাওয়াল্লীর NID নম্বর লিখুন।');
      return;
    }

    setVerifyingInstitution(true);
    setInstitutionError(null);
    setInstitutionData(null);

    try {
      const res = await axios.post('/api/other-deeds/verify-institution-nid', {
        nid: institutionNid.trim()
      });

      if (res.data.success && res.data.institution) {
        setInstitutionData(res.data.institution);
      } else {
        setInstitutionError(res.data.message || 'প্রতিষ্ঠান যাচাই ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setInstitutionError(err.response?.data?.message || 'প্রতিষ্ঠান যাচাইয়ে ত্রুটি হয়েছে।');
    } finally {
      setVerifyingInstitution(false);
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
        recipient_nid: searchResult.owner_nid,
        recipient_name: searchResult.owner_name,
        record_id: searchResult._id,
        deed_title: 'ওয়াকফ দলিল রেজিস্ট্রেশন অনুমোদন',
        deed_no: `WAKF-DAG-${searchResult.dag_no}`
      });
      if (res.data.success) {
        let msg = res.data.message || 'ওটিপি সফলভাবে পাঠানো হয়েছে।';
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        setDonorOtpSentMsg(msg);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      setDonorOtpSentMsg(`❌ ${errMsg}`);
    } finally {
      setSendingDonorOtp(false);
    }
  };

  // Submit Wakfo Deed
  const handleSubmitWakfoDeed = async () => {
    if (!searchResult) {
      setSubmitError('প্রথমে দাতার জমি অনুসন্ধান করে নির্বাচন করুন।');
      return;
    }
    if (!institutionData) {
      setSubmitError('গ্রহীতা প্রতিষ্ঠান যাচাই সম্পন্ন করুন।');
      return;
    }
    if (!wakfoArea || parseFloat(wakfoArea) <= 0) {
      setSubmitError('সঠিক ওয়াকফকৃত জমির পরিমাণ লিখুন।');
      return;
    }
    if (parseFloat(wakfoArea) > searchResult.available_area_decimal) {
      setSubmitError(`ওয়াকফকৃত জমি অবশিষ্ট জমির (${searchResult.available_area_decimal} শতক) চেয়ে বেশি হতে পারে না।`);
      return;
    }
    if (!donorOtp.trim()) {
      setSubmitError('দাতার ৬ ডিজিটের ওটিপি (OTP) প্রদান আবশ্যক।');
      return;
    }
    if (!donorBiometricVerified) {
      setSubmitError('দাতার ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক নিশ্চিত করুন।');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await axios.post('/api/other-deeds/wakfo/create', {
        land_record_id: searchResult._id,
        donor_nid: searchResult.owner_nid,
        institution_nid: institutionData.nid,
        wakfo_area_decimal: parseFloat(wakfoArea),
        institution_type: institutionType,
        wakfo_purpose: wakfoPurpose.trim() || 'ধর্মীয় ও জনকল্যাণমূলক ওয়াকফ',
        donor_otp: donorOtp.trim()
      });

      if (res.data.success) {
        setSubmitSuccess('আবেদন পাঠানো সম্পন্ন হলো ।');
        setSearchResult(null);
        setInstitutionData(null);
        setInstitutionNid('');
        setWakfoArea('');
        setWakfoPurpose('');
        setDonorOtp('');
        setDonorBiometricVerified(false);
        setDonorOtpSentMsg(null);
        fetchWakfoApplications();
      } else {
        setSubmitError(res.data.message || 'ওয়াকফ দলিল তৈরি করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'ওয়াকফ দলিল সৃষ্টিতে সার্ভার ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(13, 148, 136, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <Landmark size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              ওয়াকফ দলিল রেজিস্ট্রেশন (Waqf / Wakfo Deed Management)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              নাগরিক কর্তৃক ধর্মীয় ও জনকল্যাণমূলক প্রতিষ্ঠানের (মসজিদ/মাদ্রাসা/স্কুল) অনুকূলে জমি চিরস্থায়ী দান ও যুগপৎ নামজারি
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
          সিটিজেন ➔ প্রতিষ্ঠান ওয়াকফ
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
            border: activeSubTab === 'create' ? '1.5px solid #0f766e' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'create' ? 'linear-gradient(135deg, #0f766e, #0d9488)' : '#f8fafc',
            color: activeSubTab === 'create' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'create' ? '0 4px 12px rgba(15, 118, 110, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Building2 size={16} />
          <span>১. নতুন ওয়াকফ দলিল সম্পাদন</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('tracking'); fetchWakfoApplications(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeSubTab === 'tracking' ? '1.5px solid #0f766e' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'tracking' ? 'linear-gradient(135deg, #0f766e, #0d9488)' : '#f8fafc',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'tracking' ? '0 4px 12px rgba(15, 118, 110, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>২. প্রেরিত ওয়াকফ দলিলের স্থিতি ও ট্র্যাকিং</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '999px',
            background: activeSubTab === 'tracking' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
            color: activeSubTab === 'tracking' ? '#ffffff' : '#475569',
            fontWeight: '800'
          }}>
            {wakfoApplications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('custody'); fetchInstitutionsList(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeSubTab === 'custody' ? '1.5px solid #0f766e' : '1.5px solid #cbd5e1',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSubTab === 'custody' ? 'linear-gradient(135deg, #0f766e, #0d9488)' : '#f8fafc',
            color: activeSubTab === 'custody' ? '#ffffff' : '#334155',
            boxShadow: activeSubTab === 'custody' ? '0 4px 12px rgba(15, 118, 110, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Landmark size={16} />
          <span>৩. প্রতিষ্ঠান ও মোতাওয়াল্লী পরিবর্তন (সাব-রেজিস্ট্রার এখতিয়ার)</span>
        </button>
      </div>

      {/* SUB-TAB 1: CREATE WAKFO DEED */}
      {activeSubTab === 'create' && (
        <div>
          {submitSuccess && (
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

          {/* STEP 1: Search Donor Land */}
          <div className="glass-card" style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '26px', height: '26px', background: '#0f766e', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>১</span>
              দাতার জমি অনুসন্ধান ও নির্বাচন (Donor Land Selection)
            </h3>

            <CascadingLandSelector
              nidLabel="দাতার জাতীয় পরিচয়পত্র (NID)"
              nidPlaceholder="দাতার ১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি লিখুন"
              nidValue={donorNid}
              onNidChange={setDonorNid}
              onSelectionChange={setLandLocation}
              onSearch={handleSearchLand}
              searching={searching}
              accentColor="#0f766e"
              searchButtonText="🔍 দাতার জমি অনুসন্ধান ও মালিকানা যাচাই করুন"
            />

            {searchError && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                {searchError}
              </div>
            )}

            {/* Found Land Card */}
            {searchResult && (
              <div style={{
                marginTop: '20px',
                background: '#f0fdfa',
                border: '1.5px solid #99f6e4',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="#0d9488" />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f766e' }}>
                      দাতার জমি সফলভাবে সনাক্ত হয়েছে
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    background: '#ccfbf1',
                    color: '#0f766e',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: '1px solid #99f6e4'
                  }}>
                    স্ট্যাটাস: {searchResult.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>জমির মালিক (দাতা)</span>
                    <strong style={{ color: '#0f172a' }}>{searchResult.owner_name}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {searchResult.owner_nid}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>মৌজা ও জে.এল নং</span>
                    <strong style={{ color: '#0f172a' }}>{searchResult.mouza}</strong> (জে.এল: {searchResult.jl_no || '-'})
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>দাগ ও খতিয়ান নম্বর</span>
                    <strong style={{ color: '#0f172a' }}>দাগ: {searchResult.dag_no}</strong> | খতিয়ান: {searchResult.khatian_no}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>মোট ও অবশিষ্ট জমি</span>
                    <strong style={{ color: '#0d9488' }}>অবশিষ্ট: {searchResult.available_area_decimal} শতক</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>(মোট: {searchResult.total_area_decimal} শতক)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Institution Verification & Terms */}
          {searchResult && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '26px', height: '26px', background: '#0f766e', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>২</span>
                গ্রহীতা প্রতিষ্ঠান যাচাই ও ওয়াকফের শর্তাবলী (Institution Verification & Waqf Terms)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    প্রতিষ্ঠান প্রতিনিধি / মোতাওয়াল্লীর NID নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি লিখুন"
                      value={institutionNid}
                      onChange={(e) => setInstitutionNid(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13.5px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyInstitution}
                      disabled={verifyingInstitution}
                      style={{
                        padding: '10px 18px',
                        background: '#0f766e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: verifyingInstitution ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {verifyingInstitution ? 'যাচাই হচ্ছে...' : 'প্রতিষ্ঠান যাচাই'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    প্রতিষ্ঠানের ধরন / ওয়াকফ ক্যাটাগরি
                  </label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      background: '#ffffff'
                    }}
                  >
                    {INSTITUTION_TYPES.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {institutionError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '16px'
                }}>
                  {institutionError}
                </div>
              )}

              {/* Verified Institution Details Card */}
              {institutionData && (
                <div style={{
                  background: '#f0fdfa',
                  border: '1.5px solid #99f6e4',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={20} color="#0f766e" />
                      <strong style={{ fontSize: '15px', color: '#0f766e' }}>
                        {institutionData.name}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      background: '#ccfbf1',
                      color: '#0f766e',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      border: '1px solid #5eead4'
                    }}>
                      🏛️ নিবন্ধিত প্রতিষ্ঠান (Role: Institution)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                    <div>প্রতিনিধি NID: <strong>{institutionData.nid}</strong></div>
                    <div>মোবাইল: <strong>{institutionData.phone}</strong></div>
                    <div>ইমেইল: <strong>{institutionData.email}</strong></div>
                    <div>এলাকা: <strong>{institutionData.upazila}, {institutionData.district}</strong></div>
                  </div>
                </div>
              )}

              {/* Area & Purpose */}
              {institutionData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      ওয়াকফকৃত জমির পরিমাণ (শতক) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={`সর্বোচ্চ ${searchResult.available_area_decimal} শতক`}
                      value={wakfoArea}
                      onChange={(e) => setWakfoArea(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: '#0f766e'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      দাতার অবশিষ্ট জমি থাকবে: <strong>{Math.max(0, (searchResult.available_area_decimal - (parseFloat(wakfoArea) || 0))).toFixed(2)} শতক</strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      ওয়াকফের উদ্দেশ্য ও বিশেষ শর্তাবলী
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মসজিদ সম্প্রসারণ ও এতিমখানার কল্যাণে চিরস্থায়ী ওয়াকফ"
                      value={wakfoPurpose}
                      onChange={(e) => setWakfoPurpose(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13.5px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Donor OTP & Biometric */}
          {searchResult && institutionData && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '26px', height: '26px', background: '#0f766e', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>৩</span>
                দাতার ওটিপি ও বায়োমেট্রিক নিশ্চিতকরণ (Donor OTP & Biometric Verification)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    দাতার ৬ ডিজিটের ওটিপি কোড (OTP) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="৬ ডিজিটের ওটিপি কোড"
                      value={donorOtp}
                      onChange={(e) => setDonorOtp(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '14px',
                        letterSpacing: '2px',
                        fontWeight: '700'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendDonorOtp}
                      disabled={sendingDonorOtp}
                      style={{
                        padding: '10px 16px',
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: sendingDonorOtp ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {sendingDonorOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}
                    </button>
                  </div>
                  {donorOtpSentMsg && (
                    <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: '600', color: donorOtpSentMsg.startsWith('❌') ? '#dc2626' : '#059669' }}>
                      {donorOtpSentMsg}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    দাতার বায়োমেট্রিক ফিঙ্গারপ্রিন্ট <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDonorBiometricVerified(true)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      border: '1.5px dashed',
                      borderColor: donorBiometricVerified ? '#059669' : '#cbd5e1',
                      background: donorBiometricVerified ? '#f0fdf4' : '#f8fafc',
                      color: donorBiometricVerified ? '#059669' : '#475569',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Fingerprint size={18} />
                    <span>{donorBiometricVerified ? 'দাতার ফিঙ্গারপ্রিন্ট স্ক্যান সম্পন্ন' : 'ফিঙ্গারপ্রিন্ট স্ক্যান করুন'}</span>
                  </button>
                </div>
              </div>

              {submitError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '16px'
                }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSubmitWakfoDeed}
                  disabled={submitting}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={18} />
                  <span>{submitting ? 'সম্পাদন হচ্ছে...' : 'ওয়াকফ দলিল সম্পাদন ও এসি ল্যান্ডে পাঠান'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DEDICATED TRACKING TABLE */}
      {activeSubTab === 'tracking' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#0f766e" />
                প্রেরিত ওয়াকফ দলিলের স্থিতি ও নামজারি ট্র্যাকিং
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                এসি ল্যান্ড অফিসে প্রেরিত ওয়াকফ দলিল ও প্রতিষ্ঠানের অনুকূলে নামজারির হালনাগাদ অগ্রগতি
              </p>
            </div>
            <button
              onClick={fetchWakfoApplications}
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
              <RefreshCw size={14} className={loadingWakfoApps ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {loadingWakfoApps ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>তথ্য লোড হচ্ছে...</div>
            </div>
          ) : wakfoApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>এখনো কোনো ওয়াকফ দলিল প্রেরণ করা হয়নি</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>নতুন ওয়াকফ দলিল সম্পাদন করা হলে তা এখানে তালিকাভুক্ত হবে</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px' }}>ওয়াকফ দলিল নং</th>
                    <th style={{ padding: '12px 14px' }}>দাতা নাগরিক (ওয়াকিফ)</th>
                    <th style={{ padding: '12px 14px' }}>গ্রহীতা প্রতিষ্ঠান (ওয়াকফ)</th>
                    <th style={{ padding: '12px 14px' }}>জমির তথ্য ও পরিমাণ</th>
                    <th style={{ padding: '12px 14px' }}>ওয়াকফের উদ্দেশ্য</th>
                    <th style={{ padding: '12px 14px' }}>বর্তমান স্ট্যাটাস</th>
                    <th style={{ padding: '12px 14px' }}>পর্যালোচনা</th>
                  </tr>
                </thead>
                <tbody>
                  {wakfoApplications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', color: '#0f766e', fontWeight: '800' }}>
                          {app.deed_no}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>আবেদন: {app.application_no}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{app.wakfo?.donor_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {app.wakfo?.donor_nid}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: '#0f766e' }}>{app.wakfo?.institution_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>প্রতিনিধি NID: {app.wakfo?.institution_nid}</div>
                        <div style={{ fontSize: '11px', color: '#0d9488', marginTop: '2px' }}>{app.wakfo?.institution_type}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: '#0f766e' }}>
                          {app.wakfo?.wakfo_area_decimal} শতক
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          দাগ: {app.wakfo?.dag_no} | খতিয়ান: {app.wakfo?.khatian_no}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>মৌজা: {app.wakfo?.mouza}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                        {app.wakfo?.wakfo_purpose || 'ধর্মীয় ও জনকল্যাণমূলক'}
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
                          {app.status === 'Approved' ? '✅ অনুমোদিত ও মিউটেশন সম্পন্ন' : app.status === 'Rejected' ? '❌ প্রত্যাখ্যাত (Rejected)' : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                        {app.ac_land_reviewed_by ? (
                          <div>
                            <div>কর্মকর্তা: {app.ac_land_reviewed_by}</div>
                            {app.rejection_reason && <div style={{ color: '#dc2626', fontWeight: '700' }}>কারণ: {app.rejection_reason}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>পর্যালোচনার অপেক্ষায়</span>
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

      {/* SUB-TAB 3: INSTITUTION & MUTAWALLI CUSTODY MANAGEMENT (SUB-REGISTRAR EXCLUSIVE) */}
      {activeSubTab === 'custody' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sub-Registrar Authority Banner */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderLeft: '5px solid #0f766e',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                flexShrink: 0
              }}>
                <Landmark size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    ওয়াকফ প্রতিষ্ঠান ও মোতাওয়াল্লী পরিবর্তন ব্যবস্থাপনা
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    background: '#ccfbf1',
                    color: '#0f766e',
                    border: '1px solid #99f6e4',
                    fontWeight: '800'
                  }}>
                    সাব-রেজিস্ট্রারের প্রশাসনিক এখতিয়ার
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#475569', margin: '3px 0 0 0' }}>
                  মসজিদ, মাদ্রাসা বা ওয়াকফ প্রতিষ্ঠান নিজে তাদের মোতাওয়াল্লী পরিবর্তন করতে পারে না। সরকারি রেজুলেশন ও অনুমোদনের ভিত্তিতে সাব-রেজিস্ট্রার কর্তৃক এন্ট্রি সম্পন্ন হয়।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchInstitutionsList}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px'
              }}
            >
              <RefreshCw size={13} className={loadingInstitutions ? 'animate-spin' : ''} />
              <span>রিফ্রেশ তালিকা</span>
            </button>
          </div>

          {/* Grid Layout: Left Selection List | Right Edit Form & History */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.4fr)', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: Institution Selector Card */}
            <div className="glass-card" style={{ padding: '20px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="#0f766e" />
                  <span>নিবন্ধিত প্রতিষ্ঠান নির্বাচন করুন</span>
                </h4>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                  মোট: {institutionsList.length} টি
                </span>
              </div>

              {/* Quick Search */}
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="প্রতিষ্ঠান বা মোতাওয়াল্লীর নাম/NID দিয়ে খুঁজুন..."
                  value={instSearchQuery}
                  onChange={(e) => setInstSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: '12.5px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {loadingInstitutions ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  প্রতিষ্ঠান তালিকা লোড হচ্ছে...
                </div>
              ) : institutionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                  কোনো প্রতিষ্ঠান নিবন্ধিত পাওয়া যায়নি।
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {institutionsList
                    .filter(inst => {
                      if (!instSearchQuery.trim()) return true;
                      const q = instSearchQuery.toLowerCase();
                      return (
                        (inst.name && inst.name.toLowerCase().includes(q)) ||
                        (inst.nid && inst.nid.includes(q)) ||
                        (inst.representative_name && inst.representative_name.toLowerCase().includes(q))
                      );
                    })
                    .map((inst) => {
                      const isSelected = selectedInst?._id === inst._id;
                      return (
                        <div
                          key={inst._id}
                          onClick={() => handleSelectInstitution(inst)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #0f766e' : '1px solid #e2e8f0',
                            background: isSelected ? '#f0fdfa' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '13.5px', color: isSelected ? '#0f766e' : '#0f172a' }}>
                              {inst.name}
                            </strong>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: '#ccfbf1',
                              color: '#0f766e',
                              fontWeight: '700'
                            }}>
                              ওয়াকফ
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                            মোতাওয়াল্লী: <strong style={{ color: '#0f172a' }}>{inst.representative_name || inst.father_name || 'নির্ধারিত হয়নি'}</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>NID: {inst.nid}</span>
                            <span>{inst.upazila}, {inst.district}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Right: Sub-Registrar Edit Form & Historical Audit */}
            <div>
              {!selectedInst ? (
                <div className="glass-card" style={{
                  padding: '40px 24px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#f0fdfa',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px'
                  }}>
                    <Building2 size={28} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                    বাম পাশ থেকে একটি প্রতিষ্ঠান নির্বাচন করুন
                  </h4>
                  <p style={{ fontSize: '13px', margin: 0, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                    মসজিদ বা মাদ্রাসার নাম সিলেক্ট করলে তার বর্তমান তথ্য, অতীতের মোতাওয়াল্লীর ইতিহাস ও নতুন পরিবর্তন ফর্ম প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Selected Institution Current Summary */}
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px solid #99f6e4',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#0f766e', fontWeight: '800', textTransform: 'uppercase' }}>
                        নির্বাচিত ওয়াকফ প্রতিষ্ঠান
                      </div>
                      <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                        {selectedInst.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        বর্তমান মোতাওয়াল্লী: <strong style={{ color: '#0f766e' }}>{selectedInst.representative_name || selectedInst.father_name || 'নির্ধারিত হয়নি'}</strong> ({selectedInst.representative_designation || 'মোতাওয়াল্লী'})
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>এনআইডি নম্বর:</span>
                      <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '13px' }}>{selectedInst.nid}</strong>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Landmark size={18} color="#0f766e" />
                      <span>সাব-রেজিস্ট্রার অনুমোদন ফর্ম (মোতাওয়াল্লী / নাম পরিবর্তন)</span>
                    </h4>

                    {custodyErrMsg && (
                      <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
                        ⚠️ {custodyErrMsg}
                      </div>
                    )}

                    {custodySuccessMsg && (
                      <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                        {custodySuccessMsg}
                      </div>
                    )}

                    <form onSubmit={handleCustodySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          প্রতিষ্ঠানের পূর্ণ নাম (প্রয়োজনে সংশোধনযোগ্য) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={custodyForm.name}
                          onChange={(e) => setCustodyForm(p => ({ ...p, name: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            নতুন দায়িত্বরত মোতাওয়াল্লী / প্রতিনিধির নাম <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="যেমন: মাওলানা মো. আব্দুর রহিম"
                            value={custodyForm.representative_name}
                            onChange={(e) => setCustodyForm(p => ({ ...p, representative_name: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            পদবী <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select
                            value={custodyForm.representative_designation}
                            onChange={(e) => setCustodyForm(p => ({ ...p, representative_designation: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          >
                            <option value="মোতাওয়াল্লী / সভাপতি">মোতাওয়াল্লী / সভাপতি</option>
                            <option value="সাধারণ সম্পাদক">সাধারণ সম্পাদক</option>
                            <option value="মুহতামিম / প্রিন্সিপাল">মুহতামিম / প্রিন্সিপাল</option>
                            <option value="পরিচালনা কমিটির সদস্য">পরিচালনা কমিটির সদস্য</option>
                            <option value="ট্রাস্টি (Trustee)">ট্রাস্টি (Trustee)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          পরিবর্তনের কারণ ও রেজুলেশন বিবরণ <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="যেমন: পরিচালনা কমিটির রেজুলেশন অনুযায়ী এবং সাব-রেজিস্ট্রার কর্তৃক অনুমোদিত হয়ে নতুন মোতাওয়াল্লী নিয়োগ সম্পন্ন হয়েছে।"
                          value={custodyForm.reason}
                          onChange={(e) => setCustodyForm(p => ({ ...p, reason: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            রেজুলেশন / স্মারক নম্বর (Memo No)
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: SR-MEMO-2026-44"
                            value={custodyForm.resolution_no}
                            onChange={(e) => setCustodyForm(p => ({ ...p, resolution_no: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            কার্যকর হওয়ার তারিখ
                          </label>
                          <input
                            type="date"
                            value={custodyForm.effective_date}
                            onChange={(e) => setCustodyForm(p => ({ ...p, effective_date: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            মোবাইল নম্বর
                          </label>
                          <input
                            type="tel"
                            value={custodyForm.phone}
                            onChange={(e) => setCustodyForm(p => ({ ...p, phone: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                            ইমেইল ঠিকানা
                          </label>
                          <input
                            type="email"
                            value={custodyForm.email}
                            onChange={(e) => setCustodyForm(p => ({ ...p, email: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="submit"
                          disabled={submittingCustody}
                          className="btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '11px 24px',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                            borderRadius: '8px'
                          }}
                        >
                          <CheckCircle size={16} />
                          <span>{submittingCustody ? 'সংরক্ষণ করা হচ্ছে...' : 'সাব-রেজিস্ট্রার হিসেবে পরিবর্তন ও অনুমোদন নিশ্চিত করুন'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Chronological History for Selected Institution */}
                  <div className="glass-card" style={{ padding: '20px 24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#0f766e" />
                      <span>এই প্রতিষ্ঠানের অতীতের দায়িত্ব ও নাম পরিবর্তনের ইতিহাস</span>
                    </h4>

                    {(!selectedInst.custody_history || selectedInst.custody_history.length === 0) ? (
                      <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12.5px', color: '#64748b' }}>
                        📌 এখনও পর্যন্ত কোনো পরিবর্তন রেকর্ড করা হয়নি। বর্তমানে প্রাথমিক নিবন্ধিত মোতাওয়াল্লী বহাল রয়েছে।
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedInst.custody_history.map((rec, i) => (
                          <div key={rec._id || i} style={{
                            padding: '12px 16px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderLeft: i === 0 ? '4px solid #0f766e' : '4px solid #94a3b8',
                            borderRadius: '8px',
                            fontSize: '12.5px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                              <strong style={{ color: '#0f766e' }}>
                                স্মারক: {rec.resolution_no || 'রেজুলেশন'}
                              </strong>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                তারিখ: {new Date(rec.effective_date || rec.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                              <div>
                                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>নাম:</span>
                                <span>{rec.previous_name && rec.previous_name !== rec.new_name ? `${rec.previous_name} ➔ ${rec.new_name}` : rec.new_name}</span>
                              </div>
                              <div>
                                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>মোতাওয়াল্লী:</span>
                                <span>{rec.previous_representative && rec.previous_representative !== rec.new_representative ? `${rec.previous_representative} ➔ ${rec.new_representative}` : rec.new_representative}</span>
                              </div>
                              <div>
                                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>অনুমোদনকারী:</span>
                                <strong style={{ color: '#0f766e' }}>{rec.changed_by}</strong>
                              </div>
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#475569' }}>
                              কারণ: {rec.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

