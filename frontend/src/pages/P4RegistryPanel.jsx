import { useState, useRef } from 'react';
import axios from 'axios';
import { Building2, Search, CheckCircle, FileText, Download, Hash } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

export default function P4RegistryPanel() {
  const [searchForm, setSearchForm] = useState({ seller_nid: '', dag_no: '', mouza: '' });
  const [searchLoading, setSearchLoading] = useState(false);
  const [landRecord, setLandRecord] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [deedForm, setDeedForm] = useState({
    deed_no: '', deed_year: '', sub_registry_code: 'SR-DHAKA-01',
    buyer_name: '', buyer_nid: '', buyer_phone: '', buyer_email: '', sold_area: '',
  });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState(null);
  const pdfRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setLandRecord(null);
    setGrantResult(null);
    try {
      const res = await axios.get('/api/land-records', { params: searchForm });
      if (res.data.data?.length > 0) {
        setLandRecord(res.data.data[0]);
      } else {
        setSearchError('এই তথ্যে কোনো Active জমির রেকর্ড পাওয়া যায়নি।');
      }
    } catch {
      setSearchError('অনুসন্ধান ব্যর্থ। Backend চালু আছে কি?');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGrantDeed = async () => {
    if (!landRecord) return;
    setGrantLoading(true);
    try {
      const res = await axios.post('/api/grant-deed', {
        record_id: landRecord._id,
        ...deedForm,
      });
      setGrantResult(res.data);

      // Send email via EmailJS (mock - uses placeholder keys)
      if (deedForm.buyer_email) {
        try {
          await emailjs.send(
            'YOUR_SERVICE_ID',   // Replace with actual EmailJS service ID
            'YOUR_TEMPLATE_ID',  // Replace with actual EmailJS template ID
            {
              to_email: deedForm.buyer_email,
              to_name: deedForm.buyer_name,
              deed_no: deedForm.deed_no,
              mouza: landRecord.mouza,
              dag_no: landRecord.dag_no,
              seller_name: landRecord.owner_name,
              deed_hash: res.data.deed_hash,
            },
            'YOUR_PUBLIC_KEY'    // Replace with actual EmailJS public key
          );
        } catch {
          // Email send failed silently (placeholder keys)
          console.log('EmailJS: placeholder keys, email not sent');
        }
      }
    } catch (err) {
      setGrantResult({ success: false, message: err.response?.data?.message || 'দলিল অনুমোদন ব্যর্থ।' });
    } finally {
      setGrantLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#0d1629' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`e-Namjari-Form-${grantResult?.record?.deed_no || 'deed'}.pdf`);
  };

  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9' }}>P4 — সাব-রেজিস্ট্রি অফিস প্যানেল</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Sub-Registry Dashboard · দলিল নিবন্ধন ও ই-নামজারি আবেদন</p>
          </div>
        </div>

        {/* Workflow steps visual */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {['জমি সার্চ', 'ক্রেতার তথ্য', 'Grant Deed', 'PDF ডাউনলোড'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>
                {i + 1}. {s}
              </div>
              {i < 3 && <span style={{ color: '#334155', fontSize: '14px' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left: Search + Deed Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Search */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} color="#60a5fa" /> ধাপ ১: জমির রেকর্ড খুঁজুন
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'seller_nid', label: 'বিক্রেতার NID', placeholder: '1998567890123' },
                { name: 'dag_no', label: 'দাগ নম্বর', placeholder: '101' },
                { name: 'mouza', label: 'মৌজা (শিবগঞ্জ)', placeholder: 'গুজিয়া' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input className="input-field" style={{ padding: '10px 14px', fontSize: '13px' }}
                    name={f.name} value={searchForm[f.name]}
                    onChange={e => setSearchForm({ ...searchForm, [e.target.name]: e.target.value })}
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSearchForm({ seller_nid: '1998567890123', dag_no: '101', mouza: 'গুজিয়া' })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#93c5fd', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  ⚡ গুজিয়া (দাগ ১০১)
                </button>
                <button
                  type="button"
                  onClick={() => setSearchForm({ seller_nid: '2001123456789', dag_no: '205', mouza: 'অনন্তবালা' })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#93c5fd', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                >
                  ⚡ অনন্তবালা (দাগ ২০৫)
                </button>
              </div>
              <button type="submit" className="btn-blue" disabled={searchLoading} style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {searchLoading ? <div className="loader" /> : <Search size={14} />}
                {searchLoading ? 'খোঁজা হচ্ছে...' : 'জমি খুঁজুন'}
              </button>
            </form>
            {searchError && <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fca5a5' }}>{searchError}</div>}
          </div>

          {/* Step 2: Land Record Found */}
          {landRecord && (
            <div className="animate-fade-in-up" style={{ padding: '20px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle size={16} color="#22c55e" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#86efac' }}>✅ সক্রিয় রেকর্ড পাওয়া গেছে</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                {[
                  ['মৌজা', landRecord.mouza], ['দাগ নং', landRecord.dag_no],
                  ['খতিয়ান', landRecord.khatian_no], ['মালিক', landRecord.owner_name],
                  ['NID', landRecord.owner_nid?.slice(0, 8) + '***'], ['জমি', `${landRecord.available_area_decimal} শতাংশ`],
                ].map(([k, v]) => (
                  <div key={k}><div style={{ color: '#64748b', fontSize: '10px' }}>{k}</div><div style={{ color: '#f1f5f9', fontWeight: '600' }}>{v}</div></div>
                ))}
              </div>
              <div className="badge-active" style={{ display: 'inline-block', marginTop: '10px' }}>🟢 Active</div>
            </div>
          )}

          {/* Step 3: Deed Form */}
          {landRecord && !grantResult && (
            <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#60a5fa" /> ধাপ ২: দলিলের তথ্য ও ক্রেতা
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'deed_no', label: 'দলিল নম্বর', placeholder: 'DEED-2026-001' },
                  { name: 'deed_year', label: 'নিবন্ধনের সাল', placeholder: '2026' },
                  { name: 'sub_registry_code', label: 'সাব-রেজিস্ট্রি কোড', placeholder: 'SR-DHAKA-01' },
                  { name: 'sold_area', label: 'বিক্রীত জমি (শতাংশ)', placeholder: '5' },
                  { name: 'buyer_name', label: 'ক্রেতার নাম', placeholder: 'আব্দুল করিম' },
                  { name: 'buyer_nid', label: 'ক্রেতার NID', placeholder: '2005111222333' },
                  { name: 'buyer_phone', label: 'ক্রেতার ফোন', placeholder: '01711111111' },
                  { name: 'buyer_email', label: 'ক্রেতার ইমেইল', placeholder: 'buyer@example.com' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                    <input className="input-field" style={{ padding: '10px 14px', fontSize: '13px' }}
                      name={f.name} value={deedForm[f.name]}
                      onChange={e => setDeedForm({ ...deedForm, [e.target.name]: e.target.value })}
                      placeholder={f.placeholder} />
                  </div>
                ))}
                <button onClick={handleGrantDeed} disabled={grantLoading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                  {grantLoading ? <><div className="loader" /> অনুমোদন হচ্ছে...</> : <>✅ Grant Deed অনুমোদন করুন</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: PDF Preview */}
        <div>
          {!grantResult && (
            <div className="glass-card-light" style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.3 }}>📄</div>
              <div style={{ fontSize: '16px', color: '#64748b' }}>দলিল অনুমোদন করলে<br />ই-নামজারি ফর্ম এখানে দেখাবে</div>
            </div>
          )}

          {grantResult && (
            <div className="animate-fade-in-up">
              {!grantResult.success ? (
                <div style={{ padding: '20px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '16px', color: '#fca5a5' }}>
                  ❌ {grantResult.message}
                </div>
              ) : (
                <>
                  {/* Success banner */}
                  <div style={{ padding: '16px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} color="#22c55e" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#86efac' }}>🎉 Deed Granted! দলিল অনুমোদিত হয়েছে</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>জমি Pending_Mutation লক · P4 AC Land ড্যাশবোর্ডে আবেদন পৌঁছেছে</div>
                    </div>
                  </div>

                  {/* Hash display */}
                  <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', marginBottom: '16px', fontFamily: 'monospace' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={12} /> SHA-256 Deed Hash</div>
                    <div style={{ fontSize: '10px', color: '#93c5fd', wordBreak: 'break-all' }}>{grantResult.deed_hash}</div>
                  </div>

                  {/* PDF Preview */}
                  <div ref={pdfRef} style={{
                    background: '#0d1629',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '28px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
                      <div style={{ fontSize: '14px', color: '#94a3b8' }}>ভূমি মন্ত্রণালয় · ই-নামজারি আবেদন ফর্ম</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>e-Namjari Application Form</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      {[
                        ['দলিল নম্বর', grantResult.record.deed_no],
                        ['নিবন্ধনের সাল', grantResult.record.deed_year],
                        ['সাব-রেজিস্ট্রি', grantResult.record.sub_registry_code],
                        ['তারিখ', new Date().toLocaleDateString('en-BD')],
                        ['মৌজা', grantResult.record.mouza],
                        ['দাগ নম্বর', grantResult.record.dag_no],
                        ['খতিয়ান নম্বর', grantResult.record.khatian_no],
                        ['বিক্রীত জমি', `${grantResult.record.sold_area} শতাংশ`],
                        ['বিক্রেতার নাম', grantResult.record.owner_name],
                        ['বিক্রেতার NID', grantResult.record.owner_nid],
                        ['ক্রেতার নাম', grantResult.record.buyer_name],
                        ['ক্রেতার NID', grantResult.record.buyer_nid],
                      ].map(([k, v]) => (
                        <div key={k} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>{k}</div>
                          <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: '600' }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                      <QRCodeSVG
                        value={`http://localhost:5173/qr-verify/${grantResult.qr_code_id}`}
                        size={90}
                        fgColor="#f1f5f9"
                        bgColor="transparent"
                        level="H"
                      />
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>QR Code ID: <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{grantResult.qr_code_id}</span></div>
                        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>এই QR কোড স্ক্যান করে জমির<br />বৈধতা লাইভ যাচাই করুন।</div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px', fontFamily: 'monospace' }}>Hash: {grantResult.deed_hash?.substring(0, 24)}...</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '10px', color: '#475569' }}>এই দলিলটি ডিজিটালভাবে স্বাক্ষরিত এবং ব্লকচেইন-অডিটযোগ্য · e-Vhumi System v2.0</div>
                    </div>
                  </div>

                  <button onClick={downloadPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                    <Download size={16} /> ই-নামজারি ফর্ম PDF ডাউনলোড করুন
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
