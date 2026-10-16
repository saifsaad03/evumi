import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Search, CheckCircle, FileText, Download, Hash, 
  ShieldAlert, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, 
  Check, Sparkles, Send, Lock, Clock, Info, UserX, Loader2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function P4RegistryPanel() {
  const [searchForm, setSearchForm] = useState({ 
    seller_nid: '', 
    dag_no: '', 
    mouza: '', 
    requested_area: '' 
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [landRecord, setLandRecord] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [doubleSellAlert, setDoubleSellAlert] = useState(null);

  // Mouza list state for dropdown
  const [mouzasList, setMouzasList] = useState(['গুজিয়া', 'ধানমন্ডি', 'মিরপুর', 'শিবগঞ্জ', 'চকসারকার', 'মহাস্থান', 'পাইকপাড়া', 'তেজগাঁও', 'উত্তরা']);

  // Buyer verification states
  const [buyerVerifying, setBuyerVerifying] = useState(false);
  const [buyerVerified, setBuyerVerified] = useState(false);
  const [buyerVerifyMsg, setBuyerVerifyMsg] = useState(null);
  const [buyerVerifyError, setBuyerVerifyError] = useState(null);

  const [deedForm, setDeedForm] = useState({
    deed_no: `DEED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    deed_year: new Date().getFullYear().toString(),
    sub_registry_code: 'SR-BOG-SHIB-01',
    buyer_name: '',
    buyer_nid: '',
    buyer_phone: '',
    buyer_email: '',
    sold_area: '',
  });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchMouzas();
  }, []);

  const fetchMouzas = async () => {
    try {
      const res = await axios.get('/api/mouzas');
      if (res.data.success && res.data.mouzas && res.data.mouzas.length > 0) {
        setMouzasList(res.data.mouzas);
      }
    } catch (err) {
      console.warn('Failed to load mouzas list, fallback list active:', err);
    }
  };

  // Buyer NID live verification in database
  const handleVerifyBuyer = async (customNid) => {
    const targetNid = (customNid || deedForm.buyer_nid || '').toString().trim();
    if (!targetNid) {
      setBuyerVerifyError('অনুগ্রহ করে ক্রেতার NID নম্বর লিখুন।');
      return;
    }

    setBuyerVerifying(true);
    setBuyerVerifyError(null);
    setBuyerVerifyMsg(null);

    try {
      const res = await axios.get(`/api/verify-buyer/${encodeURIComponent(targetNid)}`);
      if (res.data.success && res.data.buyer) {
        setDeedForm(prev => ({
          ...prev,
          buyer_nid: res.data.buyer.nid,
          buyer_name: res.data.buyer.name,
          buyer_phone: res.data.buyer.phone || prev.buyer_phone,
          buyer_email: res.data.buyer.email || prev.buyer_email
        }));
        setBuyerVerified(true);
        setBuyerVerifyMsg(`✅ ক্রেতার অ্যাকাউন্ট যাচাই সম্পন্ন: ${res.data.buyer.name} (ইমেইল: ${res.data.buyer.email || 'N/A'})`);
      }
    } catch (err) {
      setBuyerVerified(false);
      setBuyerVerifyError(err.response?.data?.message || 'ক্রেতার অ্যাকাউন্ট ডাটাবেজে পাওয়া যায়নি। ক্রেতাকে প্রথমে নাগরিক হিসেবে নিবন্ধন করতে হবে।');
    } finally {
      setBuyerVerifying(false);
    }
  };

  // Step 1: Search Land & Run Anti-Double Selling Engine
  // Requires ALL THREE: Seller NID + Mouza + Dag Number
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchForm.seller_nid?.trim() || !searchForm.dag_no?.trim() || !searchForm.mouza?.trim()) {
      setSearchError('অনুগ্রহ করে বিক্রেতার NID নম্বর, দাগ নম্বর এবং মৌজা — এই ৩টি তথ্যই প্রদান করুন।');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setLandRecord(null);
    setGrantResult(null);
    setDoubleSellAlert(null);
    setBuyerVerified(false);
    setBuyerVerifyMsg(null);
    setBuyerVerifyError(null);

    try {
      // Live Anti-Double Selling & Ownership check via verify-deed
      const verifyRes = await axios.post('/api/verify-deed', {
        seller_nid: searchForm.seller_nid?.trim(),
        dag_no: searchForm.dag_no?.trim(),
        mouza: searchForm.mouza?.trim(),
        requested_area: searchForm.requested_area || '1'
      });

      if (verifyRes.data) {
        if (!verifyRes.data.success) {
          // Double selling, fake owner, unassigned land, or not found alert
          setDoubleSellAlert(verifyRes.data);
          setLandRecord(null);
        } else {
          // Successfully verified against existing assigned land record
          setLandRecord(verifyRes.data.record);
          setDoubleSellAlert(null);
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'অনুসন্ধান ব্যর্থ হয়েছে। সার্ভার চালু আছে কি?');
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

    if (!buyerVerified) {
      alert('দলিল অনুমোদন করার পূর্বে অবশ্যই ক্রেতার NID সিস্টেমে যাচাই সম্পন্ন হতে হবে!');
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
    <div style={{ color: '#0f172a' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderLeft: '5px solid #2563eb',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
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
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং প্যানেল
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
                  🛡️ Anti-Double Selling Active
                </span>
              </div>
              <p style={{ color: '#334155', fontSize: '13px', margin: '4px 0 0 0' }}>
                সাব-রেজিস্ট্রি কর্মকর্তা কর্তৃক দলিল সম্পাদন ➔ স্বয়ংক্রিয় লক ➔ এসি ল্যান্ড অফিসে নামজারি অনুমোদন প্রেরণ
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#1e40af',
            background: '#eff6ff',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1.5px solid #bfdbfe',
            fontWeight: '600'
          }}>
            🏛️ সাব-রেজিস্ট্রি কোড: <strong style={{ color: '#1d4ed8' }}>SR-BOG-SHIB-01</strong>
          </div>
        </div>

        {/* 4 Step Process Tracker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '22px',
          paddingTop: '20px',
          borderTop: '1.5px solid #e2e8f0'
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
                  background: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${isCurrent ? '#2563eb' : isCompleted ? '#86efac' : '#cbd5e1'}`,
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
                  background: isCurrent ? '#2563eb' : isCompleted ? '#16a34a' : '#94a3b8',
                  color: 'white'
                }}>
                  {isCompleted ? <Check size={14} /> : st.num}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isCurrent ? '#1e40af' : isCompleted ? '#166534' : '#1e293b' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '10px', color: isCurrent ? '#1d4ed8' : isCompleted ? '#15803d' : '#64748b' }}>
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
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <Search size={18} color="#2563eb" />
                ১. জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
              </h3>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>ধাপ ১ / ৪</span>
            </div>


            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: 1998567890123"
                  value={searchForm.seller_nid}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  দাগ নম্বর (Plot No) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="১০১"
                  value={searchForm.dag_no}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dag_no: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  মৌজার নাম নির্বাচন করুন <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={searchForm.mouza}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, mouza: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                >
                  <option value="">-- মৌজা নির্বাচন করুন --</option>
                  {mouzasList.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    color: '#ffffff'
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
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '12px',
                marginTop: '10px',
                fontWeight: '600'
              }}>
                ⚠️ {searchError}
              </div>
            )}

            {/* Anti-Double Selling Alert Box */}
            {doubleSellAlert && (
              <div style={{
                marginTop: '14px',
                padding: '16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: 1.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#b91c1c', marginBottom: '6px' }}>
                  <ShieldAlert size={18} />
                  {doubleSellAlert.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' :
                   doubleSellAlert.alert_type === 'COURT_CASE_STAY_ORDER' ? '⛔ আদালতীয় মামলা ও স্থগিতাদেশ সতর্কতা (Court Case / Stay Order Alert)' :
                   doubleSellAlert.alert_type === 'FAKE_OWNER' ? '🚨 জালিয়াতি সতর্কতা (Fake Owner Detected)' :
                   doubleSellAlert.alert_type === 'UNASSIGNED_LAND' ? '⚠️ সরকারি খাস জমি সতর্কতা (Unassigned Land)' :
                   doubleSellAlert.alert_type === 'ALREADY_SOLD' ? '🚫 পূর্বেই বিক্রিত জমি (Already Sold)' :
                   doubleSellAlert.alert_type === 'NOT_FOUND' ? '🔍 রেকর্ড পাওয়া যায়নি (Record Not Found)' :
                   '⚠️ ভূমি রেকর্ড যাচাইকরণ সতর্কতা'}
                </div>
                <div style={{ fontWeight: '500' }}>{doubleSellAlert.message}</div>
              </div>
            )}

            {/* Verified Land Record Preview */}
            {landRecord && !doubleSellAlert && (
              <div style={{
                marginTop: '14px',
                padding: '18px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#16a34a" />
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#166534' }}>
                      জমির তথ্য ও বৈধতা যাচাইকৃত
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: landRecord.status === 'Active' ? '#dcfce7' : '#fef3c7',
                    color: landRecord.status === 'Active' ? '#166534' : '#92400e',
                    fontWeight: '700',
                    border: `1px solid ${landRecord.status === 'Active' ? '#86efac' : '#fde68a'}`
                  }}>
                    স্ট্যাটাস: {landRecord.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মৌজা: <strong style={{ color: '#0f172a' }}>{landRecord.mouza}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>দাগ নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.dag_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>খতিয়ান নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.khatian_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>জে.এল নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.jl_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>বর্তমান মালিক: <strong style={{ color: '#1d4ed8' }}>{landRecord.owner_name}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মালিকের NID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{landRecord.owner_nid}</strong></div>
                  <div style={{ gridColumn: 'span 2', background: '#dcfce7', padding: '10px 14px', borderRadius: '8px', color: '#166534', border: '1px solid #86efac' }}>
                    মোট বিক্রয়যোগ্য পরিমাণ: <strong style={{ fontSize: '15px', color: '#15803d' }}>{landRecord.available_area_decimal || landRecord.total_area_decimal} শতক</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Buyer Details & Deed Preparation */}
          {landRecord && !doubleSellAlert && (
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#2563eb" />
                  ২. ক্রেতার তথ্য ও দলিলের বিবরণ
                </h3>
                <span style={{ fontSize: '11px', color: '#1e40af', background: '#dbeafe', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>ধাপ ২ / ৪</span>
              </div>

              {/* Buyer NID Verification Box */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '800' }}>
                  ক্রেতার জাতীয় পরিচয়পত্র (NID) যাচাই <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ক্রেতার ১৩/১৭ বা ১০ ডিজিটের NID লিখুন"
                    value={deedForm.buyer_nid}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeedForm(prev => ({ ...prev, buyer_nid: val }));
                      setBuyerVerified(false);
                      setBuyerVerifyMsg(null);
                      setBuyerVerifyError(null);
                    }}
                    style={{ flex: 1, fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyBuyer()}
                    disabled={buyerVerifying || !deedForm.buyer_nid?.trim()}
                    className="btn-primary"
                    style={{
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {buyerVerifying ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                    {buyerVerifying ? 'যাচাই হচ্ছে...' : 'ক্রেতা যাচাই করুন'}
                  </button>
                </div>

                {buyerVerifyMsg && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>{buyerVerifyMsg}</span>
                  </div>
                )}

                {buyerVerifyError && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserX size={16} color="#dc2626" />
                    <span>{buyerVerifyError}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    দলিল নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="যেমন: DEED-2026-101"
                    value={deedForm.deed_no}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_no: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    নিবন্ধনের সাল
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={deedForm.deed_year}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_year: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার নাম (স্বয়ংক্রিয় তথ্য) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ক্রেতা যাচাইয়ের পর নাম প্রদর্শিত হবে"
                    value={deedForm.buyer_name}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_name: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: buyerVerified ? '#f0fdf4' : '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="যেমন: ০১৭১১xxxxxx"
                    value={deedForm.buyer_phone}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_phone: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার ইমেইল (পেমেন্ট নোটিফিকেশনের জন্য) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="ক্রেতার ইমেইল এড্রেস"
                    value={deedForm.buyer_email}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_email: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: buyerVerified ? '#f0fdf4' : '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    বিক্রীত জমির পরিমাণ (শতক)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={deedForm.sold_area}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, sold_area: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>
              </div>

              {/* STEP 3 BUTTON: Grant Deed */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleGrantDeed}
                  disabled={grantLoading || landRecord.status !== 'Active' || !buyerVerified}
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
                    background: buyerVerified ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#94a3b8',
                    cursor: buyerVerified ? 'pointer' : 'not-allowed',
                    color: '#ffffff',
                    boxShadow: buyerVerified ? '0 4px 16px rgba(22, 163, 74, 0.35)' : 'none'
                  }}
                >
                  <CheckCircle size={18} />
                  {grantLoading ? 'দলিল সম্পাদন হচ্ছে...' : '৩. Grant Deed অনুমোদন করুন ➔ এসি ল্যান্ডে পাঠান'}
                </button>
                <div style={{ fontSize: '11px', color: buyerVerified ? '#475569' : '#dc2626', textAlign: 'center', marginTop: '8px', fontWeight: '600' }}>
                  {buyerVerified 
                    ? '🔒 Grant Deed করার সাথে সাথে SHA-256 হ্যাশ তৈরি হবে এবং ক্রেতার ইমেইলে নোটিফিকেশন যাবে।'
                    : '⚠️ দলিল সম্পন্ন করতে প্রথমে ওপরের "ক্রেতা যাচাই করুন" বাটনে ক্লিক করে ক্রেতার NID যাচাই করুন।'}
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
              background: '#ffffff',
              border: '2px dashed #94a3b8'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FileText size={36} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                ই-নামজারি আবেদন ফর্ম প্রিভিউ
              </h4>
              <p style={{ color: '#475569', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6, fontWeight: '500' }}>
                বাম পাশের প্যানেলে জমি সার্চ করে ক্রেতার তথ্য প্রদান করে <strong>Grant Deed</strong> সম্পন্ন করলে এখানে লাইভ আবেদনপত্র এবং কিউআর কোড দৃশ্যমান হবে।
              </p>
            </div>
          )}

          {grantResult && (
            <div>
              {/* Grant Result Banner */}
              <div style={{
                padding: '16px 20px',
                background: grantResult.success ? '#dcfce7' : '#fef2f2',
                border: `1.5px solid ${grantResult.success ? '#86efac' : '#f87171'}`,
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle size={24} color={grantResult.success ? '#16a34a' : '#dc2626'} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: grantResult.success ? '#166534' : '#991b1b' }}>
                    {grantResult.message || 'Deed Granted! দলিল অনুমোদিত হয়েছে'}
                  </div>
                  <div style={{ fontSize: '12px', color: grantResult.success ? '#15803d' : '#b91c1c', marginTop: '2px', fontWeight: '500' }}>
                    জমি Pending_Mutation লক · এসি ল্যান্ড অফিস ড্যাশবোর্ডে আবেদন পৌঁছেছে
                  </div>
                </div>
              </div>

              {/* SHA-256 Hash Card */}
              {grantResult.deed_hash && (
                <div style={{
                  padding: '12px 16px',
                  background: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <Hash size={13} color="#2563eb" /> ক্রিপ্টোগ্রাফিক SHA-256 দলিল হ্যাশ (Anti-Tamper Deed Hash)
                  </div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: '700' }}>
                    {grantResult.deed_hash}
                  </div>
                </div>
              )}

              {/* Printable PDF Preview Container */}
              <div
                ref={pdfRef}
                style={{
                  background: '#ffffff',
                  border: '2px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
                }}
              >
                {/* Government Header */}
                <div style={{ textAlign: 'center', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px' }}>
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '700', marginTop: '2px' }}>
                    ভূমি মন্ত্রণালয় · সাব-রেজিস্ট্রি ও রাজস্ব নেটওয়ার্ক
                  </div>
                  <div style={{ fontSize: '13px', color: '#166534', fontWeight: '800', marginTop: '4px' }}>
                    ই-নামজারি আবেদন ফর্ম (দলিল নিবন্ধন রেকর্ড)
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', fontWeight: '600' }}>
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
                    <div key={k} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>{k}</div>
                      <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* QR Code & Digital Verification */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1'
                }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/#/qr-verify/${grantResult.qr_code_id || 'QR-' + deedForm.deed_no}`}
                    size={80}
                    fgColor="#0f172a"
                    bgColor="transparent"
                    level="H"
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>
                      QR কোড আইডি: {grantResult.qr_code_id || 'QR-' + deedForm.deed_no}
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', lineHeight: 1.5, fontWeight: '500' }}>
                      এই QR কোড স্ক্যান করে লাইভ দলিলের বৈধতা ও এসি ল্যান্ডের স্ট্যাটাস যাচাই করা যাবে।
                    </div>
                    <div style={{ fontSize: '9px', color: '#334155', marginTop: '4px', fontFamily: 'monospace', fontWeight: '600' }}>
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
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff'
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
