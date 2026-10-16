import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, MapPin, FileText, CheckCircle, Clock, 
  AlertTriangle, Search, Shield, Phone, Mail, Award,
  RefreshCw, Check, ArrowRight
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import P5CitizenVerify from './P5CitizenVerify';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lands'); // 'lands' | 'pending' | 'sold' | 'profile' | 'verify'
  const [landData, setLandData] = useState({
    active_lands: [],
    sold_lands: [],
    approved_assignments: [],
    pending_assignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignedLands();
  }, []);

  const fetchAssignedLands = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/assigned-lands');
      if (res.data.success) {
        setLandData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching user lands:', err);
      setError('জমির তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { 
      id: 'lands', 
      label: 'আমার অনুমোদিত জমি', 
      icon: FileText, 
      badge: landData.active_lands.length,
      badgeColor: '#065f46',
      badgeBg: '#dcfce7'
    },
    { 
      id: 'pending', 
      label: 'পর্যালোচনাধীন আবেদন', 
      icon: Clock, 
      badge: landData.pending_assignments.length,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7'
    },
    { 
      id: 'sold', 
      label: 'বিক্রিত জমির ইতিহাস', 
      icon: AlertTriangle, 
      badge: landData.sold_lands.length,
      badgeColor: '#b91c1c',
      badgeBg: '#fee2e2'
    },
    { 
      id: 'verify', 
      label: 'জমি ও খতিয়ান যাচাই', 
      icon: Search 
    },
    { 
      id: 'profile', 
      label: 'নাগরিক প্রোফাইল', 
      icon: User 
    },
  ];

  const stats = [
    { label: 'অনুমোদিত জমি', value: landData.active_lands.length, color: '#047857' },
    { label: 'পর্যালোচনাধীন', value: landData.pending_assignments.length, color: '#b45309' },
    { label: 'হস্তান্তরিত জমি', value: landData.sold_lands.length, color: '#dc2626' },
  ];

  return (
    <DashboardLayout
      title="নাগরিক ড্যাশবোর্ড"
      subtitle={`স্বাগতম, ${user?.name || 'নাগরিক'} | জাতীয় পরিচয়পত্র: ${user?.nid || 'N/A'} | ঠিকানা: ${user?.upazila || ''}, ${user?.district || ''}`}
      badge={{ label: 'নাগরিক পোর্টাল' }}
      icon={User}
      roleTheme="green"
      stats={stats}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <button
          onClick={fetchAssignedLands}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: '700',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            color: '#0f172a',
            borderRadius: '10px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>রিফ্রেশ</span>
        </button>
      }
    >
      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1.5px solid #fca5a5',
          color: '#991b1b',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── TAB 1: Approved Active Lands ──────────────────────── */}
      {activeTab === 'lands' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <CheckCircle size={20} color="#047857" />
                এসি ল্যান্ড কর্তৃক অনুমোদিত ও মিউটেটেড জমি ({landData.active_lands.length}টি)
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
                এই জমিগুলোর বৈধ খতিয়ান আপনার নামে নিবন্ধিত রয়েছে এবং আপনি বিক্রয় বা হস্তান্তর করতে পারবেন।
              </p>
            </div>
          </div>

          {loading ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#047857' }} />
              <div style={{ fontSize: '15px', fontWeight: '700' }}>জমির তথ্য লোড হচ্ছে...</div>
            </div>
          ) : landData.active_lands.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🌾</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                বর্তমানে কোনো অনুমোদিত জমি পাওয়া যায়নি
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
                সাব-রেজিস্ট্রি অফিস থেকে আপনার এনআইডি ({user?.nid}) দ্বারা জমি বরাদ্দ পাঠানো হলে এবং এসি ল্যান্ড অফিস কর্তৃক অনুমোদন সম্পন্ন হলে তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {landData.active_lands.map((land) => (
                <div
                  key={land._id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderTop: '4px solid #059669',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#047857',
                      border: '1px solid #86efac',
                      fontWeight: '800'
                    }}>
                      ✅ অনুমোদিত ও সক্রিয় (Active)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>
                      রেকর্ড ID: {land.record_id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                    দাগ নং: <span style={{ color: '#047857' }}>{land.dag_no}</span> | খতিয়ান নং: <span style={{ color: '#047857' }}>{land.khatian_no}</span>
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>মৌজা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.mouza}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>জে.এল নং:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.jl_no}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>জেলা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.district || 'বগুড়া'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>উপজেলা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.upazila || 'শিবগঞ্জ'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>মোট পরিমাণ:</span>{' '}
                      <strong style={{ color: '#047857', fontSize: '13px' }}>{land.total_area_decimal} শতক</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>অবশিষ্ট ব্যবহার্য:</span>{' '}
                      <strong style={{ color: '#047857', fontSize: '13px' }}>{land.available_area_decimal} শতক</strong>
                    </div>
                  </div>

                  {/* Registry details */}
                  <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>ভলিউম ও পৃষ্ঠা:</span>
                      <strong style={{ color: '#0f172a' }}>
                        ভলিউম: {land.volume_book || 'VOL-2024'} | পৃষ্ঠা: {land.page_no || '১ম'}
                      </strong>
                    </div>
                    {land.deed_no && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>দলিল নম্বর:</span>
                        <strong style={{ color: '#047857' }}>{land.deed_no}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Pending Assignments in Review ──────────────── */}
      {activeTab === 'pending' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={20} color="#b45309" />
              এসি ল্যান্ড অফিসে পর্যালোচনায় অপেক্ষমান জমি বরাদ্দ ({landData.pending_assignments.length}টি)
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
              সাব-রেজিস্ট্রি অফিস থেকে আপনার নামে জমি বরাদ্দের আবেদন পাঠানো হয়েছে। সহকারী কমিশনার (ভূমি) অনুমোদন করলেই জমিটি আপনার চূড়ান্ত মালিকানায় আসবে।
            </p>
          </div>

          {landData.pending_assignments.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>⏳</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                বর্তমানে কোনো অপেক্ষমান বরাদ্দ আবেদন নেই
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
                আপনার নামে নতুন কোনো জমির আবেদন সাব-রেজিস্ট্রি কর্তৃক সাবমিট করা হলে তা এখানে পেন্ডিং হিসেবে ট্র্যাক করতে পারবেন।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {landData.pending_assignments.map((req) => (
                <div
                  key={req._id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderTop: '4px solid #d97706',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      fontWeight: '800'
                    }}>
                      ⏳ এসি ল্যান্ড রিভিউ পেন্ডিং
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      {req.mouza}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                    দাগ নং: {req.dag_no} | খতিয়ান নং: {req.khatian_no}
                  </h3>

                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '12px',
                    color: '#92400e'
                  }}>
                    <div>পরিমাণ: <strong>{req.area_decimal} শতক</strong></div>
                    <div style={{ marginTop: '4px' }}>ভলিউম: <strong>{req.volume_book}</strong> | পৃষ্ঠা: <strong>{req.page_no}</strong></div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    আবেদন দাখিলের সময়: {req.created_at ? new Date(req.created_at).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Sold Lands History ─────────────────────────── */}
      {activeTab === 'sold' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <AlertTriangle size={20} color="#dc2626" />
              আপনার ইতিপূর্বে বিক্রিত ও হস্তান্তরিত জমির ইতিহাস ({landData.sold_lands.length}টি)
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
              নিরাপত্তা ও অ্যান্টি-ডাবল সেলিং প্রটোকল অনুসারে এই জমিগুলো ইতিপূর্বে বিক্রয় সম্পন্ন হয়েছে। এগুলো পুনরায় বিক্রয়যোগ্য নয়।
            </p>
          </div>

          {landData.sold_lands.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📜</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                কোনো বিক্রিত জমির রেকর্ড নেই
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
                আপনি ইতিপূর্বে কোনো জমি সাব-রেজিস্ট্রির মাধ্যমে হস্তান্তর বা বিক্রয় করেননি।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {landData.sold_lands.map((land) => (
                <div
                  key={land._id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderTop: '4px solid #ef4444',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      fontWeight: '800'
                    }}>
                      🚫 হস্তান্তরিত / বিক্রিত (Sold)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      মৌজা: <strong style={{ color: '#0f172a' }}>{land.mouza}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    দাগ নং: {land.dag_no} | খতিয়ান নং: {land.khatian_no}
                  </h3>

                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '10px',
                    color: '#991b1b'
                  }}>
                    <div>বিক্রিত পরিমাণ: <strong>{land.sold_area || land.total_area_decimal} শতক</strong></div>
                    <div style={{ marginTop: '4px' }}>নতুন ক্রেতা: <strong>{land.buyer_name || 'নতুন স্বত্বাধিকারী'}</strong></div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                    🔒 এই জমিটি হস্তান্তর সম্পন্ন হয়েছে। পুরোনো মালিক হিসেবে আর বিক্রয়যোগ্য নয়।
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Public & Citizen Land Verification ─────────── */}
      {activeTab === 'verify' && (
        <div className="glass-card" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
          <P5CitizenVerify />
        </div>
      )}

      {/* ── TAB 5: Read-Only Citizen Profile ──────────────────── */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: '32px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #065f46, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(6, 95, 70, 0.25)'
            }}>
              <Award size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                জাতীয় নাগরিক প্রোফাইল (দর্শনযোগ্য)
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
                জাতীয় কেন্দ্রীয় ডাটাবেজে সংরক্ষিত আপনার স্থায়ী নাগরিক পরিচিতি
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>পুরো নাম</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{user?.name || 'নাগরিক নাম'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>জাতীয় পরিচয়পত্র (NID)</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#047857', fontFamily: 'monospace' }}>{user?.nid}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>পিতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.father_name || 'জালাল উদ্দিন'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>মাতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.mother_name || 'আমেনা খাতুন'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>বিভাগ ও জেলা</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.division || 'রাজশাহী'}, {user?.district || 'বগুড়া'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>উপজেলা / সার্কেল</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.upazila || 'শিবগঞ্জ'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>মোবাইল নম্বর</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#047857" /> {user?.phone || '০১৭xxxxxxxx'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>ইমেইল ঠিকানা</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#0284c7" /> {user?.email}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '28px',
            padding: '16px 20px',
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            lineHeight: 1.5
          }}>
            <Shield size={20} style={{ flexShrink: 0 }} />
            <span>
              নাগরিকের প্রোফাইল তথ্য সিস্টেম নিরাপত্তার স্বার্থে শুধুমাত্র দর্শনযোগ্য (Read-only)। সংশোধনের জন্য সংশ্লিষ্ট উপজেলা ভূমি অফিস অথবা মন্ত্রণালয়ে যোগাযোগ করুন।
            </span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
