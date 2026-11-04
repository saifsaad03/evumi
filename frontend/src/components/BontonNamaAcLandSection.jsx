import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, CheckCircle, Clock, FileText, Search, AlertTriangle, 
  CreditCard, ShieldCheck, Check, RefreshCw, X, ArrowRight, Award, Lock, Sparkles
} from 'lucide-react';

export default function BontonNamaAcLandSection() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending_AC_Land_Review');
  const [selectedApp, setSelectedApp] = useState(null);

  // Review & Approval Action States
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);
  const [approvingMutation, setApprovingMutation] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await axios.get('/api/bonton/applications', { params });
      if (res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bonton applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setPaymentSuccessMsg(null);
    setApprovalResult(null);
    setErrorMsg(null);
  };

  const handleCloseReview = () => {
    setSelectedApp(null);
    setPaymentSuccessMsg(null);
    setApprovalResult(null);
    setErrorMsg(null);
    fetchApplications();
  };

  // Step 1: Complete AC Land Payment Procedure (৳1,150)
  const handleProcessPayment = async () => {
    if (!selectedApp) return;
    setProcessingPayment(true);
    setPaymentSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await axios.post(`/api/bonton/process-payment/${selectedApp._id}`);
      if (res.data.success) {
        setPaymentSuccessMsg(res.data.message);
        setSelectedApp(prev => ({
          ...prev,
          payment_status: 'Paid',
          payment_transaction_id: res.data.data?.payment_transaction_id
        }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Step 2: Final Approve Bontonnama & Issue Khatians to Heirs
  const handleApproveBontonnama = async () => {
    if (!selectedApp) return;
    if (selectedApp.payment_status !== 'Paid') {
      alert('বণ্টননামা ও নামজারি অনুমোদন করার পূর্বে নির্ধারিত সরকারি ফি পরিশোধ প্রক্রিয়া সম্পন্ন করতে হবে!');
      return;
    }

    setApprovingMutation(true);
    setErrorMsg(null);
    setApprovalResult(null);

    try {
      const res = await axios.post(`/api/bonton/approve-application/${selectedApp._id}`);
      if (res.data.success) {
        setApprovalResult(res.data);
        setSelectedApp(prev => ({
          ...prev,
          status: 'Approved'
        }));
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'বণ্টননামা অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setApprovingMutation(false);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'Pending_AC_Land_Review').length;

  return (
    <div style={{ color: '#0f172a' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderLeft: '5px solid #059669',
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
              background: 'linear-gradient(135deg, #059669, #047857)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
            }}>
              <Users size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  BONTONNAMA ABEDON (ওয়ারিশ বণ্টননামা ও নামজারি ইনবক্স)
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac',
                  fontWeight: '700'
                }}>
                  🏛️ AC Land Portal
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '13px', margin: '4px 0 0 0' }}>
                সাব-রেজিস্ট্রি অফিস থেকে প্রেরিত মৃত মালিকের ওয়ারিশ বণ্টননামা আবেদন যাচাই ➔ ফি পরিশোধ ➔ ওয়ারিশদের নামে পৃথক খতিয়ান জারি
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={fetchApplications}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} /> রিফ্রেশ
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0', flexWrap: 'wrap' }}>
          {[
            { id: 'Pending_AC_Land_Review', label: '⏳ পর্যালোচনায় অপেক্ষমান' },
            { id: 'Approved', label: '✅ অনুমোদিত ও নামজারি সম্পন্ন' },
            { id: 'ALL', label: 'সকল আবেদন' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: filterStatus === f.id ? '#ecfdf5' : '#ffffff',
                border: filterStatus === f.id ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                color: filterStatus === f.id ? '#065f46' : '#334155',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Cards List */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>লোড হচ্ছে...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
            কোনো বণ্টননামা আবেদন পাওয়া যায়নি।
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {applications.map((app) => (
              <div
                key={app._id}
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  background: app.status === 'Approved' ? '#f0fdf4' : '#fffbeb',
                  border: `1.5px solid ${app.status === 'Approved' ? '#86efac' : '#fde68a'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      আবেদন নং: {app.application_no}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: app.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                      color: app.status === 'Approved' ? '#166534' : '#b45309',
                      fontWeight: '800',
                      border: `1px solid ${app.status === 'Approved' ? '#86efac' : '#fde68a'}`
                    }}>
                      {app.status === 'Approved' ? '✅ অনুমোদিত ও নামজারি সম্পন্ন' : '⏳ পর্যালোচনায় অপেক্ষমান'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      জমাদানের তারিখ: {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenReview(app)}
                      style={{
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {app.status === 'Approved' ? 'বিবরণ দেখুন ➔' : 'পর্যালোচনা ও অনুমোদন ➔'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>মৃত জমির মালিক:</span>
                    <strong style={{ color: '#0f172a' }}>{app.deceased_name}</strong> (NID: {app.deceased_nid})
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>মৃত্যু সনদ নম্বর:</span>
                    <strong style={{ color: '#dc2626' }}>{app.death_certificate_no}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>জমি শনাক্তকরণ:</span>
                    <strong style={{ color: '#0f172a' }}>মৌজা: {app.mouza} | দাগ: {app.dag_no} | খতিয়ান: {app.khatian_no}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>বণ্টনকৃত / মোট জমি:</span>
                    <strong style={{ color: '#16a34a', fontSize: '14px' }}>{app.allocated_area_decimal} শতক</strong> (মোট: {app.total_area_decimal} শতক)
                  </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  👥 ওয়ারিশগণের প্রাপ্ত অংশ ({app.heirs?.length || 0} জন):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {app.heirs?.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Review, Payment Procedure & Mutation Approval
          ───────────────────────────────────────────────────────────── */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1.5px solid #e2e8f0' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#059669" />
                  বণ্টননামা আবেদন পর্যালোচনা ও নামজারি অনুমোদন
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  আবেদন নম্বর: <strong style={{ color: '#0f172a' }}>{selectedApp.application_no}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Deceased & Land Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginBottom: '18px' }}>
              <div>মৃত জমির মালিক: <strong>{selectedApp.deceased_name}</strong></div>
              <div>মৃত ব্যক্তির NID: <strong style={{ fontFamily: 'monospace' }}>{selectedApp.deceased_nid}</strong></div>
              <div>মৃত্যু সনদ নম্বর: <strong style={{ color: '#dc2626' }}>{selectedApp.death_certificate_no}</strong></div>
              <div>উপজেলা / সার্কেল: <strong>{selectedApp.upazila}, {selectedApp.district}</strong></div>
              <div>মৌজা: <strong>{selectedApp.mouza}</strong> (জে.এল: {selectedApp.jl_no})</div>
              <div>দাগ নম্বর: <strong>{selectedApp.dag_no}</strong> | খতিয়ান নম্বর: <strong>{selectedApp.khatian_no}</strong></div>
              <div style={{ gridColumn: 'span 2', background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', color: '#065f46' }}>
                মোট দাগের জমি: <strong>{selectedApp.total_area_decimal} শতক</strong> | বণ্টনকৃত অংশ: <strong>{selectedApp.allocated_area_decimal} শতক</strong>
              </div>
            </div>

            {/* Heirs Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                ওয়ারিশগণের বিস্তারিত পরিচিতি ও হিস্যা:
              </div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>নাম</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>NID নম্বর</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>সম্পর্ক</th>
                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1' }}>প্রাপ্ত জমি</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>ভেরিফিকেশন</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedApp.heirs?.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: '700' }}>{h.name}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>{h.nid}</td>
                      <td style={{ padding: '8px' }}>{h.relationship}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '800', color: '#047857' }}>
                        {h.share_decimal} শতক ({h.share_percent}%)
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: '700' }}>
                          NID & OTP ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Procedure Box */}
            <div style={{
              padding: '16px',
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#2563eb" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e40af' }}>
                    এসি ল্যান্ড অফিসের নির্ধারিত Payment Procedure (নামজারি ফি)
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: selectedApp.payment_status === 'Paid' ? '#dcfce7' : '#fee2e2',
                  color: selectedApp.payment_status === 'Paid' ? '#166534' : '#991b1b',
                  fontWeight: '800',
                  border: `1px solid ${selectedApp.payment_status === 'Paid' ? '#86efac' : '#f87171'}`
                }}>
                  {selectedApp.payment_status === 'Paid' ? '✅ পরিশোধিত (Paid)' : 'অপরিশোধিত (Unpaid)'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', marginTop: '6px' }}>
                <div>
                  সরকারি নামজারি ও রেকর্ড সংশোধন ফি: <strong style={{ color: '#0f172a' }}>৳{selectedApp.mutation_fee || 1150}</strong>
                  {selectedApp.payment_transaction_id && (
                    <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                      ট্রানজেকশন ID: {selectedApp.payment_transaction_id}
                    </div>
                  )}
                </div>

                {selectedApp.payment_status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={processingPayment}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processingPayment ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {processingPayment ? 'প্রক্রিয়াধীন...' : '💳 ফি পরিশোধ সম্পন্ন করুন'}
                  </button>
                )}
              </div>

              {paymentSuccessMsg && (
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '700' }}>
                  {paymentSuccessMsg}
                </div>
              )}
            </div>

            {/* Success Results Banner with generated khatians */}
            {approvalResult && (
              <div style={{ padding: '16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', marginBottom: '18px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534', marginBottom: '8px' }}>
                  {approvalResult.message}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '10px' }}>
                  ওয়ারিশদের নামে নতুন নামজারি খতিয়ানসমূহ অবিলম্বে Active হয়েছে:
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {approvalResult.new_khatians?.map((k, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '12px' }}>
                      <span><strong>{idx + 1}. {k.owner_name}</strong> (NID: {k.owner_nid})</span>
                      <span>খতিয়ান নং: <strong style={{ color: '#047857' }}>{k.khatian_no}</strong> | জমি: <strong style={{ color: '#047857' }}>{k.area_decimal} শতক</strong> ({k.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleCloseReview}
                style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '700', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                বন্ধ করুন
              </button>

              {selectedApp.status !== 'Approved' && (
                <button
                  type="button"
                  onClick={handleApproveBontonnama}
                  disabled={approvingMutation || selectedApp.payment_status !== 'Paid'}
                  style={{
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: '800',
                    background: selectedApp.payment_status === 'Paid' ? 'linear-gradient(135deg, #059669, #047857)' : '#94a3b8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedApp.payment_status === 'Paid' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedApp.payment_status === 'Paid' ? '0 4px 14px rgba(5, 150, 105, 0.35)' : 'none'
                  }}
                >
                  <CheckCircle size={16} />
                  {approvingMutation ? 'অনুমোদন হচ্ছে...' : 'বণ্টননামা ও নামজারি অনুমোদন করুন'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

