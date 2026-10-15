import { useState } from 'react';
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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchForm.dag_no?.trim() || !searchForm.mouza?.trim()) {
      setSearchError('অনুগ্রহ করে দাগ নম্বর এবং মৌজার নাম দিন।');
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
    <div style={{ color: '#f8fafc', maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 40px' }}>
      {/* Top Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '26px',
        boxShadow: '0 10px 32px rgba(0, 0, 0, 0.25)'
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
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#86efac',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontWeight: '700'
                }}>
                  নাগরিক ও উন্মুক্ত পোর্টাল (Public Verification Engine)
                </span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '4px 0 0 0' }}>
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
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#60a5fa" />
            জমির তথ্য অনুসন্ধান ও যাচাইকরণ
          </h3>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="যেমন: 1998567890123"
                value={searchForm.seller_nid}
                onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#f8fafc' }}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                বিক্রেতার দেওয়া NID দিন যাতে ভুয়া মালিকানা (Fake Owner) শনাক্ত করা যায়
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                  দাগ নম্বর (Plot No) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: ১০১"
                  value={searchForm.dag_no}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dag_no: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                  মৌজার নাম <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: গুজিয়া"
                  value={searchForm.mouza}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, mouza: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#f8fafc' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                প্রস্তাবিত ক্রয়ের পরিমাণ (শতক - ঐচ্ছিক)
              </label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="যেমন: ৫"
                value={searchForm.requested_area}
                onChange={(e) => setSearchForm(prev => ({ ...prev, requested_area: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#f8fafc' }}
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
                  style={{ padding: '12px 18px', fontSize: '13px', fontWeight: '600' }}
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
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '13px'
            }}>
              ⚠️ {searchError}
            </div>
          )}

          {/* Educational Notice */}
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#cbd5e1',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: '700', color: '#93c5fd', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Search size={32} color="#60a5fa" />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#f8fafc', margin: '0 0 8px 0' }}>
                ফলাফল দেখার অপেক্ষায়
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>
                বাম পাশের ফর্মে দাগ নম্বর ও মৌজার নাম লিখে <strong>'জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'</strong> বাটনে ক্লিক করলে লাইভ আইনি ও নিবন্ধন স্ট্যাটাস প্রদর্শিত হবে।
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
                border: '3px solid rgba(59, 130, 246, 0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#93c5fd' }}>
                ডেটাবেজ ও ভূমি আইনি রেকর্ড যাচাই করা হচ্ছে...
              </div>
            </div>
          )}

          {/* Alert View (Court Case, Stay Order, Double Selling, Fake Owner, Khas Land, etc.) */}
          {alertData && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1.5px solid #ef4444',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldAlert size={28} color="#f87171" />
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#fca5a5', margin: 0 }}>
                    {alertData.alert_type === 'COURT_CASE_STAY_ORDER' ? '⛔ আদালতীয় মামলা ও স্থগিতাদেশ সতর্কতা (Stay Order Alert)' :
                     alertData.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' :
                     alertData.alert_type === 'FAKE_OWNER' ? '🚨 জালিয়াতি সতর্কতা (Fake Owner Detected)' :
                     alertData.alert_type === 'UNASSIGNED_LAND' ? '⚠️ সরকারি খাস জমি সতর্কতা (Unassigned Land)' :
                     alertData.alert_type === 'ALREADY_SOLD' ? '🚫 পূর্বেই বিক্রিত জমি (Already Sold)' :
                     '⚠️ ভূমি রেকর্ড যাচাইকরণ সতর্কতা'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#fecaca', fontWeight: '600' }}>
                    আইনি সিদ্ধান্ত: এই জমিটি কেনা অথবা বায়না করা ঝুঁকিপূর্ণ / সম্পূর্ণ নিষিদ্ধ
                  </span>
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fee2e2',
                fontSize: '13px',
                lineHeight: 1.6,
                marginBottom: '16px'
              }}>
                {alertData.message}
              </div>

              {alertData.court_case && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>মামলা সংক্রান্ত অবস্থা: <strong style={{ color: '#fca5a5' }}>{alertData.court_case.has_court_case ? 'সক্রিয় মোকদ্দমা' : 'মামলামুক্ত'}</strong></div>
                  <div>স্থগিতাদেশ (Stay Order): <strong style={{ color: alertData.court_case.stay_order ? '#ef4444' : '#86efac' }}>{alertData.court_case.stay_order ? 'বলবৎ আছে' : 'নেই'}</strong></div>
                  {alertData.court_case.case_details && (
                    <div style={{ gridColumn: 'span 2', marginTop: '4px', color: '#fde047' }}>
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
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1.5px solid rgba(34, 197, 94, 0.45)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={28} color="#22c55e" />
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#86efac', margin: 0 }}>
                      🟢 জমি বৈধ, নিরাপদ ও ক্রয়যোগ্য
                    </h4>
                    <span style={{ fontSize: '11px', color: '#bbf7d0', fontWeight: '600' }}>
                      100% Verified Safe Land · কোনো ডাবল-সেলিং বা মামলা নেই
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.25)',
                  color: '#86efac',
                  fontWeight: '700',
                  border: '1px solid rgba(34, 197, 94, 0.5)'
                }}>
                  স্ট্যাটাস: {landRecord.status} (Active)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>মৌজা:</span>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{landRecord.mouza}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>দাগ নম্বর:</span>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{landRecord.dag_no}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>খতিয়ান নম্বর:</span>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{landRecord.khatian_no}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>জে.এল নম্বর:</span>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{landRecord.jl_no}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>বর্তমান মালিক:</span>
                  <strong style={{ color: '#38bdf8', fontSize: '14px' }}>{landRecord.owner_name}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>মালিকের NID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#f8fafc', fontSize: '13px' }}>{landRecord.owner_nid}</strong>
                </div>
                <div style={{
                  gridColumn: 'span 2',
                  background: 'rgba(34, 197, 94, 0.12)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#86efac', fontWeight: '600' }}>মোট বিক্রয়যোগ্য পরিমাণ:</span>
                  <strong style={{ color: '#4ade80', fontSize: '16px' }}>
                    {landRecord.available_area_decimal || landRecord.total_area_decimal} শতক
                  </strong>
                </div>
              </div>

              {/* Verified Checklist */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px'
              }}>
                <div style={{ color: '#86efac', fontWeight: '700', marginBottom: '6px' }}>
                  যাচাইকরণ ফলাফল রিপোর্ট:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
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
