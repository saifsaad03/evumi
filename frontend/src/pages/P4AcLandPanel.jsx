import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, RefreshCw, CheckCircle, Download, Mail, Hash } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

export default function P4AcLandPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueResult, setIssueResult] = useState(null);
  const [khatianData, setKhatianData] = useState(null);
  const khatianRef = useRef(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/pending-mutations');
      setApplications(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleDirectApproveMutation = async () => {
    if (!selected) return;
    setIssueLoading(true);
    try {
      const res = await axios.post('/api/approve-mutation', {
        record_id: selected._id,
        remarks: 'সহকারী কমিশনার (ভূমি) কর্তৃক যাচাই সাপেক্ষে নামজারি অনুমোদন ও নতুন খতিয়ান প্রদান।'
      });
      if (res.data.success) {
        setKhatianData(res.data.khatian_data);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'নামজারি অনুমোদন ব্যর্থ হয়েছে।');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleIssueNamejari = async () => {
    if (!selected) return;
    setIssueLoading(true);
    try {
      const res = await axios.post('/api/issue-namjari', { record_id: selected._id });
      setIssueResult(res.data);

      // Send payment email via EmailJS
      if (selected.buyer_email) {
        try {
          await emailjs.send(
            'YOUR_SERVICE_ID',
            'YOUR_TEMPLATE_ID',
            {
              to_email: selected.buyer_email,
              to_name: selected.buyer_name,
              payment_link: res.data.payment_link,
              mouza: selected.mouza,
              dag_no: selected.dag_no,
              deed_hash: selected.deed_hash,
            },
            'YOUR_PUBLIC_KEY'
          );
        } catch {
          console.log('EmailJS placeholder, email not sent');
        }
      }
    } catch (err) {
      setIssueResult({ success: false, message: err.response?.data?.message || 'নামজারি ইস্যু ব্যর্থ।' });
    } finally {
      setIssueLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!selected) return;
    try {
      const res = await axios.post('/api/complete-payment', { record_id: selected._id });
      if (res.data.success) {
        setKhatianData(res.data.khatian_data);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment complete ব্যর্থ।');
    }
  };

  const downloadKhatianPDF = async () => {
    if (!khatianRef.current) return;
    const canvas = await html2canvas(khatianRef.current, { scale: 2, backgroundColor: '#0d1629' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`Namjari-Khatian-${khatianData?.khatian_no || 'new'}.pdf`);
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1.5px solid #86efac', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#059669" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>ই-নামজারি আবেদন ও মিউটেশন অনুমোদন</h1>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>AC Land e-Mutation Panel · ভূমি নামজারি আবেদন প্রক্রিয়াকরণ ও চূড়ান্ত খতিয়ান সনদ</p>
            </div>
          </div>
          <button onClick={fetchApplications} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} /> রিফ্রেশ
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'মোট আবেদন', value: applications.length, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'নামজারি ইস্যু বাকি', value: applications.filter(a => !a.namjari_issued).length, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'পেমেন্ট বাকি', value: applications.filter(a => a.payment_status === 'Pending').length, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#ffffff', border: `1.5px solid ${stat.border}`, borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>{stat.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, marginTop: '2px' }}>{stat.value}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color={stat.color} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.3fr)', gap: '24px' }}>
          {/* Applications List */}
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px', maxHeight: '650px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                📥 পেন্ডিং আবেদনসমূহ ({applications.length})
              </h2>
              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>ক্লিক করে বিস্তারিত দেখুন</span>
            </div>
            {loading && <div style={{ textAlign: 'center', padding: '20px' }}><div className="loader" style={{ margin: '0 auto' }} /></div>}
            {!loading && applications.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>কোনো Pending আবেদন নেই</div>
                <small style={{ color: '#64748b' }}>রেজিস্ট্রি অফিস থেকে নতুন দলিল নিবন্ধিত হলে এখানে আসবে।</small>
              </div>
            )}
            {applications.map(app => {
              const isSelected = selected?._id === app._id;
              return (
                <div
                  key={app._id}
                  onClick={() => { setSelected(app); setIssueResult(null); setKhatianData(null); }}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    border: `1.5px solid ${isSelected ? '#16a34a' : '#e2e8f0'}`,
                    boxShadow: isSelected ? '0 4px 12px rgba(22, 163, 74, 0.12)' : '0 1px 3px rgba(15,23,42,0.03)'
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>দাগ নং: {app.dag_no} · মৌজা: {app.mouza}</div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>বিক্রেতা: <strong style={{ color: '#0f172a' }}>{app.owner_name}</strong></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>পেন্ডিং</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>ক্রেতা: <strong style={{ color: '#0f172a' }}>{app.buyer_name}</strong> ({app.total_area_decimal || app.sold_area} শতাংশ)</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {app.namjari_issued && <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46' }}>নামজারি ইস্যু ✓</span>}
                    {app.payment_status === 'Pending' && <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e' }}>পেমেন্ট বাকি</span>}
                    {app.payment_status === 'Paid' && <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46' }}>পেমেন্ট সম্পন্ন ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Panel */}
          <div>
            {!selected && !khatianData && (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '16px', padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.03)' }}>
                <div style={{ fontSize: '50px', marginBottom: '14px', opacity: 0.7 }}>🏛️</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>বাম তালিকা থেকে একটি আবেদন নির্বাচন করুন</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>আবেদনের তথ্য যাচাই করে নামজারি অনুমোদন বা নোটিশ পাঠান</div>
              </div>
            )}

            {selected && !khatianData && (
              <div className="animate-fade-in-up">
                {/* Selected application details */}
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>📋 আবেদনের পূর্ণাঙ্গ বিবরণী</h3>
                    <span style={{ fontSize: '11px', color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>দাগ #{selected.dag_no}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    {[
                      ['মৌজা', selected.mouza], ['দাগ নং', selected.dag_no],
                      ['খতিয়ান', selected.khatian_no], ['জমির পরিমাণ', `${selected.total_area_decimal || selected.sold_area} শতাংশ`],
                      ['বিক্রেতা', selected.owner_name], ['বিক্রেতার NID', selected.owner_nid],
                      ['ক্রেতা', selected.buyer_name], ['ক্রেতার NID', selected.buyer_nid],
                      ['ক্রেতার ফোন', selected.buyer_phone || 'N/A'], ['ক্রেতার ইমেইল', selected.buyer_email || 'N/A'],
                      ['দলিল নং', selected.deed_no || 'N/A'], ['দলিলের সাল', selected.deed_year || 'N/A'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{k}</div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700', marginTop: '2px', wordBreak: 'break-all' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Hash verification */}
                  {selected.deed_hash && (
                    <div style={{ padding: '12px 14px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                        <Hash size={13} /> SHA-256 ডিজিটাল দলিল সিকিউরিটি হ্যাশ
                      </div>
                      <div style={{ fontSize: '11px', color: '#1d4ed8', fontFamily: 'monospace', wordBreak: 'break-all', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                        {selected.deed_hash}
                      </div>
                    </div>
                  )}

                  {/* Direct Approve & Issue Namjari buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={handleDirectApproveMutation}
                      disabled={issueLoading}
                      style={{
                        width: '100%',
                        padding: '13px',
                        fontSize: '14px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {issueLoading ? <><div className="loader" /> অনুমোদন হচ্ছে...</> : <><CheckCircle size={18} /> ✅ অনুমোদন ও নতুন নামজারি খতিয়ান তৈরি করুন</>}
                    </button>

                    {!selected.namjari_issued && (
                      <button
                        onClick={handleIssueNamejari}
                        disabled={issueLoading}
                        style={{
                          width: '100%',
                          padding: '11px',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <Mail size={15} color="#2563eb" /> 📧 ক্রেতাকে নামজারি নোটিশ ও পেমেন্ট লিংক পাঠান
                      </button>
                    )}
                  </div>

                  {/* Issue result */}
                  {issueResult && (
                    <div className="animate-fade-in-up" style={{
                      marginTop: '16px', padding: '16px',
                      background: issueResult.success ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${issueResult.success ? '#86efac' : '#fca5a5'}`,
                      borderRadius: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Mail size={16} color={issueResult.success ? '#16a34a' : '#dc2626'} />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: issueResult.success ? '#166534' : '#991b1b' }}>
                          {issueResult.success ? '✅ নামজারি নোটিশ ও ইমেইল পাঠানো হয়েছে!' : '❌ ' + issueResult.message}
                        </span>
                      </div>
                      {issueResult.success && (
                        <>
                          <div style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                            📧 পেমেন্ট লিংক প্রেরিত হয়েছে: <strong style={{ color: '#1d4ed8' }}>{issueResult.buyer_email}</strong>
                          </div>
                          <div style={{ fontSize: '11px', padding: '8px 12px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', marginBottom: '12px', wordBreak: 'break-all', border: '1px solid #bfdbfe' }}>
                            🔗 {issueResult.payment_link}
                          </div>
                          <button onClick={handleCompletePayment} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            💳 পেমেন্ট সম্পন্ন করুন → খতিয়ান তৈরি করুন
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* New Khatian PDF */}
            {khatianData && (
              <div className="animate-fade-in-up">
                <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={22} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534' }}>🎉 নামজারি সম্পন্ন ও খতিয়ান প্রস্তুত!</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>নতুন নামজারি খতিয়ান তৈরি হয়েছে। QR কোড সহ PDF ডাউনলোড করুন।</div>
                  </div>
                </div>

                {/* Khatian PDF */}
                <div ref={khatianRef} style={{ background: '#ffffff', border: '2px solid #059669', borderRadius: '16px', padding: '28px', marginBottom: '16px', boxShadow: '0 6px 18px rgba(5,150,105,0.08)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
                    <div style={{ fontSize: '16px', color: '#059669', fontWeight: '800', marginTop: '4px' }}>ই-নামজারি খতিয়ান সনদ</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Namjari Khatian Certificate · e-Vhumi Land Portal</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                    {[
                      ['মৌজা', khatianData.mouza],
                      ['জে.এল নম্বর', khatianData.jl_no],
                      ['খতিয়ান নম্বর', khatianData.khatian_no],
                      ['দাগ নম্বর', khatianData.dag_no],
                      ['নতুন মালিক', khatianData.owner_name],
                      ['মালিকের NID', khatianData.owner_nid],
                      ['জমির পরিমাণ', `${khatianData.total_area_decimal} শতাংশ`],
                      ['ইস্যুর তারিখ', new Date().toLocaleDateString('bn-BD')],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>{k}</div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '800' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', flexWrap: 'wrap' }}>
                    <QRCodeSVG
                      value={`${window.location.origin}/qr-verify/${khatianData.qr_code_id}`}
                      size={100}
                      fgColor="#0f172a"
                      bgColor="transparent"
                      level="H"
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46', marginBottom: '6px' }}>QR কোড স্ক্যান করে অনলাইন যাচাই</div>
                      <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.7 }}>
                        QR ID: <span style={{ color: '#047857', fontFamily: 'monospace', fontWeight: '700' }}>{khatianData.qr_code_id}</span><br />
                        যেকোনো নাগরিক বা প্রতিষ্ঠান এই QR স্ক্যান করে খতিয়ান যাচাই করতে পারবেন।
                      </div>
                      <div className="badge-active" style={{ display: 'inline-block', marginTop: '8px' }}>🟢 Active & Verified</div>
                    </div>
                  </div>
                </div>

                <button onClick={downloadKhatianPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px' }}>
                  <Download size={16} /> নামজারি খতিয়ান PDF ডাউনলোড করুন
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
