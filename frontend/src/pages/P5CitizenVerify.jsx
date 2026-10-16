import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, 
  MapPin, UserCheck, Layers, Hash, FileText, Check, Lock, Info, XCircle
} from 'lucide-react';

export default function P5CitizenVerify() {
  const [searchForm, setSearchForm] = useState({
    seller_nid: '',
    dag_no: '',
    mouza: '',
    requested_area: ''
  });

  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [landRecord, setLandRecord] = useState(null);
  const [alertData, setAlertData] = useState(null);

  // Dynamic Mouza List from database
  const [mouzasList, setMouzasList] = useState([]);
  const [mouzaLoading, setMouzaLoading] = useState(false);

  useEffect(() => {
    fetchMouzas();
  }, []);

  const fetchMouzas = async () => {
    setMouzaLoading(true);
    try {
      const res = await axios.get('/api/mouzas');
      if (res.data?.success && Array.isArray(res.data.mouzas) && res.data.mouzas.length > 0) {
        setMouzasList(res.data.mouzas);
      } else {
        setMouzasList(['গুজিয়া', 'অনন্তবালা', 'চক অনন্তবালা', 'কিচক', 'বেলাই', 'হরিপুর', 'চক হরিপুর', 'বিশা', 'কানাইডাঙ্গা', 'সর্দারপাড়া', 'জানগ্রাম', 'রামচন্দ্রপুর', 'ধাওয়া', 'চক ধাওয়া', 'চণ্ডীহারা', 'চক চণ্ডীহারা', 'করতকোলা', 'শোলাগাড়ী', 'বুড়িগঞ্জ', 'সাদুল্লাপুর']);
      }
    } catch (err) {
      console.warn('Could not load mouzas dynamically, applying fallback list:', err);
      setMouzasList(['গুজিয়া', 'অনন্তবালা', 'চক অনন্তবালা', 'কিচক', 'বেলাই', 'হরিপুর', 'চক হরিপুর', 'বিশা', 'কানাইডাঙ্গা', 'সর্দারপাড়া', 'জানগ্রাম', 'রামচন্দ্রপুর', 'ধাওয়া', 'চক ধাওয়া', 'চণ্ডীহারা', 'চক চণ্ডীহারা', 'করতকোলা', 'শোলাগাড়ী', 'বুড়িগঞ্জ', 'সাদুল্লাপুর']);
    } finally {
      setMouzaLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchForm.seller_nid?.trim() || !searchForm.dag_no?.trim() || !searchForm.mouza?.trim()) {
      setSearchError('অনুগ্রহ করে বিক্রেতার NID নম্বর, দাগ নম্বর এবং মৌজা — এই ৩টি তথ্যই প্রদান করুন (৩টি ফিল্ডই আবশ্যক)।');
      return;
    }

    setLoading(true);
    setSearchError('');
    setLandRecord(null);
    setAlertData(null);

    try {
      // Connect to unified live Anti-Double Selling & Land Verification Engine
      const res = await axios.post('/api/verify-deed', {
        seller_nid: searchForm.seller_nid?.trim(),
        dag_no: searchForm.dag_no?.trim(),
        mouza: searchForm.mouza?.trim(),
        requested_area: searchForm.requested_area || '1'
      });

      if (res.data) {
        if (!res.data.success) {
          setAlertData(res.data);
          setLandRecord(null);
        } else {
          setLandRecord(res.data.record);
          setAlertData(null);
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে। অনুগ্রহ করে সার্ভার সংযোগ চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchForm({
      seller_nid: '',
      dag_no: '',
      mouza: '',
      requested_area: ''
    });
    setLandRecord(null);
    setAlertData(null);
    setSearchError('');
  };

  return (
    <div style={{ color: '#0f172a', maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 40px' }}>
      {/* Top Header Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderLeft: '5px solid #2563eb',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '26px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}>
              <ShieldCheck size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
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
                  নাগরিক ও উন্মুক্ত পোর্টাল (Public Verification Engine)
                </span>
              </div>
              <p style={{ color: '#334155', fontSize: '13px', margin: '4px 0 0 0' }}>
                জমি কেনার পূর্বে বিক্রেতার বৈধ মালিকানা, আদালতের মামলা, স্থগিতাদেশ (Stay Order) ও ডাবল-সেলিং ঝুঁকি লাইভ যাচাই করুন
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Search Form | Right Verification Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(360px, 1fr)', gap: '24px' }}>
        
        {/* Left Column: Search Form */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#2563eb" />
            জমির তথ্য অনুসন্ধান ও যাচাইকরণ
          </h3>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: 1998567890123"
                value={searchForm.seller_nid}
                onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
              />
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '3px', display: 'block', fontWeight: '500' }}>
                বিক্রেতার দেওয়া NID দিন যাতে ভুয়া মালিকানা (Fake Owner) শনাক্ত করা যায়
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                  দাগ নম্বর (Plot No) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: ১০১"
                  value={searchForm.dag_no}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dag_no: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                  মৌজার নাম নির্বাচন করুন <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={searchForm.mouza}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, mouza: e.target.value }))}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#ffffff',
                    height: '42px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0 10px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">{mouzaLoading ? 'মৌজা লোড হচ্ছে...' : '-- মৌজা নির্বাচন করুন --'}</option>
                  {mouzasList.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                প্রস্তাবিত ক্রয়ের পরিমাণ (শতক - ঐচ্ছিক)
              </label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="যেমন: ৫"
                value={searchForm.requested_area}
                onChange={(e) => setSearchForm(prev => ({ ...prev, requested_area: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Search size={16} />
                {loading ? 'যাচাই করা হচ্ছে...' : '🔍 জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'}
              </button>

              {(landRecord || alertData || searchError) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                  style={{ padding: '12px 18px', fontSize: '13px', fontWeight: '700', background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#0f172a' }}
                >
                  রিসেট
                </button>
              )}
            </div>
          </form>

          {/* Validation Error Message */}
          {searchError && (
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              ⚠️ {searchError}
            </div>
          )}

          {/* Educational Notice */}
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#1e293b',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: '800', color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> এই ইঞ্জিন কী কী স্বয়ংক্রিয়ভাবে পরীক্ষা করে:
            </div>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li><strong>আদালতের মামলা ও Stay Order:</strong> জমিতে কোনো নিষেধাজ্ঞা বলবৎ আছে কি না।</li>
              <li><strong>অ্যান্টি-ডাবল সেলিং:</strong> জমিটির অন্য কোনো চলমান নামজারি বা দলিল প্রক্রিয়াধীন কি না।</li>
              <li><strong>মালিকের এনআইডি বৈধতা:</strong> বিক্রেতা প্রকৃত মালিক কি না।</li>
              <li><strong>সরকারি খাস জমি:</strong> জমিটি ১নং খতিয়ানের খাস জমি কি না।</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Verification Results */}
        <div>
          {/* Default Empty State */}
          {!loading && !landRecord && !alertData && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Search size={32} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                ফলাফল দেখার অপেক্ষায়
              </h4>
              <p style={{ color: '#475569', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6, margin: 0, fontWeight: '500' }}>
                বাম পাশের ফর্মে দাগ নম্বর ও মৌজার নাম লিখে <strong>'জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'</strong> বাটনে ক্লিক করলে লাইভ আইনি ও নিবন্ধন স্ট্যাটাস প্রদর্শিত হবে।
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '3px solid #bfdbfe',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d4ed8' }}>
                ডেটাবেজ ও ভূমি আইনি রেকর্ড যাচাই করা হচ্ছে...
              </div>
            </div>
          )}

          {/* Alert View (Court Case, Stay Order, Double Selling, Fake Owner, Khas Land, etc.) */}
          {alertData && (
            <div style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 6px 24px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldAlert size={28} color="#dc2626" />
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#991b1b', margin: 0 }}>
                    {alertData.alert_type === 'COURT_CASE_STAY_ORDER' ? '⛔ আদালতীয় মামলা ও স্থগিতাদেশ সতর্কতা (Stay Order Alert)' :
                     alertData.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' :
                     alertData.alert_type === 'FAKE_OWNER' ? '🚨 জালিয়াতি সতর্কতা (Fake Owner Detected)' :
                     alertData.alert_type === 'UNASSIGNED_LAND' ? '⚠️ সরকারি খাস জমি সতর্কতা (Unassigned Land)' :
                     alertData.alert_type === 'ALREADY_SOLD' ? '🚫 পূর্বেই বিক্রিত জমি (Already Sold)' :
                     alertData.alert_type === 'NOT_FOUND' ? '🔍 রেকর্ড পাওয়া যায়নি (Record Not Found)' :
                     '⚠️ ভূমি রেকর্ড যাচাইকরণ সতর্কতা'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700' }}>
                    {alertData.alert_type === 'NOT_FOUND' ? 'যাচাইকরণের ফলাফল: কোনো সঠিক মালিকানা তথ্য পাওয়া যায়নি' : 'আইনি সিদ্ধান্ত: এই জমিটি কেনা অথবা বায়না করা ঝুঁকিপূর্ণ / সম্পূর্ণ নিষিদ্ধ'}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1.5px solid #fca5a5',
                color: '#7f1d1d',
                fontSize: '13px',
                lineHeight: 1.6,
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                {alertData.message}
              </div>

              {alertData.court_case && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '12px',
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid #fca5a5',
                  color: '#7f1d1d'
                }}>
                  <div>মামলা সংক্রান্ত অবস্থা: <strong style={{ color: '#991b1b' }}>{alertData.court_case.has_court_case ? 'সক্রিয় মোকদ্দমা' : 'মামলামুক্ত'}</strong></div>
                  <div>স্থগিতাদেশ (Stay Order): <strong style={{ color: alertData.court_case.stay_order ? '#dc2626' : '#166534' }}>{alertData.court_case.stay_order ? 'বলবৎ আছে' : 'নেই'}</strong></div>
                  {alertData.court_case.case_details && (
                    <div style={{ gridColumn: 'span 2', marginTop: '4px', color: '#b45309', fontWeight: '700' }}>
                      কেস রেফারেন্স: {alertData.court_case.case_details}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Verified Land Card (Safe To Buy) */}
          {landRecord && !alertData && (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 6px 24px rgba(34, 197, 94, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={28} color="#16a34a" />
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#166534', margin: 0 }}>
                      🟢 জমি বৈধ, নিরাপদ ও ক্রয়যোগ্য
                    </h4>
                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                      100% Verified Safe Land · কোনো ডাবল-সেলিং বা মামলা নেই
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#dcfce7',
                  color: '#166534',
                  fontWeight: '700',
                  border: '1px solid #86efac'
                }}>
                  স্ট্যাটাস: {landRecord.status} (Active)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px', color: '#1e293b', marginBottom: '16px' }}>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>মৌজা:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.mouza}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>দাগ নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.dag_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>খতিয়ান নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.khatian_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>জে.এল নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.jl_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>বর্তমান মালিক:</span>
                  <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>{landRecord.owner_name}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>মালিকের NID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '13px' }}>{landRecord.owner_nid}</strong>
                </div>
                <div style={{
                  gridColumn: 'span 2',
                  background: '#dcfce7',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#166534', fontWeight: '700' }}>মোট বিক্রয়যোগ্য পরিমাণ:</span>
                  <strong style={{ color: '#15803d', fontSize: '16px' }}>
                    {landRecord.available_area_decimal || landRecord.total_area_decimal} শতক
                  </strong>
                </div>
              </div>

              {/* Verified Checklist */}
              <div style={{
                background: '#ffffff',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #86efac',
                fontSize: '12px'
              }}>
                <div style={{ color: '#166534', fontWeight: '800', marginBottom: '6px' }}>
                  যাচাইকরণ ফলাফল রিপোর্ট:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#1e293b', fontWeight: '500' }}>
                  <div>✓ আদালতের কোনো মামলা বা স্থগিতাদেশ (Stay Order) নেই।</div>
                  <div>✓ কোনো পেন্ডিং নামজারি বা ডাবল-সেলিং প্রক্রিয়া চলমান নেই।</div>
                  <div>✓ প্রদত্ত বিক্রেতার NID ও মালিকানার তথ্য ম্যাচ করেছে।</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
