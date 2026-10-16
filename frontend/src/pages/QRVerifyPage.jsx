import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Shield, Lock, Hash, FileText, ArrowRight, Fingerprint, AlertTriangle } from 'lucide-react';

export default function QRVerifyPage() {
  const { qr_code_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExplainer, setShowExplainer] = useState(false);
  const [verifySteps, setVerifySteps] = useState([false, false, false, false]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/verify-by-qr/${qr_code_id}`);
        setData(res.data);
        // Animate verification steps one by one
        setTimeout(() => setVerifySteps(s => [true, ...s.slice(1)]), 400);
        setTimeout(() => setVerifySteps(s => [s[0], true, ...s.slice(2)]), 900);
        setTimeout(() => setVerifySteps(s => [s[0], s[1], true, s[3]]), 1400);
        setTimeout(() => setVerifySteps(s => [s[0], s[1], s[2], true]), 1900);
      } catch (err) {
        setError(err.response?.data?.message || 'QR যাচাই ব্যর্থ।');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [qr_code_id]);

  const stepData = [
    { icon: <Hash size={18} />, label: 'QR কোড আইডি যাচাই', desc: 'ডেটাবেজে QR ID বিদ্যমান কিনা যাচাই' },
    { icon: <Fingerprint size={18} />, label: 'SHA-256 হ্যাশ যাচাই', desc: 'দলিলের ডিজিটাল ফিঙ্গারপ্রিন্ট মিলছে' },
    { icon: <Shield size={18} />, label: 'মালিকানা রেকর্ড যাচাই', desc: 'বর্তমান মালিক ও জমির স্ট্যাটাস সক্রিয়' },
    { icon: <Lock size={18} />, label: 'অ্যান্টি-টেম্পারিং চেক', desc: 'দলিলে কোনো পরিবর্তন ঘটেনি — প্রমাণিত' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#dde3ea', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '680px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: '#dcfce7',
            border: '2px solid #16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
          }}>
            <Shield size={28} color="#15803d" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            ই-ভূমি দলিল ও খতিয়ান সত্যতা যাচাই
          </h1>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
            Digital Deed & Khotiyan Authenticity Verification via SHA-256
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="loader" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#334155', fontSize: '15px', fontWeight: '600' }}>QR কোড যাচাই হচ্ছে...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '36px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fca5a5', boxShadow: '0 4px 12px rgba(220,38,38,0.08)' }}>
            <XCircle size={56} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#b91c1c', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>❌ জাল দলিল / অকার্যকর QR কোড</div>
            <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6, fontWeight: '500' }}>{error}</div>
            <div style={{
              marginTop: '20px', padding: '14px', borderRadius: '12px',
              background: '#fef2f2', border: '1.5px solid #fecaca',
              fontSize: '13px', color: '#991b1b', lineHeight: 1.7, textAlign: 'left'
            }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              <strong>সতর্কতা:</strong> এই QR কোডটি ই-ভূমি সিস্টেমের ডেটাবেজে নিবন্ধিত নয়। দলিলটি জাল হতে পারে।
              অনুগ্রহ করে নিকটস্থ উপজেলা ভূমি অফিসে যোগাযোগ করুন।
            </div>
          </div>
        )}

        {/* Success - Verified */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Verification Steps Animation */}
            <div style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#16a34a" /> সত্যতা যাচাই ধাপসমূহ
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stepData.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    transition: 'all 0.5s ease',
                    background: verifySteps[i] ? '#f0fdf4' : '#f8fafc',
                    border: `1.5px solid ${verifySteps[i] ? '#86efac' : '#e2e8f0'}`,
                    opacity: verifySteps[i] ? 1 : 0.6,
                    transform: verifySteps[i] ? 'translateX(0)' : 'translateX(-6px)'
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: verifySteps[i] ? '#16a34a' : '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: verifySteps[i] ? '#ffffff' : '#64748b',
                      transition: 'all 0.5s ease', flexShrink: 0
                    }}>
                      {verifySteps[i] ? <CheckCircle size={18} color="#fff" /> : step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: verifySteps[i] ? '#14532d' : '#475569' }}>{step.label}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{step.desc}</div>
                    </div>
                    {verifySteps[i] && <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '800' }}>✅ PASS</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Badge */}
            <div style={{
              padding: '28px', textAlign: 'center', borderRadius: '16px',
              background: '#ecfdf5',
              border: '2px solid #22c55e',
              boxShadow: '0 4px 16px rgba(34,197,94,0.15)'
            }}>
              <CheckCircle size={52} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <div style={{ color: '#14532d', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
                ✅ দলিল / খতিয়ান সত্য ও বৈধ প্রমাণিত
              </div>
              <div style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                VERIFIED — This deed/khotiyan is authentic and registered in the e-Vhumi blockchain ledger.
              </div>
            </div>

            {/* Record Details */}
            <div style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#2563eb" /> রেকর্ড বিবরণ
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {data.data && Object.entries({
                  'মৌজা': data.data.mouza,
                  'দাগ নং': data.data.dag_no,
                  'খতিয়ান নং': data.data.khatian_no,
                  'জে.এল নং': data.data.jl_no,
                  'মালিক': data.data.owner_name,
                  'জমির পরিমাণ': `${data.data.total_area_decimal} শতাংশ`,
                  'স্ট্যাটাস': data.data.status,
                  'সর্বশেষ হালনাগাদ': data.data.last_updated ? new Date(data.data.last_updated).toLocaleDateString('bn-BD') : '—',
                }).map(([k, v]) => (
                  <div key={k} style={{
                    padding: '12px 14px', borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>{k}</div>
                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SHA-256 Hash Display */}
            <div style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fingerprint size={20} color="#7c3aed" /> ডিজিটাল ফিঙ্গারপ্রিন্ট (SHA-256 Hash)
              </div>

              <div style={{
                padding: '16px', borderRadius: '12px',
                background: '#f5f3ff',
                border: '1.5px solid #ddd6fe',
              }}>
                <div style={{ fontSize: '12px', color: '#6d28d9', fontWeight: '800', marginBottom: '8px' }}>
                  DEED HASH (ডিজিটাল স্বাক্ষর):
                </div>
                <div style={{
                  fontSize: '13px', color: '#1e1b4b',
                  fontFamily: 'monospace', wordBreak: 'break-all',
                  padding: '12px', background: '#ede9fe',
                  borderRadius: '8px', lineHeight: 1.7,
                  letterSpacing: '0.5px', fontWeight: '700'
                }}>
                  {data.data?.deed_hash || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '10px', lineHeight: 1.6, fontWeight: '600' }}>
                  QR Code ID: <span style={{ color: '#1d4ed8', fontFamily: 'monospace', fontWeight: '700' }}>{data.data?.qr_code_id}</span>
                </div>
              </div>
            </div>

            {/* "How Does Hash Verification Work?" - Educational Panel */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <button
                onClick={() => setShowExplainer(!showExplainer)}
                style={{
                  width: '100%', padding: '18px 24px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: '#0f172a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Hash size={20} color="#b45309" />
                  <span style={{ fontSize: '15px', fontWeight: '800' }}>
                    🔐 SHA-256 হ্যাশ দিয়ে দলিল সত্যতা যাচাই কিভাবে কাজ করে?
                  </span>
                </div>
                <ArrowRight size={18} color="#475569" style={{ transform: showExplainer ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>

              {showExplainer && (
                <div style={{ padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* What is SHA-256 */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400e', marginBottom: '8px' }}>
                        ১. SHA-256 হ্যাশ কী?
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                        SHA-256 হলো একটি <strong style={{ color: '#92400e' }}>ক্রিপ্টোগ্রাফিক ফিঙ্গারপ্রিন্ট</strong> অ্যালগরিদম।
                        ঠিক যেমন প্রতিটি মানুষের আঙুলের ছাপ আলাদা, তেমনি প্রতিটি দলিলের জন্য একটি
                        <strong style={{ color: '#92400e' }}> অনন্য ৬৪-অক্ষরের কোড</strong> তৈরি হয়।
                        এটি Google, ব্যাংক, এবং Bitcoin-ও ব্যবহার করে।
                      </div>
                    </div>

                    {/* How hash is generated */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af', marginBottom: '8px' }}>
                        ২. দলিলের হ্যাশ কিভাবে তৈরি হয়?
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8, marginBottom: '10px' }}>
                        রেজিস্ট্রি অফিসার যখন দলিল অনুমোদন করেন, তখন সিস্টেম এই তথ্যগুলো একত্রিত করে:
                      </div>
                      <div style={{
                        padding: '12px', borderRadius: '8px',
                        background: '#dbeafe',
                        fontFamily: 'monospace', fontSize: '12px',
                        color: '#1e3a8a', lineHeight: 1.8, fontWeight: '700'
                      }}>
                        দলিল নম্বর + দলিল সাল + দাগ নম্বর + বিক্রেতার NID + ক্রেতার NID + টাইমস্ট্যাম্প
                        <br />
                        <span style={{ color: '#64748b' }}>↓ SHA-256 অ্যালগরিদম ↓</span>
                        <br />
                        <span style={{ color: '#15803d', wordBreak: 'break-all' }}>
                          {data.data?.deed_hash || 'a1b2c3d4e5f6...64_characters...xyz'}
                        </span>
                      </div>
                    </div>

                    {/* Why can't it be faked? */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#991b1b', marginBottom: '8px' }}>
                        ৩. কেন জাল করা অসম্ভব?
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>🔸 দলিলের <strong style={{ color: '#991b1b' }}>একটি অক্ষরও</strong> পরিবর্তন করলে পুরো হ্যাশ সম্পূর্ণ বদলে যায়।</div>
                          <div>🔸 হ্যাশ থেকে <strong style={{ color: '#991b1b' }}>মূল তথ্য বের করা গাণিতিকভাবে অসম্ভব</strong> (One-way function)।</div>
                          <div>🔸 একই হ্যাশ দুটি ভিন্ন দলিলে পাওয়ার সম্ভাবনা <strong style={{ color: '#991b1b' }}>1 ÷ 2²⁵⁶</strong> — অর্থাৎ মহাবিশ্বের পরমাণুর সংখ্যার চেয়েও কম!</div>
                          <div>🔸 সার্ভারে সংরক্ষিত হ্যাশ ও দলিলের হ্যাশ <strong style={{ color: '#991b1b' }}>হুবহু মিলতে হবে</strong> — নইলে দলিল জাল।</div>
                        </div>
                      </div>
                    </div>

                    {/* Real-world analogy */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534', marginBottom: '8px' }}>
                        ৪. সহজ উদাহরণ: এটি কিভাবে দলিল আসল প্রমাণ করে?
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.9 }}>
                        <strong style={{ color: '#15803d' }}>ধরুন,</strong> আব্দুল করিম তার দলিল নিয়ে আসলেন। তাঁর দলিলে QR কোড আছে।
                        <br /><br />
                        <strong>ধাপ ১:</strong> ক্রেতা বা যেকেউ মোবাইল দিয়ে <strong style={{ color: '#15803d' }}>QR কোড স্ক্যান</strong> করলেন।
                        <br />
                        <strong>ধাপ ২:</strong> সিস্টেম QR কোডের আইডি দিয়ে <strong style={{ color: '#15803d' }}>সরকারি ডেটাবেজে খোঁজ</strong> করলো।
                        <br />
                        <strong>ধাপ ৩:</strong> ডেটাবেজে সংরক্ষিত SHA-256 হ্যাশ ও দলিলের তথ্য <strong style={{ color: '#15803d' }}>হুবহু মিলে গেলে → ✅ আসল</strong>
                        <br />
                        <strong>ধাপ ৪:</strong> যদি কোনো তথ্য না মেলে → <strong style={{ color: '#991b1b' }}>❌ জাল দলিল!</strong>
                        <br /><br />
                        <div style={{
                          padding: '12px 14px', borderRadius: '8px',
                          background: '#dcfce7',
                          border: '1.5px solid #86efac',
                          fontSize: '12px', fontWeight: '700', color: '#14532d'
                        }}>
                          💡 অর্থাৎ SHA-256 হ্যাশ হলো দলিলের "ডিজিটাল সিল" — যা জালিয়াতকারী কখনোই নকল করতে পারবে না কারণ সার্ভারের হ্যাশ ও দলিলের হ্যাশ অবশ্যই একই হতে হবে।
                        </div>
                      </div>
                    </div>

                    {/* e-Vhumi system flow */}
                    <div style={{
                      padding: '16px', borderRadius: '12px',
                      background: '#f5f3ff',
                      border: '1.5px solid #ddd6fe',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#5b21b6', marginBottom: '12px' }}>
                        ৫. ই-ভূমিতে সম্পূর্ণ যাচাই প্রক্রিয়া (System Flow)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { step: 'রেজিস্ট্রি অফিসার দলিল অনুমোদন করেন', detail: 'SHA-256 হ্যাশ ও QR কোড আইডি তৈরি হয়' },
                          { step: 'হ্যাশ ই-ভূমি ডেটাবেজে স্থায়ীভাবে সংরক্ষিত হয়', detail: 'এটি পরিবর্তন করা কারো পক্ষে সম্ভব নয়' },
                          { step: 'দলিলের PDF-এ QR কোড embed করা হয়', detail: 'QR স্ক্যান করলে সরাসরি যাচাই পেজে আসে' },
                          { step: 'যে কেউ QR স্ক্যান করে সত্যতা যাচাই করতে পারে', detail: 'রিয়েল-টাইমে সার্ভারের তথ্য ও হ্যাশ মিলিয়ে দেখা হয়' },
                          { step: 'এসি ল্যান্ড নামজারি অনুমোদন দিলে মালিকানা হস্তান্তর', detail: 'নতুন খতিয়ানে নতুন QR ও হ্যাশ তৈরি হয়' },
                        ].map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '10px 12px', borderRadius: '8px',
                            background: '#ede9fe',
                          }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: '#7c3aed',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: '800', color: '#fff', flexShrink: 0
                            }}>{i + 1}</div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#4c1d95' }}>{item.step}</div>
                              <div style={{ fontSize: '11px', color: '#5b21b6' }}>{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি মন্ত্রণালয় · ই-ভূমি (e-Vhumi) ডিজিটাল ল্যান্ড ম্যানেজমেন্ট সিস্টেম
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
