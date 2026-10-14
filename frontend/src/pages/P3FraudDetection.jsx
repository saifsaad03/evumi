import { useState } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, CheckCircle, XCircle, Lock, Search, FileText } from 'lucide-react';

const stepLabels = [
  { num: 1, label: 'মালিকানা যাচাই', sub: 'Seller NID Check' },
  { num: 2, label: 'জমির পরিমাণ', sub: 'Volume Check' },
  { num: 3, label: 'Pending Lock', sub: 'Anti Double-Sell' },
];

export default function P3FraudDetection() {
  const [form, setForm] = useState({
    seller_nid: '',
    dag_no: '',
    mouza: '',
    jl_no: '',
    khatian_no: '',
    requested_area: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockResult, setLockResult] = useState(null);
  const [auditLog, setAuditLog] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setLockResult(null);
    setCurrentStep(1);
    try {
      const res = await axios.post('/api/verify-deed', form);
      setResult(res.data);
      if (res.data.success) setCurrentStep(2);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Server Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!result?.record?._id) return;
    setLockLoading(true);
    setCurrentStep(3);
    try {
      const res = await axios.post('/api/lock-property', {
        record_id: result.record._id,
        sold_area: form.requested_area,
      });
      setLockResult(res.data);
    } catch (err) {
      setLockResult({ success: false, message: err.response?.data?.message || 'Lock failed' });
    } finally {
      setLockLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    if (!result?.record?._id) return;
    try {
      const res = await axios.get(`/api/audit-log/${result.record._id}`);
      setAuditLog(res.data);
    } catch {}
  };

  const alertColors = {
    VERIFIED: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#86efac', icon: <CheckCircle size={22} color="#22c55e" /> },
    FAKE_OWNER: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', color: '#fca5a5', icon: <XCircle size={22} color="#dc2626" /> },
    DOUBLE_SELL: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', color: '#fca5a5', icon: <AlertTriangle size={22} color="#dc2626" /> },
    ALREADY_SOLD: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', color: '#fca5a5', icon: <XCircle size={22} color="#dc2626" /> },
    INSUFFICIENT_AREA: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d', icon: <AlertTriangle size={22} color="#f59e0b" /> },
    NOT_FOUND: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#cbd5e1', icon: <Search size={22} color="#94a3b8" /> },
  };

  const alertStyle = result ? (alertColors[result.alert_type] || alertColors['NOT_FOUND']) : null;

  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(239,68,68,0.1))',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} color="#f87171" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9' }}>P3 — জালিয়াতি ও ডাবল-সেলিং ডিটেকশন ইঞ্জিন</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Fraud & Double-Selling Detection Engine · সাব-রেজিস্ট্রি অফিস ব্যবহারের জন্য</p>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          {stepLabels.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                ...(currentStep > step.num ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' } :
                   currentStep === step.num ? { background: 'linear-gradient(135deg, #1a6b3c, #22c55e)', color: 'white' } :
                   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }),
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>ধাপ {step.num}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{step.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{step.sub}</div>
                </div>
              </div>
              {i < stepLabels.length - 1 && <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Form */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#f87171" /> দলিলের তথ্য যাচাই করুন
          </h2>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { name: 'seller_nid', label: 'বিক্রেতার NID', placeholder: 'বিক্রেতার ১৭ বা ১০ ডিজিটের NID লিখুন' },
              { name: 'mouza', label: 'মৌজার নাম', placeholder: 'মৌজার নাম লিখুন' },
              { name: 'jl_no', label: 'জে.এল নম্বর', placeholder: 'জে.এল নম্বর' },
              { name: 'khatian_no', label: 'খতিয়ান নম্বর', placeholder: 'খতিয়ান নম্বর' },
              { name: 'dag_no', label: 'দাগ নম্বর', placeholder: 'দাগ নম্বর' },
              { name: 'requested_area', label: 'বিক্রয়যোগ্য পরিমাণ (শতাংশ)', placeholder: 'শতাংশের পরিমাণ লিখুন' },
            ].map((field) => (
              <div key={field.name}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  {field.label}
                </label>
                <input
                  className="input-field"
                  type="text"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={['seller_nid', 'dag_no', 'mouza', 'requested_area'].includes(field.name)}
                />
              </div>
            ))}
            <button type="submit" className="btn-danger" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              {loading ? <><div className="loader" /> যাচাই হচ্ছে...</> : <><Shield size={16} /> মালিকানা যাচাই করুন</>}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Result */}
          {result && alertStyle && (
            <div className="animate-fade-in-up" style={{
              padding: '24px',
              background: alertStyle.bg,
              border: `1px solid ${alertStyle.border}`,
              borderRadius: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                {alertStyle.icon}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: alertStyle.color, marginBottom: '6px' }}>
                    {result.alert_type === 'VERIFIED' ? '✅ যাচাই সম্পন্ন' :
                     result.alert_type === 'FAKE_OWNER' ? '🚨 জাল মালিক সনাক্ত!' :
                     result.alert_type === 'DOUBLE_SELL' ? '🔴 ডাবল-সেলিং অ্যালার্ট!' :
                     result.alert_type === 'ALREADY_SOLD' ? '⛔ জমি বিক্রি হয়েছে' :
                     result.alert_type === 'INSUFFICIENT_AREA' ? '⚠️ জমির পরিমাণ অপর্যাপ্ত' : '❓ রেকর্ড পাওয়া যায়নি'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6 }}>{result.message}</div>
                </div>
              </div>

              {/* Record details */}
              {result.record && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px',
                }}>
                  {[
                    ['মৌজা', result.record.mouza],
                    ['দাগ নং', result.record.dag_no],
                    ['খতিয়ান', result.record.khatian_no],
                    ['মালিক', result.record.owner_name],
                    ['মোট জমি', `${result.record.total_area_decimal} শতাংশ`],
                    ['পাওয়া জমি', `${result.record.available_area_decimal} শতাংশ`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{k}</div>
                      <div style={{ color: '#f1f5f9', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lock button */}
              {result.success && !lockResult && (
                <div style={{ marginTop: '16px' }}>
                  <button className="btn-primary" onClick={handleLock} disabled={lockLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                    {lockLoading ? <><div className="loader" /> লক হচ্ছে...</> : <><Lock size={16} /> দলিল নিশ্চিত করুন ও জমি লক করুন</>}
                  </button>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                    ⚠️ এই বাটনে ক্লিক করলে জমির স্ট্যাটাস Pending_Mutation হবে
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lock Result */}
          {lockResult && (
            <div className="animate-fade-in-up" style={{
              padding: '20px',
              background: lockResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${lockResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
              borderRadius: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {lockResult.success ? <Lock size={20} color="#22c55e" /> : <XCircle size={20} color="#dc2626" />}
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: lockResult.success ? '#86efac' : '#fca5a5' }}>
                    {lockResult.success ? '🔒 সম্পত্তি লক করা হয়েছে!' : '❌ লক ব্যর্থ'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{lockResult.message}</div>
                </div>
              </div>
              {lockResult.success && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fcd34d' }}>
                  ✅ P4 AC Land ড্যাশবোর্ডে এই আবেদন এখন দেখা যাচ্ছে। ডাবল-সেল এখন সম্পূর্ণ ব্লক।
                </div>
              )}
              {lockResult.success && result?.record?._id && (
                <button onClick={fetchAuditLog} className="btn-secondary" style={{ marginTop: '12px', fontSize: '12px', padding: '8px 16px' }}>
                  📋 Audit Log দেখুন
                </button>
              )}
            </div>
          )}

          {/* Audit Log */}
          {auditLog && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', marginBottom: '12px' }}>
                📋 Tamper-proof Audit Log — {auditLog.record_info?.owner_name}
              </h3>
              {auditLog.fraud_alerts?.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748b' }}>কোনো ফ্রড অ্যালার্ট নেই।</div>
              ) : (
                auditLog.fraud_alerts?.map((alert, i) => (
                  <div key={i} style={{
                    padding: '12px', marginBottom: '8px',
                    background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '10px', fontSize: '12px',
                  }}>
                    <div style={{ color: '#fca5a5', fontWeight: '600' }}>⚠️ {alert.type} — {alert.message}</div>
                    <div style={{ color: '#64748b', marginTop: '4px' }}>
                      চেষ্টাকৃত NID: {alert.attempted_nid} · {new Date(alert.triggered_at).toLocaleString('bn-BD')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Info panel when no result */}
          {!result && (
            <div className="glass-card-light" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' }}>🛡️ সিস্টেম কীভাবে কাজ করে?</h3>
              {[
                { step: '১', title: 'মালিকানা যাচাই', desc: 'বিক্রেতার NID ডেটাবেজের Active রেকর্ডের সাথে মেলানো হয়। না মিললেই Fraud Alert।', color: '#dc2626' },
                { step: '২', title: 'জমির পরিমাণ চেক', desc: 'আবেদনকৃত পরিমাণ যদি ডেটাবেজের চেয়ে বেশি হয়, ট্রানজ্যাকশন ব্লক।', color: '#f59e0b' },
                { step: '৩', title: 'Pending Lock', desc: 'দলিল সম্পন্ন হলে জমি Pending_Mutation-এ লক। পুনরায় বিক্রির চেষ্টায় ডাবল-সেল অ্যালার্ট।', color: '#3b82f6' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '28px', height: '28px', flexShrink: 0,
                    background: `${item.color}20`, border: `1px solid ${item.color}40`,
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700', color: item.color,
                  }}>{item.step}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9', marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
