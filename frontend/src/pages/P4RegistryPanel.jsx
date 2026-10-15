import { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Building2, Search, CheckCircle, FileText, Download, Hash, 
  ShieldAlert, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, 
  Check, Sparkles, Send, Lock, Clock, Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function P4RegistryPanel() {
  const [searchForm, setSearchForm] = useState({ 
    seller_nid: '1998567890123', 
    dag_no: '101', 
    mouza: 'গুজিয়া',
    requested_area: '5'
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [landRecord, setLandRecord] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [doubleSellAlert, setDoubleSellAlert] = useState(null);

  const [deedForm, setDeedForm] = useState({
    deed_no: `DEED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    deed_year: new Date().getFullYear().toString(),
    sub_registry_code: 'SR-BOG-SHIB-01',
    buyer_name: 'আব্দুল করিম',
    buyer_nid: '2005111222333',
    buyer_phone: '01711112233',
    buyer_email: 'buyer.karim@gmail.com',
    sold_area: '5',
  });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState(null);
  const pdfRef = useRef(null);

  // Step 1: Search Land & Run Anti-Double Selling Engine
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setLandRecord(null);
    setGrantResult(null);
    setDoubleSellAlert(null);

    try {
      // 1. Live Anti-Double Selling check via P3 Fraud Engine
      try {
        const verifyRes = await axios.post('/api/verify-deed', {
          seller_nid: searchForm.seller_nid?.trim(),
          dag_no: searchForm.dag_no?.trim(),
          mouza: searchForm.mouza?.trim(),
          requested_area: searchForm.requested_area || '1'
        });

        if (verifyRes.data && !verifyRes.data.success) {
          setDoubleSellAlert(verifyRes.data);
        }
      } catch (vErr) {
        console.warn('Verify deed check fallback:', vErr);
      }

      // 2. Fetch Land Record
      const res = await axios.get('/api/land-records', {
        params: {
          dag_no: searchForm.dag_no?.trim(),
          mouza: searchForm.mouza?.trim()
        }
      });

      if (res.data.data?.length > 0) {
        const found = res.data.data[0];
        setLandRecord(found);

        // Check if status is locked
        if (found.status === 'Pending_Mutation') {
          setDoubleSellAlert({
            alert_type: 'DOUBLE_SELL',
            message: '🔴 ডাবল-সেলিং এলার্ট (Double-Selling Alert): এই জমির একটি দলিল ও নামজারি প্রক্রিয়া বর্তমানে চলমান! জমিটি Pending Mutation অবস্থায় লক আছে।'
          });
        } else if (found.status === 'Sold') {
          setDoubleSellAlert({
            alert_type: 'ALREADY_SOLD',
            message: '🔴 জমিটি ইতিমধ্যে অন্য ক্রেতার কাছে বিক্রয় ও নামজারি সম্পন্ন হয়েছে (Status: Sold)।'
          });
        }
      } else {
        setSearchError('প্রদত্ত দাগ ও মৌজায় কোনো জমির রেকর্ড পাওয়া যায়নি।');
      }
    } catch (err) {
      setSearchError('অনুসন্ধান ব্যর্থ হয়েছে। সার্ভার চালু আছে কি?');
    } finally {
      setSearchLoading(false);
    }
  };

  // Step 3: Grant Deed & Send to AC Land Dashboard
  const handleGrantDeed = async () => {
    if (!landRecord) {
      alert('অনুগ্রহ করে প্রথমে জমি নির্বাচন করুন!');
      return;
    }

    if (landRecord.status !== 'Active') {
      alert(`এই জমিটি বর্তমানে '${landRecord.status}' অবস্থায় থাকায় দলিল সম্পাদন করা সম্ভব নয়!`);
      return;
    }

    if (!deedForm.buyer_name || !deedForm.buyer_nid || !deedForm.deed_no) {
      alert('ক্রেতার নাম, NID এবং দলিল নম্বর প্রদান আবশ্যক!');
      return;
    }

    setGrantLoading(true);
    try {
      const res = await axios.post('/api/grant-deed', {
        record_id: landRecord._id,
        ...deedForm,
        sold_area: deedForm.sold_area || searchForm.requested_area || landRecord.available_area_decimal
      });

      setGrantResult(res.data);
      if (res.data.record) {
        setLandRecord(prev => ({
          ...prev,
          status: 'Pending_Mutation',
          deed_no: res.data.record.deed_no,
          deed_hash: res.data.deed_hash,
          qr_code_id: res.data.qr_code_id
        }));
      }
    } catch (err) {
      setGrantResult({
        success: false,
        message: err.response?.data?.message || 'দলিল অনুমোদন ব্যর্থ হয়েছে।'
      });
    } finally {
      setGrantLoading(false);
    }
  };

  // Step 4: Download PDF
  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#0b1329' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`e-Namjari-Application-${grantResult?.record?.deed_no || deedForm.deed_no}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF ডাউনলোড ব্যর্থ হয়েছে।');
    }
  };

  const steps = [
    { num: 1, title: 'জমি সার্চ', desc: 'মালিকানা ও অ্যান্টি-ডাবল সেলিং চেক' },
    { num: 2, title: 'ক্রেতার তথ্য', desc: 'ক্রেতার এনআইডি ও দলিলের বিবরণ' },
    { num: 3, title: 'Grant Deed', desc: 'SHA-256 হ্যাশ ও এসি ল্যান্ডে প্রেরণ' },
    { num: 4, title: 'PDF ডাউনলোড', desc: 'ই-নামজারি আবেদনপত্র প্রিন্ট' }
  ];

  const currentStep = grantResult?.success ? 4 : landRecord ? 2 : 1;

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.7) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}>
              <Building2 size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং প্যানেল
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  fontWeight: '700'
                }}>
                  🛡️ Anti-Double Selling Active
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
                সাব-রেজিস্ট্রি কর্মকর্তা কর্তৃক দলিল সম্পাদন ➔ স্বয়ংক্রিয় লক ➔ এসি ল্যান্ড অফিসে নামজারি অনুমোদন প্রেরণ
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#93c5fd',
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            🏛️ সাব-রেজিস্ট্রি কোড: <strong>SR-BOG-SHIB-01</strong>
          </div>
        </div>

        {/* 4 Step Process Tracker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '22px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {steps.map((st) => {
            const isCompleted = currentStep > st.num || (st.num === 4 && grantResult?.success);
            const isCurrent = currentStep === st.num && !(st.num === 4 && grantResult?.success);
            return (
              <div
                key={st.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(59, 130, 246, 0.2)' : isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isCurrent ? '#3b82f6' : isCompleted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800',
                  background: isCurrent ? '#3b82f6' : isCompleted ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}>
                  {isCompleted ? <Check size={14} /> : st.num}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isCurrent ? '#93c5fd' : isCompleted ? '#86efac' : '#cbd5e1' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Steps (1, 2, 3) | Right Step 4 & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.25fr) minmax(340px, 1fr)', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: Land Search & Anti-Double Selling Check */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} color="#60a5fa" />
                ১. জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>ধাপ ১ / ৪</span>
            </div>

            {/* Quick preset buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>টেস্ট ডেটা:</span>
              <button
                type="button"
                onClick={() => setSearchForm({ seller_nid: '1998567890123', dag_no: '101', mouza: 'গুজিয়া', requested_area: '5' })}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ⚡ গুজিয়া (দাগ ১০১ - Active)
              </button>
              <button
                type="button"
                onClick={() => setSearchForm({ seller_nid: '2001123456789', dag_no: '205', mouza: 'অনন্তবালা', requested_area: '8' })}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ⚡ অনন্তবালা (দাগ ২০৫)
              </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                  বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: 1998567890123"
                  value={searchForm.seller_nid}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                  দাগ নম্বর (Plot No)
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="১০১"
                  value={searchForm.dag_no}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dag_no: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                  মৌজার নাম
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="গুজিয়া"
                  value={searchForm.mouza}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, mouza: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                  }}
                >
                  {searchLoading ? 'যাচাই করা হচ্ছে...' : '🔍 জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {searchError && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12px',
                marginTop: '10px'
              }}>
                ⚠️ {searchError}
              </div>
            )}

            {/* Anti-Double Selling Alert Box */}
            {doubleSellAlert && (
              <div style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid #ef4444',
                color: '#fecaca',
                fontSize: '13px',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#f87171', marginBottom: '4px' }}>
                  <ShieldAlert size={18} />
                  {doubleSellAlert.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' : '⚠️ ভূমি রেকর্ড সতর্কতা'}
                </div>
                <div>{doubleSellAlert.message}</div>
              </div>
            )}

            {/* Verified Land Record Preview */}
            {landRecord && !doubleSellAlert?.alert_type?.includes('DOUBLE_SELL') && (
              <div style={{
                marginTop: '14px',
                padding: '16px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#22c55e" />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#86efac' }}>
                      জমির তথ্য ও বৈধতা যাচাইকৃত
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: landRecord.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: landRecord.status === 'Active' ? '#86efac' : '#fde047',
                    fontWeight: '700'
                  }}>
                    স্ট্যাটাস: {landRecord.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                  <div>মৌজা: <strong>{landRecord.mouza}</strong></div>
                  <div>দাগ নম্বর: <strong>{landRecord.dag_no}</strong></div>
                  <div>খতিয়ান নম্বর: <strong>{landRecord.khatian_no}</strong></div>
                  <div>জে.এল নম্বর: <strong>{landRecord.jl_no}</strong></div>
                  <div>বর্তমান মালিক: <strong>{landRecord.owner_name}</strong></div>
                  <div>মালিকের NID: <strong style={{ fontFamily: 'monospace' }}>{landRecord.owner_nid}</strong></div>
                  <div style={{ gridColumn: 'span 2', color: '#4ade80' }}>
                    মোট বিক্রয়যোগ্য পরিমাণ: <strong>{landRecord.available_area_decimal || landRecord.total_area_decimal} শতক</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Buyer Details & Deed Preparation */}
          {landRecord && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#60a5fa" />
                  ২. ক্রেতার তথ্য ও দলিলের বিবরণ
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>ধাপ ২ / ৪</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    দলিল নম্বর <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={deedForm.deed_no}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_no: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    নিবন্ধনের সাল
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={deedForm.deed_year}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_year: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    ক্রেতার নাম <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="আব্দুল করিম"
                    value={deedForm.buyer_name}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_name: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    ক্রেতার NID নম্বর <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="2005111222333"
                    value={deedForm.buyer_nid}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_nid: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    ক্রেতার ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="01711112233"
                    value={deedForm.buyer_phone}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_phone: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    ক্রেতার ইমেইল (বিজ্ঞপ্তি প্রাপ্তির জন্য)
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="buyer@gmail.com"
                    value={deedForm.buyer_email}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_email: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                    বিক্রীত জমির পরিমাণ (শতক)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={deedForm.sold_area}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, sold_area: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* STEP 3 BUTTON: Grant Deed */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={handleGrantDeed}
                  disabled={grantLoading || landRecord.status !== 'Active'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '15px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle size={18} />
                  {grantLoading ? 'দলিল সম্পাদন হচ্ছে...' : '৩. Grant Deed অনুমোদন করুন ➔ এসি ল্যান্ডে পাঠান'}
                </button>
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
                  🔒 Grant Deed করার সাথে সাথে SHA-256 হ্যাশ তৈরি হবে এবং জমিটি Pending_Mutation-এ লক হবে।
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Grant Result & PDF Preview */}
        <div>
          {!grantResult && (
            <div className="glass-card" style={{
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FileText size={36} color="#60a5fa" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 8px 0' }}>
                ই-নামজারি আবেদন ফর্ম প্রিভিউ
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6 }}>
                বাম পাশের প্যানেলে জমি সার্চ করে ক্রেতার তথ্য প্রদান করে <strong>Grant Deed</strong> সম্পন্ন করলে এখানে লাইভ আবেদনপত্র এবং কিউআর কোড দৃশ্যমান হবে।
              </p>
            </div>
          )}

          {grantResult && (
            <div>
              {/* Grant Result Banner */}
              <div style={{
                padding: '16px 20px',
                background: grantResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${grantResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle size={24} color={grantResult.success ? '#22c55e' : '#ef4444'} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: grantResult.success ? '#86efac' : '#fca5a5' }}>
                    {grantResult.message || 'Deed Granted! দলিল অনুমোদিত হয়েছে'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                    জমি Pending_Mutation লক · এসি ল্যান্ড অফিস ড্যাশবোর্ডে আবেদন পৌঁছেছে
                  </div>
                </div>
              </div>

              {/* SHA-256 Hash Card */}
              {grantResult.deed_hash && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={13} color="#60a5fa" /> ক্রিপ্টোগ্রাফিক SHA-256 দলিল হ্যাশ (Anti-Tamper Deed Hash)
                  </div>
                  <div style={{ fontSize: '11px', color: '#93c5fd', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: '600' }}>
                    {grantResult.deed_hash}
                  </div>
                </div>
              )}

              {/* Printable PDF Preview Container */}
              <div
                ref={pdfRef}
                style={{
                  background: '#0b1329',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Government Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                  </div>
                  <div style={{ fontSize: '14px', color: '#93c5fd', fontWeight: '600', marginTop: '2px' }}>
                    ভূমি মন্ত্রণালয় · সাব-রেজিস্ট্রি ও রাজস্ব নেটওয়ার্ক
                  </div>
                  <div style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: '700', marginTop: '4px' }}>
                    ই-নামজারি আবেদন ফর্ম (দলিল নিবন্ধন রেকর্ড)
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    e-Namjari Application & Deed Grant Record
                  </div>
                </div>

                {/* Details Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px', fontSize: '12px' }}>
                  {[
                    ['দলিল নম্বর', grantResult.record?.deed_no || deedForm.deed_no],
                    ['নিবন্ধনের সাল', grantResult.record?.deed_year || deedForm.deed_year],
                    ['সাব-রেজিস্ট্রি কোড', deedForm.sub_registry_code],
                    ['তারিখ', new Date().toLocaleDateString('bn-BD')],
                    ['মৌজা', landRecord.mouza],
                    ['দাগ নম্বর', landRecord.dag_no],
                    ['খতিয়ান নম্বর', landRecord.khatian_no],
                    ['বিক্রীত জমি', `${deedForm.sold_area} শতক`],
                    ['বিক্রেতার নাম', landRecord.owner_name],
                    ['বিক্রেতার NID', landRecord.owner_nid],
                    ['ক্রেতার নাম', deedForm.buyer_name],
                    ['ক্রেতার NID', deedForm.buyer_nid],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{k}</div>
                      <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* QR Code & Digital Verification */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <QRCodeSVG
                    value={`http://localhost:5173/qr-verify/${grantResult.qr_code_id || 'QR-' + deedForm.deed_no}`}
                    size={80}
                    fgColor="#f8fafc"
                    bgColor="transparent"
                    level="H"
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#93c5fd' }}>
                      QR কোড আইডি: {grantResult.qr_code_id || 'QR-' + deedForm.deed_no}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.5 }}>
                      এই QR কোড স্ক্যান করে লাইভ দলিলের বৈধতা ও এসি ল্যান্ডের স্ট্যাটাস যাচাই করা যাবে।
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
                      ডিজিটাল স্বাক্ষর: {grantResult.deed_hash?.substring(0, 24)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 4 BUTTON: Download PDF */}
              <button
                type="button"
                onClick={downloadPDF}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                }}
              >
                <Download size={16} /> ৪. ই-নামজারি ফর্ম PDF ডাউনলোড করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
