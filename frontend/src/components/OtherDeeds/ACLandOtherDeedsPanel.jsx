import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Gift,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  CreditCard,
  Check,
  X,
  FileCheck,
  Clock,
  UserCheck,
  Building2,
  Landmark
} from 'lucide-react';

export default function ACLandOtherDeedsPanel() {
  const [activeTab, setActiveTab] = useState('heba'); // 'heba' | 'exchange' | 'wakfo'

  // Heba states
  const [hebaApps, setHebaApps] = useState([]);
  const [loadingHeba, setLoadingHeba] = useState(false);
  const [selectedHeba, setSelectedHeba] = useState(null);
  const [recipientOtp, setRecipientOtp] = useState('');
  const [sendingRecipientOtp, setSendingRecipientOtp] = useState(false);
  const [recipientOtpSentMsg, setRecipientOtpSentMsg] = useState(null);
  const [verifyingRecipientOtp, setVerifyingRecipientOtp] = useState(false);
  const [recipientOtpVerified, setRecipientOtpVerified] = useState(false);
  const [hebaProcessing, setHebaProcessing] = useState(false);
  const [hebaActionMsg, setHebaActionMsg] = useState(null);
  const [hebaActionError, setHebaActionError] = useState(null);

  // Exchange states
  const [exchangeApps, setExchangeApps] = useState([]);
  const [loadingExchange, setLoadingExchange] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [exchangeProcessing, setExchangeProcessing] = useState(false);
  const [exchangeActionMsg, setExchangeActionMsg] = useState(null);
  const [exchangeActionError, setExchangeActionError] = useState(null);

  // Wakfo states
  const [wakfoApps, setWakfoApps] = useState([]);
  const [loadingWakfo, setLoadingWakfo] = useState(false);
  const [selectedWakfo, setSelectedWakfo] = useState(null);
  const [wakfoProcessing, setWakfoProcessing] = useState(false);
  const [wakfoActionMsg, setWakfoActionMsg] = useState(null);
  const [wakfoActionError, setWakfoActionError] = useState(null);

  useEffect(() => {
    if (activeTab === 'heba') fetchHebaApps();
    else if (activeTab === 'exchange') fetchExchangeApps();
    else if (activeTab === 'wakfo') fetchWakfoApps();
  }, [activeTab]);

  const fetchWakfoApps = async () => {
    setLoadingWakfo(true);
    try {
      const res = await axios.get('/api/other-deeds/wakfo/applications');
      setWakfoApps(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load Wakfo applications:', err);
    } finally {
      setLoadingWakfo(false);
    }
  };

  const fetchHebaApps = async () => {
    setLoadingHeba(true);
    try {
      const res = await axios.get('/api/other-deeds/heba/applications');
      setHebaApps(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load Heba applications:', err);
    } finally {
      setLoadingHeba(false);
    }
  };

  const fetchExchangeApps = async () => {
    setLoadingExchange(true);
    try {
      const res = await axios.get('/api/other-deeds/exchange/applications');
      setExchangeApps(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load Exchange applications:', err);
    } finally {
      setLoadingExchange(false);
    }
  };

  // Send Recipient OTP for Heba
  const handleSendRecipientOtp = async () => {
    if (!selectedHeba) return;
    const email = (selectedHeba.heba?.recipient_email || '').trim().toLowerCase();
    const nid = selectedHeba.heba?.recipient_nid || '';

    setSendingRecipientOtp(true);
    setRecipientOtpSentMsg(null);
    try {
      const res = await axios.post('/api/other-deeds/send-otp', {
        recipient_email: email,
        recipient_nid: nid,
        recipient_name: selectedHeba.heba?.recipient_name,
        record_id: selectedHeba.heba?.land_record_id,
        deed_title: 'হেবা নামজারি অনুমোদন ওটিপি',
        deed_no: selectedHeba.deed_no
      });
      if (res.data.success) {
        let msg = res.data.message || 'গ্রহীতার নিবন্ধিত ইমেইলে ওটিপি কোড সফলভাবে পাঠানো হয়েছে।';
        if (res.data.simulated && res.data.simulated_otp) {
          msg += ` (সিমুলেশন ওটিপি: ${res.data.simulated_otp})`;
        }
        setRecipientOtpSentMsg(msg);
        setRecipientOtp(''); // ইনপুট বক্সে অটো-ইনপুট হবে না; গ্রহীতার নিকট থেকে কোড সংগ্রহ করে ম্যানুয়ালি ইনপুট দিতে হবে
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
      alert(errMsg);
      setRecipientOtpSentMsg(`❌ ${errMsg}`);
    } finally {
      setSendingRecipientOtp(false);
    }
  };

  // Verify Recipient OTP
  const handleVerifyRecipientOtp = async () => {
    if (!selectedHeba || !recipientOtp.trim()) {
      alert('গ্রহীতার ৬ ডিজিটের ওটিপি কোড লিখুন।');
      return;
    }
    setVerifyingRecipientOtp(true);
    try {
      const res = await axios.post('/api/other-deeds/heba/verify-recipient-otp', {
        application_id: selectedHeba._id,
        recipient_otp: recipientOtp.trim()
      });
      if (res.data.success) {
        setRecipientOtpVerified(true);
        setSelectedHeba(prev => ({
          ...prev,
          heba: { ...prev.heba, recipient_otp_verified: true }
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ওটিপি যাচাইয়ে ভুল হয়েছে।');
    } finally {
      setVerifyingRecipientOtp(false);
    }
  };

  // Approve Heba
  const handleApproveHeba = async () => {
    if (!selectedHeba) return;
    setHebaProcessing(true);
    setHebaActionMsg(null);
    setHebaActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/heba/approve', {
        application_id: selectedHeba._id
      });
      if (res.data.success) {
        setHebaActionMsg(res.data.message);
        setSelectedHeba(null);
        setRecipientOtp('');
        setRecipientOtpVerified(false);
        fetchHebaApps();
      }
    } catch (err) {
      setHebaActionError(err.response?.data?.message || 'অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setHebaProcessing(false);
    }
  };

  // Reject Heba
  const handleRejectHeba = async () => {
    if (!selectedHeba) return;
    const reason = prompt('আবেদন খারিজের কারণ লিখুন (ঐচ্ছিক):');
    setHebaProcessing(true);
    setHebaActionMsg(null);
    setHebaActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/heba/reject', {
        application_id: selectedHeba._id,
        reason
      });
      if (res.data.success) {
        setHebaActionMsg(res.data.message);
        setSelectedHeba(null);
        fetchHebaApps();
      }
    } catch (err) {
      setHebaActionError(err.response?.data?.message || 'খারিজ করতে সমস্যা হয়েছে।');
    } finally {
      setHebaProcessing(false);
    }
  };

  // Approve Exchange
  const handleApproveExchange = async () => {
    if (!selectedExchange) return;
    setExchangeProcessing(true);
    setExchangeActionMsg(null);
    setExchangeActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/exchange/approve', {
        application_id: selectedExchange._id
      });
      if (res.data.success) {
        setExchangeActionMsg(res.data.message);
        setSelectedExchange(null);
        fetchExchangeApps();
      }
    } catch (err) {
      setExchangeActionError(err.response?.data?.message || 'অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setExchangeProcessing(false);
    }
  };

  // Reject Exchange
  const handleRejectExchange = async () => {
    if (!selectedExchange) return;
    const reason = prompt('আবেদন নামঞ্জুরের কারণ লিখুন:');
    setExchangeProcessing(true);
    setExchangeActionMsg(null);
    setExchangeActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/exchange/reject', {
        application_id: selectedExchange._id,
        reason
      });
      if (res.data.success) {
        setExchangeActionMsg(res.data.message);
        setSelectedExchange(null);
        fetchExchangeApps();
      }
    } catch (err) {
      setExchangeActionError(err.response?.data?.message || 'নামঞ্জুর করতে সমস্যা হয়েছে।');
    } finally {
      setExchangeProcessing(false);
    }
  };

  // Approve Wakfo Mutation
  const handleApproveWakfo = async () => {
    if (!selectedWakfo) return;
    setWakfoProcessing(true);
    setWakfoActionMsg(null);
    setWakfoActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/wakfo/approve', {
        application_id: selectedWakfo._id
      });
      if (res.data.success) {
        setWakfoActionMsg(res.data.message || 'ওয়াকফ নামজারি সফলভাবে অনুমোদিত হয়েছে।');
        setSelectedWakfo(null);
        fetchWakfoApps();
      }
    } catch (err) {
      setWakfoActionError(err.response?.data?.message || 'ওয়াকফ নামজারি অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setWakfoProcessing(false);
    }
  };

  // Reject Wakfo
  const handleRejectWakfo = async () => {
    if (!selectedWakfo) return;
    const reason = prompt('ওয়াকফ আবেদন নামঞ্জুরের কারণ লিখুন:');
    if (!reason) return;

    setWakfoProcessing(true);
    setWakfoActionMsg(null);
    setWakfoActionError(null);

    try {
      const res = await axios.post('/api/other-deeds/wakfo/reject', {
        application_id: selectedWakfo._id,
        reason
      });
      if (res.data.success) {
        setWakfoActionMsg(res.data.message || 'ওয়াকফ আবেদনটি খারিজ করা হয়েছে।');
        setSelectedWakfo(null);
        fetchWakfoApps();
      }
    } catch (err) {
      setWakfoActionError(err.response?.data?.message || 'ওয়াকফ আবেদন বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setWakfoProcessing(false);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 18px rgba(2, 132, 199, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <FileCheck size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              অন্যান্য হস্তান্তর ও বিনিময় নামজারি পর্যালোচনা (AC Land Desk)
            </h2>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9 }}>
              সাব-রেজিস্ট্রি কার্যালয় থেকে প্রেরিত দানপত্র/হেবা ও জমি বিনিময় দলিলের সরকারি নামজারি অনুমোদন
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Heba vs Exchange */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('heba'); setSelectedHeba(null); }}
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
            background: activeTab === 'heba' ? '#0369a1' : '#f1f5f9',
            color: activeTab === 'heba' ? '#ffffff' : '#475569',
            transition: 'all 0.2s'
          }}
        >
          <Gift size={16} />
          <span>১. দানপত্র / হেবা দলিল নামজারি অনুরোধ ({hebaApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('exchange'); setSelectedExchange(null); }}
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
            background: activeTab === 'exchange' ? '#0369a1' : '#f1f5f9',
            color: activeTab === 'exchange' ? '#ffffff' : '#475569',
            transition: 'all 0.2s'
          }}
        >
          <ArrowRightLeft size={16} />
          <span>২. বিনিময় দলিল নামজারি অনুরোধ ({exchangeApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('wakfo'); setSelectedWakfo(null); }}
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
            background: activeTab === 'wakfo' ? '#0f766e' : '#f1f5f9',
            color: activeTab === 'wakfo' ? '#ffffff' : '#475569',
            transition: 'all 0.2s'
          }}
        >
          <Building2 size={16} />
          <span>৩. ওয়াকফ দলিল নামজারি অনুরোধ ({wakfoApps.filter(a => a.status === 'Pending_AC_Land_Review').length}টি অপেক্ষমান)</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: HEBA REQUESTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'heba' && (
        <div>
          {hebaActionMsg && (
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
              <span>{hebaActionMsg}</span>
            </div>
          )}

          {hebaActionError && (
            <div style={{
              background: '#fee2e2',
              border: '1.5px solid #f87171',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} color="#991b1b" />
              <span>{hebaActionError}</span>
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
                  হেবা / দানপত্র দলিলের আবেদন তালিকা
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  নামজারি পর্যালোচনার জন্য সংশ্লিষ্ট আবেদনটি নির্বাচন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={fetchHebaApps}
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
                <RefreshCw size={13} className={loadingHeba ? 'animate-spin' : ''} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {hebaApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                বর্তমানে কোনো হেবা নামজারি আবেদন অপেক্ষমান নেই।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {hebaApps.map(app => {
                  const h = app.heba || {};
                  const isSelected = selectedHeba?._id === app._id;
                  const isApproved = app.status === 'Approved';
                  const isRejected = app.status === 'Rejected';

                  return (
                    <div
                      key={app._id}
                      onClick={() => {
                        setSelectedHeba(app);
                        setRecipientOtp('');
                        setRecipientOtpSentMsg(null);
                        setRecipientOtpVerified(h.recipient_otp_verified || false);
                      }}
                      style={{
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
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
                            {app.deed_no} (আবেদন: {app.application_no})
                          </span>
                          <span style={{
                            fontSize: '11px',
                            background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                            color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#92400e',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '800'
                          }}>
                            {isApproved ? 'অনুমোদিত' : isRejected ? 'খারিজ' : 'অপেক্ষমান'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                          দাতা: <strong>{h.donor_name}</strong> ➔ গ্রহীতা: <strong>{h.recipient_name}</strong> ({h.relationship}) | দানকৃত জমি: <strong style={{ color: '#0284c7' }}>{h.gift_area_decimal} শতক</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          মৌজা: {h.mouza} | দাগ: {h.dag_no} | খতিয়ান: {h.khatian_no}
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: '6px 16px',
                          background: isSelected ? '#0284c7' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? 'পর্যালোচনাধীন' : 'পর্যালোচনা'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Heba Review Card */}
          {selectedHeba && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '2px solid #0284c7',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0369a1', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gift size={18} />
                <span>হেবা নামজারি পর্যালোচনা ও অনুমোদন (দলিল নং: {selectedHeba.deed_no})</span>
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                fontSize: '13px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>দাতা তথ্য</div>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>{selectedHeba.heba?.donor_name}</div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>NID: {selectedHeba.heba?.donor_nid}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>গ্রহীতা তথ্য ও সম্পর্ক</div>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>{selectedHeba.heba?.recipient_name}</div>
                  <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '700' }}>
                    সম্পর্ক: {selectedHeba.heba?.relationship} (NID: {selectedHeba.heba?.recipient_nid})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>তফসিল ও জমির পরিমাণ</div>
                  <div>মৌজা: <strong>{selectedHeba.heba?.mouza}</strong></div>
                  <div>দাগ নং: <strong>{selectedHeba.heba?.dag_no}</strong> | খতিয়ান: <strong>{selectedHeba.heba?.khatian_no}</strong></div>
                  <div style={{ color: '#0284c7', fontWeight: '800' }}>দানকৃত জমি: {selectedHeba.heba?.gift_area_decimal} শতক</div>
                </div>
              </div>

              {/* Payment Procedure Box */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={20} color="#166534" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                      সরকারি নামজারি ফি পরিশোধ পদ্ধতি (ই-পেমেন্ট)
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      নামজারি ফি: ১,১৫০ টাকা | চালান ও ট্রেজারি ট্রানজ্যাকশন প্রস্তুত
                    </div>
                  </div>
                </div>
                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  ✅ ফি পরিশোধিত (Paid)
                </span>
              </div>

              {/* Recipient OTP Verification Gate */}
              {selectedHeba.status === 'Pending_AC_Land_Review' && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1.5px solid #7dd3fc',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={18} color="#0284c7" />
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0369a1' }}>
                        গ্রহীতার ওটিপি (OTP) ভেরিফিকেশন গেটওয়ে *বাধ্যতামূলক
                      </span>
                    </div>
                    {!recipientOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendRecipientOtp}
                        disabled={sendingRecipientOtp}
                        style={{
                          fontSize: '11.5px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Send size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {sendingRecipientOtp ? 'পাঠানো হচ্ছে...' : 'গ্রহীতার ইমেইলে ওটিপি পাঠান'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 10px 0' }}>
                    এসি ল্যান্ড অফিসে নামজারি চূড়ান্ত অনুমোদনের পূর্বে গ্রহীতার সম্মতি নিশ্চিত করতে ৬ ডিজিটের ওটিপি যাচাই করুন।
                  </p>

                  {recipientOtpVerified ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '800', fontSize: '13px' }}>
                      <CheckCircle size={16} />
                      <span>গ্রহীতার ওটিপি সফলভাবে যাচাইকৃত হয়েছে। এখন অনুমোদন প্রদান করা যাবে।</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', maxWidth: '320px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="৬ ডিজিটের কোড"
                        maxLength={6}
                        value={recipientOtp}
                        onChange={e => setRecipientOtp(e.target.value)}
                        style={{ width: '100%', fontFamily: 'monospace', fontWeight: '800' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyRecipientOtp}
                        disabled={verifyingRecipientOtp}
                        style={{
                          padding: '8px 16px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        {verifyingRecipientOtp ? '...' : 'যাচাই'}
                      </button>
                    </div>
                  )}
                  {recipientOtpSentMsg && <div style={{ fontSize: '11px', color: '#166534', marginTop: '6px' }}>{recipientOtpSentMsg}</div>}
                </div>
              )}

              {/* Action Buttons */}
              {selectedHeba.status === 'Pending_AC_Land_Review' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleRejectHeba}
                    disabled={hebaProcessing}
                    style={{
                      padding: '10px 24px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    আবেদন খারিজ
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveHeba}
                    disabled={hebaProcessing || !recipientOtpVerified}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 28px',
                      background: recipientOtpVerified ? 'linear-gradient(135deg, #059669, #10b981)' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: recipientOtpVerified ? 'pointer' : 'not-allowed',
                      boxShadow: recipientOtpVerified ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
                    }}
                  >
                    <Check size={16} />
                    <span>{hebaProcessing ? 'অনুমোদন হচ্ছে...' : 'হেবা নামজারি অনুমোদন করুন'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: EXCHANGE REQUESTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'exchange' && (
        <div>
          {exchangeActionMsg && (
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
              <span>{exchangeActionMsg}</span>
            </div>
          )}

          {exchangeActionError && (
            <div style={{
              background: '#fee2e2',
              border: '1.5px solid #f87171',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} color="#991b1b" />
              <span>{exchangeActionError}</span>
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
                  বিনিময় দলিলের নামজারি আবেদন তালিকা
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  যুগপৎ দ্বৈত নামজারি (Dual Mutation) পর্যালোচনার জন্য সংশ্লিষ্ট আবেদনটি নির্বাচন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={fetchExchangeApps}
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
                <RefreshCw size={13} className={loadingExchange ? 'animate-spin' : ''} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {exchangeApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                বর্তমানে কোনো বিনিময় নামজারি আবেদন অপেক্ষমান নেই।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {exchangeApps.map(app => {
                  const ex = app.exchange || {};
                  const isSelected = selectedExchange?._id === app._id;
                  const isApproved = app.status === 'Approved';
                  const isRejected = app.status === 'Rejected';

                  return (
                    <div
                      key={app._id}
                      onClick={() => setSelectedExchange(app)}
                      style={{
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
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
                            {app.deed_no} (আবেদন: {app.application_no})
                          </span>
                          <span style={{
                            fontSize: '11px',
                            background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                            color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#92400e',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '800'
                          }}>
                            {isApproved ? 'অনুমোদিত' : isRejected ? 'খারিজ' : 'অপেক্ষমান'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                          পক্ষ-১: <strong>{ex.owner1?.name}</strong> ({ex.owner1?.area_decimal} শতক) 🔁 পক্ষ-২: <strong>{ex.owner2?.name}</strong> ({ex.owner2?.area_decimal} শতক)
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          padding: '6px 16px',
                          background: isSelected ? '#0284c7' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? 'পর্যালোচনাধীন' : 'পর্যালোচনা'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exchange Review Card */}
          {selectedExchange && (
            <div className="glass-card" style={{
              background: '#ffffff',
              border: '2px solid #0284c7',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0369a1', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} />
                <span>বিনিময় নামজারি পর্যালোচনা ও অনুমোদন (দলিল নং: {selectedExchange.deed_no})</span>
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '800', marginBottom: '4px' }}>
                    মালিক-১ (জমি হস্তান্তরকারী)
                  </div>
                  <div>নাম: <strong>{selectedExchange.exchange?.owner1?.name}</strong></div>
                  <div>NID: {selectedExchange.exchange?.owner1?.nid}</div>
                  <div>মৌজা: {selectedExchange.exchange?.owner1?.mouza} | দাগ: {selectedExchange.exchange?.owner1?.dag_no}</div>
                  <div>পরিমাণ: <strong>{selectedExchange.exchange?.owner1?.area_decimal} শতক</strong></div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>✅ ওটিপি ও বায়োমেট্রিক সিল সম্পন্ন</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: '800', marginBottom: '4px' }}>
                    মালিক-২ (জমি প্রতিস্থাপনকারী)
                  </div>
                  <div>নাম: <strong>{selectedExchange.exchange?.owner2?.name}</strong></div>
                  <div>NID: {selectedExchange.exchange?.owner2?.nid}</div>
                  <div>মৌজা: {selectedExchange.exchange?.owner2?.mouza} | দাগ: {selectedExchange.exchange?.owner2?.dag_no}</div>
                  <div>পরিমাণ: <strong>{selectedExchange.exchange?.owner2?.area_decimal} শতক</strong></div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>✅ ওটিপি ও বায়োমেট্রিক সিল সম্পন্ন</div>
                </div>
              </div>

              {/* Declaration text */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#1e3a8a',
                lineHeight: 1.6,
                marginBottom: '16px'
              }}>
                <strong>ঘোষণাপত্র:</strong> {selectedExchange.exchange?.declaration_text}
              </div>

              {/* Payment Procedure Box */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={20} color="#166534" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                      দ্বৈত নামজারি সরকারি ফি
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      ফি: ২,৩০০ টাকা | চালানের মাধ্যমে উভয় পক্ষের সরকারি ফি পরিশোধিত
                    </div>
                  </div>
                </div>
                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800'
                }}>
                  ✅ ফি পরিশোধিত (Paid)
                </span>
              </div>

              {/* Action Buttons */}
              {selectedExchange.status === 'Pending_AC_Land_Review' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleRejectExchange}
                    disabled={exchangeProcessing}
                    style={{
                      padding: '10px 24px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    আবেদন খারিজ
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveExchange}
                    disabled={exchangeProcessing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 28px',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <Check size={16} />
                    <span>{exchangeProcessing ? 'অনুমোদন হচ্ছে...' : 'বিনিময় নামজারি অনুমোদন করুন (Swap Ownership)'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: WAKFO DEED MUTATION REVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'wakfo' && (
        <div>
          {wakfoActionMsg && (
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
              <span>{wakfoActionMsg}</span>
            </div>
          )}

          {wakfoActionError && (
            <div style={{
              background: '#fee2e2',
              border: '1.5px solid #f87171',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} color="#991b1b" />
              <span>{wakfoActionError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: selectedWakfo ? 'minmax(340px, 1.1fr) minmax(340px, 1fr)' : '1fr', gap: '24px' }}>
            {/* Left: Applications List */}
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="#0f766e" />
                  ওয়াকফ নামজারি আবেদন তালিকা ({wakfoApps.length}টি)
                </h3>
                <button
                  type="button"
                  onClick={fetchWakfoApps}
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
                  <RefreshCw size={13} className={loadingWakfo ? 'animate-spin' : ''} />
                  <span>রিফ্রেশ</span>
                </button>
              </div>

              {loadingWakfo ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>তথ্য লোড হচ্ছে...</div>
                </div>
              ) : wakfoApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                  <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>কোনো ওয়াকফ নামজারি আবেদন নেই</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>সাব-রেজিস্ট্রার কার্যালয় থেকে ওয়াকফ আবেদন প্রেরণ করলে তা এখানে প্রদর্শিত হবে</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {wakfoApps.map((app) => {
                    const isSelected = selectedWakfo?._id === app._id;
                    const w = app.wakfo || {};
                    return (
                      <div
                        key={app._id}
                        onClick={() => setSelectedWakfo(app)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0f766e' : '1.5px solid #e2e8f0',
                          background: isSelected ? '#f0fdfa' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f766e', fontSize: '13px' }}>
                            {app.deed_no}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            background: app.status === 'Approved' ? '#dcfce7' : app.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                            color: app.status === 'Approved' ? '#166534' : app.status === 'Rejected' ? '#991b1b' : '#92400e',
                            border: `1px solid ${app.status === 'Approved' ? '#86efac' : app.status === 'Rejected' ? '#f87171' : '#fde68a'}`
                          }}>
                            {app.status === 'Approved' ? '✅ অনুমোদিত' : app.status === 'Rejected' ? '❌ বাতিল' : '⏳ পর্যালোচনার অপেক্ষায়'}
                          </span>
                        </div>

                        <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                          দাতা: <strong>{w.donor_name}</strong> ➔ গ্রহীতা: <strong style={{ color: '#0f766e' }}>{w.institution_name}</strong>
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          <span>মৌজা: <strong>{w.mouza}</strong></span>
                          <span>দাগ: <strong>{w.dag_no}</strong></span>
                          <span>ওয়াকফ: <strong style={{ color: '#0f766e' }}>{w.wakfo_area_decimal} শতক</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Selected Wakfo Review Panel */}
            {selectedWakfo && (
              <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '2px solid #0f766e', borderRadius: '14px', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      ওয়াকফ দলিল ও নামজারি চূড়ান্ত পর্যালোচনা
                    </h3>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      দলিল নং: <strong>{selectedWakfo.deed_no}</strong> | আবেদন নং: {selectedWakfo.application_no}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWakfo(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Donor & Institution Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      👤 দাতা (ওয়াকিফ)
                    </span>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13.5px' }}>{selectedWakfo.wakfo?.donor_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {selectedWakfo.wakfo?.donor_nid}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>মোবাইল: {selectedWakfo.wakfo?.donor_phone}</div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>
                      ✓ ওটিপি ও বায়োমেট্রিক রেজিস্ট্রি অফিসে যাচাইকৃত
                    </div>
                  </div>

                  <div style={{ background: '#f0fdfa', padding: '14px', borderRadius: '10px', border: '1.5px solid #99f6e4' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f766e', display: 'block', marginBottom: '4px' }}>
                      🏛️ গ্রহীতা প্রতিষ্ঠান (ওয়াকফ এস্টেট)
                    </span>
                    <div style={{ fontWeight: '800', color: '#0f766e', fontSize: '13.5px' }}>{selectedWakfo.wakfo?.institution_name}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>প্রতিনিধি NID: {selectedWakfo.wakfo?.institution_nid}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>ধরন: {selectedWakfo.wakfo?.institution_type}</div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      background: '#ccfbf1',
                      color: '#0f766e',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #5eead4'
                    }}>
                      ✓ প্রাতিষ্ঠানিক ইউজার অ্যাকাউন্ট (Role: Institution)
                    </span>
                  </div>
                </div>

                {/* Land & Waqf Terms Details */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                    <div>মৌজা: <strong>{selectedWakfo.wakfo?.mouza}</strong></div>
                    <div>দাগ নং: <strong>{selectedWakfo.wakfo?.dag_no}</strong></div>
                    <div>খতিয়ান নং: <strong>{selectedWakfo.wakfo?.khatian_no}</strong></div>
                    <div>ওয়াকফকৃত জমি: <strong style={{ color: '#0f766e', fontSize: '13.5px' }}>{selectedWakfo.wakfo?.wakfo_area_decimal} শতক</strong></div>
                  </div>
                  {selectedWakfo.wakfo?.wakfo_purpose && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#334155', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                      ওয়াকফের উদ্দেশ্য: <em>&ldquo;{selectedWakfo.wakfo.wakfo_purpose}&rdquo;</em>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Pending Wakfo */}
                {selectedWakfo.status === 'Pending_AC_Land_Review' ? (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleRejectWakfo}
                      disabled={wakfoProcessing}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1.5px solid #f87171',
                        background: '#fee2e2',
                        color: '#991b1b',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      আবেদন খারিজ
                    </button>

                    <button
                      type="button"
                      onClick={handleApproveWakfo}
                      disabled={wakfoProcessing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 28px',
                        background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)'
                      }}
                    >
                      <Check size={16} />
                      <span>{wakfoProcessing ? 'অনুমোদন হচ্ছে...' : 'ওয়াকফ নামজারি অনুমোদন করুন (Execute Mutation)'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: selectedWakfo.status === 'Approved' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${selectedWakfo.status === 'Approved' ? '#86efac' : '#fca5a5'}`,
                    fontSize: '13px',
                    color: selectedWakfo.status === 'Approved' ? '#166534' : '#991b1b',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    {selectedWakfo.status === 'Approved' ? '✅ এই আবেদনটির ওয়াকফ নামজারি ইতোমধ্যে অনুমোদিত ও কার্যকর হয়েছে।' : '❌ আবেদনটি বাতিলকৃত।'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

