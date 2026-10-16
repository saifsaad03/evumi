import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, CheckCircle, XCircle, Clock, FileText, Search, 
  AlertTriangle, ShieldCheck, ArrowRight, Layers, RefreshCw, X
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import P4AcLandPanel from './P4AcLandPanel';

export default function AcLandDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mutations'); // 'mutations' | 'assign_requests'

  // Assignment requests
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending_AC_Land_Review');

  // Modal for review action
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approve'); // 'Approve' | 'Reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await axios.get('/api/assign/requests', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmittingReview(true);
    try {
      const res = await axios.post(`/api/assign/review-request/${selectedReq._id}`, {
        action: reviewAction,
        rejection_reason: rejectionReason,
        remarks: remarks
      });

      if (res.data.success) {
        setReviewSuccess(res.data.message);
        setTimeout(() => {
          setSelectedReq(null);
          setReviewSuccess(null);
          fetchRequests();
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'পর্যালোচনা ব্যর্থ হয়েছে');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending_AC_Land_Review').length;

  const navItems = [
    {
      id: 'mutations',
      label: 'ই-নামজারি ও মিউটেশন অনুমোদন',
      icon: FileText,
    },
    {
      id: 'assign_requests',
      label: 'সরকারি জমি বরাদ্দ ইনবক্স',
      icon: Layers,
      badge: pendingCount,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7'
    }
  ];

  const stats = [
    { label: 'মোট অনুরোধ', value: requests.length, color: '#047857' },
    { label: 'রিভিউ অপেক্ষমান', value: pendingCount, color: '#b45309' },
    { label: 'অনুমোদিত', value: requests.filter(r => r.status === 'Approved').length, color: '#059669' },
  ];

  return (
    <DashboardLayout
      title="সহকারী কমিশনার (ভূমি) - এসি ল্যান্ড অফিস"
      subtitle={`কর্মকর্তা: ${user?.name || 'এসি ল্যান্ড'} | ${user?.office_details?.office_name || 'উপজেলা ভূমি অফিস'}`}
      badge={{ label: 'AC Land Office Role' }}
      icon={Users}
      roleTheme="green"
      stats={stats}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── TAB 1: Deed Mutations ─────────────────────────────── */}
      {activeTab === 'mutations' && (
        <div>
          <P4AcLandPanel />
        </div>
      )}

      {/* ── TAB 2: Government Land Assignment Inbox ───────────── */}
      {activeTab === 'assign_requests' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'Pending_AC_Land_Review', label: '⏳ পর্যালোচনায় অপেক্ষমান' },
                { id: 'Approved', label: '✅ অনুমোদিত' },
                { id: 'Rejected', label: '❌ প্রত্যাখ্যাত' },
                { id: 'ALL', label: 'সব অনুরোধ' }
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
                    boxShadow: filterStatus === f.id ? '0 2px 6px rgba(5,150,105,0.15)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchRequests}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                borderRadius: '8px'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>ইনবক্স রিফ্রেশ</span>
            </button>
          </div>

          {/* Requests Cards Grid */}
          {loading ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#047857' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>অনুরোধ তালিকা লোড হচ্ছে...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📥</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                এই ক্যাটাগরিতে কোনো অনুরোধ পাওয়া যায়নি
              </h3>
              <p style={{ color: '#475569', fontSize: '13.5px', maxWidth: '500px', margin: '0 auto' }}>
                সাব-রেজিস্ট্রি অফিস থেকে নতুন কোনো বরাদ্দ অনুরোধ পাঠানো হলে তা এখানে তালিকাভুক্ত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderLeft: `5px solid ${req.status === 'Approved' ? '#059669' : req.status === 'Rejected' ? '#dc2626' : '#d97706'}`,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#065f46', fontWeight: '800', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                      {req.request_id}
                    </span>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: req.status === 'Approved' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                      color: req.status === 'Approved' ? '#047857' : req.status === 'Rejected' ? '#991b1b' : '#92400e',
                      border: `1px solid ${req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#fca5a5' : '#fde68a'}`
                    }}>
                      {req.status === 'Approved' ? '✅ অনুমোদিত' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত' : '⏳ রিভিউ অপেক্ষমান'}
                    </span>
                  </div>

                  {/* Citizen details */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '10px',
                    marginBottom: '14px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>
                      বরাদ্দ প্রাপক নাগরিক (Citizen):
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                      {req.user_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', fontWeight: '600' }}>
                      NID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{req.user_nid}</strong> | ফোন: {req.user_phone || 'N/A'}
                    </div>
                  </div>

                  {/* Land & Volume details */}
                  <div style={{
                    fontSize: '12.5px',
                    color: '#334155',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    borderRadius: '10px'
                  }}>
                    <div>মৌজা: <strong style={{ color: '#0f172a' }}>{req.mouza}</strong></div>
                    <div>জে.এল নং: <strong style={{ color: '#0f172a' }}>{req.jl_no}</strong></div>
                    <div>খতিয়ান: <strong style={{ color: '#0f172a' }}>{req.khatian_no}</strong></div>
                    <div>দাগ নং: <strong style={{ color: '#0f172a' }}>{req.dag_no}</strong></div>
                    <div>পরিমাণ: <strong style={{ color: '#059669', fontSize: '13px' }}>{req.area_decimal} শতক</strong></div>
                    <div>উপজেলা: <strong style={{ color: '#0f172a' }}>{req.upazila}</strong></div>
                    <div>ভলিউম বই: <strong style={{ color: '#0284c7' }}>{req.volume_book}</strong></div>
                    <div>পৃষ্ঠা নং: <strong style={{ color: '#0284c7' }}>{req.page_no}</strong></div>
                  </div>

                  {req.deed_no && (
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                      দলিল নম্বর: <strong style={{ color: '#0f172a' }}>{req.deed_no}</strong>
                    </div>
                  )}

                  {req.remarks && (
                    <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                      মন্তব্য: {req.remarks}
                    </div>
                  )}

                  {/* Actions if pending */}
                  {req.status === 'Pending_AC_Land_Review' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewAction('Approve');
                          setRejectionReason('');
                          setRemarks('');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '13px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(5,150,105,0.25)'
                        }}
                      >
                        <CheckCircle size={15} /> অনুমোদন করুন
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewAction('Reject');
                          setRejectionReason('');
                          setRemarks('');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontWeight: '700',
                          fontSize: '13px',
                          border: '1.5px solid #fecaca',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={15} /> প্রত্যাখ্যান
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Review Confirmation Modal */}
          {selectedReq && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div className="glass-card" style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                padding: '30px',
                borderRadius: '16px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: reviewAction === 'Approve' ? '#065f46' : '#991b1b',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {reviewAction === 'Approve' ? <CheckCircle size={20} color="#059669" /> : <XCircle size={20} color="#dc2626" />}
                    {reviewAction === 'Approve' ? 'জমি বরাদ্দ অনুমোদন নিশ্চিতকরণ' : 'বরাদ্দ অনুরোধ প্রত্যাখ্যান'}
                  </h3>
                  <button
                    onClick={() => setSelectedReq(null)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#0f172a' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '18px', lineHeight: 1.6 }}>
                  {reviewAction === 'Approve'
                    ? `অনুমোদন করার সাথে সাথে দাগ নং ${selectedReq.dag_no} (মৌজা: ${selectedReq.mouza}) জমিটি আনুষ্ঠানিকভাবে নাগরিক ${selectedReq.user_name} (NID: ${selectedReq.user_nid})-এর নামে মালিকানা অর্পিত হবে।`
                    : 'অনুরোধটি প্রত্যাখ্যান করার সুনির্দিষ্ট কারণ উল্লেখ করুন।'}
                </p>

                {reviewSuccess && (
                  <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#047857', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '700' }}>
                    {reviewSuccess}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit}>
                  {reviewAction === 'Reject' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
                        প্রত্যাখ্যানের কারণ <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="যেমন: খতিয়ান তথ্যে গরমিল বা বালামে রেকর্ড অমিল"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
                      এসি ল্যান্ড মন্তব্য (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="রেকর্ড ও বালাম যাচাই সাপেক্ষে গৃহীত সিদ্ধান্ত"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', padding: '10px 12px', borderRadius: '8px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReq(null)}
                      className="btn-secondary"
                      style={{ padding: '9px 18px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', borderRadius: '8px' }}
                    >
                      বন্ধ করুন
                    </button>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className={reviewAction === 'Approve' ? 'btn-primary' : 'btn-danger'}
                      style={{ padding: '9px 20px', fontSize: '13px', borderRadius: '8px' }}
                    >
                      {submittingReview ? 'প্রসেস হচ্ছে...' : reviewAction === 'Approve' ? 'হ্যাঁ, অনুমোদন করুন' : 'প্রত্যাখ্যান নিশ্চিত করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
