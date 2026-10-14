import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, FileText, CheckCircle, Clock, AlertTriangle, Search, Shield, Phone, Mail, Award } from 'lucide-react';
import P5CitizenVerify from './P5CitizenVerify';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lands'); // 'lands' | 'profile' | 'verify'
  const [landData, setLandData] = useState({
    active_lands: [],
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

  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px' }}>
    <div style={{ maxWidth: '1280px', margin: '30px auto', padding: '0 24px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{
        padding: '24px 30px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        borderLeft: '4px solid #22c55e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #166534, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            👤
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                {user?.name}
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#86efac',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: '700'
              }}>
                নাগরিক (Citizen User)
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
              জাতীয় পরিচয়পত্র: <strong style={{ color: '#cbd5e1' }}>{user?.nid}</strong> | ঠিকানা: {user?.upazila}, {user?.district}
            </p>
          </div>
        </div>

        {/* Quick stat */}
        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>
              {landData.active_lands.length}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>অনুমোদিত জমি</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>
              {landData.pending_assignments.length}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>পর্যালোচনাধীন</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => setActiveTab('lands')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: activeTab === 'lands' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
            border: activeTab === 'lands' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
            color: activeTab === 'lands' ? '#86efac' : '#94a3b8',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={16} /> আমার অনুমোদিত জমি ({landData.active_lands.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: activeTab === 'profile' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
            border: activeTab === 'profile' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
            color: activeTab === 'profile' ? '#86efac' : '#94a3b8',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={16} /> নাগরিক প্রোফাইল (Read-only)
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: activeTab === 'verify' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
            border: activeTab === 'verify' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
            color: activeTab === 'verify' ? '#86efac' : '#94a3b8',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Search size={16} /> P5 নাগরিক জমি যাচাই
        </button>
      </div>

      {/* TAB 1: Assigned Lands */}
      {activeTab === 'lands' && (
        <div>
          {/* Pending assignments notice */}
          {landData.pending_assignments.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>
                <Clock size={18} /> এসি ল্যান্ড অফিসে পর্যালোচনায় অপেক্ষমান জমি বরাদ্দ ({landData.pending_assignments.length}টি)
              </div>
              <p style={{ color: '#d1d5db', fontSize: '13px', marginBottom: '12px' }}>
                সাব-রেজিস্ট্রি অফিস থেকে আপনার নামে জমি বরাদ্দের আবেদন পাঠানো হয়েছে। সহকারী কমিশনার (ভূমি) অনুমোদন করলেই জমিটি আপনার স্থায়ী মালিকানায় যুক্ত হবে।
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {landData.pending_assignments.map((req) => (
                  <div key={req._id} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fef3c7' }}>
                      মৌজা: {req.mouza} | দাগ: {req.dag_no} | খতিয়ান: {req.khatian_no}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      পরিমাণ: {req.area_decimal} শতক | ভলিউম: {req.volume_book} | পৃষ্ঠা: {req.page_no}
                    </div>
                    <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px', fontWeight: '600' }}>
                      ⏳ স্ট্যাটাস: এসি ল্যান্ড রিভিউ পেন্ডিং
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Lands approved by AC Land */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#22c55e" /> এসি ল্যান্ড কর্তৃক অনুমোদিত ও মিউটেটেড জমি
              </h2>
              <button onClick={fetchAssignedLands} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                রিফ্রেশ করুন
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>তথ্য লোড হচ্ছে...</div>
            ) : landData.active_lands.length === 0 ? (
              <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
                <div style={{ fontSize: '42px', marginBottom: '14px' }}>🏜️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
                  বর্তমানে কোনো অনুমোদিত জমি পাওয়া যায়নি
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '500px', margin: '0 auto' }}>
                  সাব-রেজিস্ট্রি অফিস থেকে আপনার এনআইডি ({user?.nid}) দিয়ে জমি বরাদ্দ পাঠানো হলে এবং এসি ল্যান্ড তা অনুমোদন করলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {landData.active_lands.map((land) => (
                  <div key={land._id} className="glass-card" style={{ padding: '22px', borderTop: '3px solid #22c55e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#86efac',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        fontWeight: '700'
                      }}>
                        ✅ অনুমোদিত ও সক্রিয় (Active)
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        ID: {land.record_id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '12px' }}>
                      দাগ নং: {land.dag_no} | খতিয়ান নং: {land.khatian_no}
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      marginBottom: '14px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>মৌজা:</span>{' '}
                        <strong style={{ color: '#e2e8f0' }}>{land.mouza}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>জে.এল নং:</span>{' '}
                        <strong style={{ color: '#e2e8f0' }}>{land.jl_no}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>বিভাগ ও জেলা:</span>{' '}
                        <strong style={{ color: '#e2e8f0' }}>{land.division || 'ঢাকা'}, {land.district || 'ঢাকা'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>উপজেলা:</span>{' '}
                        <strong style={{ color: '#e2e8f0' }}>{land.upazila || 'ধানমন্ডি'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>মোট জমি:</span>{' '}
                        <strong style={{ color: '#22c55e', fontSize: '13px' }}>{land.total_area_decimal} শতক</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>ব্যবহারযোগ্য:</span>{' '}
                        <strong style={{ color: '#22c55e', fontSize: '13px' }}>{land.available_area_decimal} শতক</strong>
                      </div>
                    </div>

                    {/* Registry details */}
                    <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>দলিল / ভলিউম তথ্য:</span>
                        <strong style={{ color: '#cbd5e1' }}>
                          ভলিউম: {land.volume_book || 'VOL-2024'} | পৃষ্ঠা: {land.page_no || '১ম'}
                        </strong>
                      </div>
                      {land.deed_no && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>দলিল নম্বর:</span>
                          <strong style={{ color: '#86efac' }}>{land.deed_no}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Read-Only Citizen Profile */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: '36px', maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #166534, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Award size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                জাতীয় নাগরিক প্রোফাইল (শুধুমাত্র দর্শনযোগ্য)
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                জাতীয় ডাটাবেজে সংরক্ষিত আপনার স্থায়ী নাগরিক বিবরণ
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>পুরো নাম</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{user?.name}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>জাতীয় পরিচয়পত্র (NID)</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#22c55e', fontFamily: 'monospace' }}>{user?.nid}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>পিতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>{user?.father_name || 'জালাল উদ্দিন'}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>মাতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>{user?.mother_name || 'আমেনা খাতুন'}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>বিভাগ ও জেলা</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>{user?.division}, {user?.district}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>উপজেলা / থানা</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>{user?.upazila}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>মোবাইল নম্বর</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#64748b" /> {user?.phone}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>ইমেইল ঠিকানা</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#64748b" /> {user?.email}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '28px',
            padding: '14px 20px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Shield size={18} /> নাগরিকের প্রোফাইল তথ্য সিস্টেম সিকিউরিটির স্বার্থে শুধুমাত্র দর্শনযোগ্য (Read-only)। সংশোধনের জন্য সংশ্লিষ্ট উপজেলা ভূমি অফিস অথবা মন্ত্রণালয়ে যোগাযোগ করুন।
          </div>
        </div>
      )}

      {/* TAB 3: Embedded P5 Land Verification */}
      {activeTab === 'verify' && (
        <div>
          <P5CitizenVerify />
        </div>
      )}
    </div>
    </div>
  );
}
