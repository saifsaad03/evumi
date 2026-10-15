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
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1300px', margin: '30px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9' }}>P4 — এসি ল্যান্ড অফিস ড্যাশবোর্ড</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>AC Land e-Mutation Dashboard · ই-নামজারি আবেদন ব্যবস্থাপনা</p>
          </div>
        </div>
        <button onClick={fetchApplications} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} /> রিফ্রেশ
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'মোট আবেদন', value: applications.length, color: '#a78bfa' },
          { label: 'নামজারি ইস্যু বাকি', value: applications.filter(a => !a.namjari_issued).length, color: '#f59e0b' },
          { label: 'পেমেন্ট বাকি', value: applications.filter(a => a.payment_status === 'Pending').length, color: '#f87171' },
        ].map(stat => (
          <div key={stat.label} className="glass-card-light" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* Applications List */}
        <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>
            📥 Pending আবেদনসমূহ ({applications.length})
          </h2>
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}><div className="loader" style={{ margin: '0 auto' }} /></div>}
          {!loading && applications.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div>কোনো Pending আবেদন নেই।<br /><small>P4 রেজিস্ট্রি প্যানেল থেকে দলিল করুন।</small></div>
            </div>
          )}
          {applications.map(app => (
            <div
              key={app._id}
              onClick={() => { setSelected(app); setIssueResult(null); setKhatianData(null); }}
              style={{
                padding: '16px', marginBottom: '10px', borderRadius: '12px', cursor: 'pointer',
                transition: 'all 0.2s',
                background: selected?._id === app._id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected?._id === app._id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
              }}
              onMouseEnter={e => { if (selected?._id !== app._id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { if (selected?._id !== app._id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>দাগ: {app.dag_no} · {app.mouza}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>বিক্রেতা: {app.owner_name}</div>
                </div>
                <div className="badge-pending">Pending</div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>ক্রেতা: {app.buyer_name}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {app.namjari_issued && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', color: '#86efac' }}>নামজারি ইস্যু ✓</span>}
                {app.payment_status === 'Pending' && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', color: '#fcd34d' }}>পেমেন্ট বাকি</span>}
                {app.payment_status === 'Paid' && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', color: '#86efac' }}>পেমেন্ট সম্পন্ন ✓</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div>
          {!selected && !khatianData && (
            <div className="glass-card-light" style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.3 }}>🏛️</div>
              <div style={{ color: '#64748b' }}>বাম থেকে একটি আবেদন নির্বাচন করুন</div>
            </div>
          )}

          {selected && !khatianData && (
            <div className="animate-fade-in-up">
              {/* Selected application details */}
              <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>📋 আবেদনের বিস্তারিত</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    ['মৌজা', selected.mouza], ['দাগ নং', selected.dag_no],
                    ['খতিয়ান', selected.khatian_no], ['জমির পরিমাণ', `${selected.total_area_decimal} শতাংশ`],
                    ['বিক্রেতা', selected.owner_name], ['বিক্রেতার NID', selected.owner_nid],
                    ['ক্রেতা', selected.buyer_name], ['ক্রেতার NID', selected.buyer_nid],
                    ['ক্রেতার ফোন', selected.buyer_phone || 'N/A'], ['ক্রেতার ইমেইল', selected.buyer_email || 'N/A'],
                    ['দলিল নং', selected.deed_no || 'N/A'], ['দলিলের সাল', selected.deed_year || 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{k}</div>
                      <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Hash verification */}
                {selected.deed_hash && (
                  <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={12} /> SHA-256 দলিল হ্যাশ (যাচাই করুন)</div>
                    <div style={{ fontSize: '10px', color: '#93c5fd', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selected.deed_hash}</div>
                  </div>
                )}

                {/* Direct Approve & Issue Namjari buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handleDirectApproveMutation}
                    disabled={issueLoading}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {issueLoading ? <><div className="loader" /> অনুমোদন হচ্ছে...</> : <><CheckCircle size={18} /> ✅ অনুমোদন ও নতুন নামজারি খতিয়ান তৈরি করুন</>}
                  </button>

                  {!selected.namjari_issued && (
                    <button
                      onClick={handleIssueNamejari}
                      disabled={issueLoading}
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Mail size={15} /> 📧 ক্রেতাকে নামজারি নোটিশ ও পেমেন্ট লিংক পাঠান
                    </button>
                  )}
                </div>

                {/* Issue result */}
                {issueResult && (
                  <div className="animate-fade-in-up" style={{
                    marginTop: '16px', padding: '16px',
                    background: issueResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(220,38,38,0.08)',
                    border: `1px solid ${issueResult.success ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.25)'}`,
                    borderRadius: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Mail size={16} color={issueResult.success ? '#22c55e' : '#dc2626'} />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: issueResult.success ? '#86efac' : '#fca5a5' }}>
                        {issueResult.success ? '✅ নামজারি ইস্যু ও ইমেইল পাঠানো হয়েছে!' : '❌ ' + issueResult.message}
                      </span>
                    </div>
                    {issueResult.success && (
                      <>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                          📧 পেমেন্ট লিংক পাঠানো হয়েছে: <span style={{ color: '#60a5fa' }}>{issueResult.buyer_email}</span>
                        </div>
                        <div style={{ fontSize: '11px', padding: '8px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#93c5fd', marginBottom: '12px', wordBreak: 'break-all' }}>
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
              <div style={{ padding: '16px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#22c55e" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#86efac' }}>🎉 মালিকানা হস্তান্তর সম্পন্ন!</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>নতুন নামজারি খতিয়ান তৈরি হয়েছে। QR কোড সহ PDF ডাউনলোড করুন।</div>
                </div>
              </div>

              {/* Khatian PDF */}
              <div ref={khatianRef} style={{ background: '#0d1629', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9' }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
                  <div style={{ fontSize: '15px', color: '#a78bfa', fontWeight: '600', marginTop: '4px' }}>নামজারি খতিয়ান</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Namjari Khatian Certificate · e-Vhumi</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
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
                    <div key={k} style={{ padding: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{k}</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/qr-verify/${khatianData.qr_code_id}`}
                    size={100}
                    fgColor="#f1f5f9"
                    bgColor="transparent"
                    level="H"
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa', marginBottom: '6px' }}>QR কোড স্ক্যান করুন</div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.7 }}>
                      QR ID: <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{khatianData.qr_code_id}</span><br />
                      এই QR স্ক্যান করে যেকোনো সময়<br />খতিয়ানের বৈধতা যাচাই করা যাবে।
                    </div>
                    <div className="badge-active" style={{ display: 'inline-block', marginTop: '8px' }}>🟢 Active</div>
                  </div>
                </div>
              </div>

              <button onClick={downloadKhatianPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
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
