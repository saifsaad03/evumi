import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, Search, ArrowRight, CheckCircle, Lock, Zap,
  LogIn, UserPlus, Database, MapPin, FileText, Star,
  ChevronRight, Globe, Award, TrendingUp, Sparkles, Check, PhoneCall,
  ShieldCheck, ShieldAlert, AlertTriangle
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
  { val: '৯টি', label: 'সিড মৌজা', sub: 'শিবগঞ্জ উপজেলা পাইলট', icon: '📍', color: '#047857', bg: '#ecfdf5' },
  { val: '৪টি', label: 'সিস্টেম ভূমিকা', sub: 'নাগরিক, সাব-রেজিস্ট্রি, এসি ল্যান্ড, এডমিন', icon: '🏛️', color: '#0369a1', bg: '#f0f9ff' },
  { val: 'SHA-256', label: 'দলিল ক্রিপ্টোগ্রাফি', sub: 'ভুয়া দলিল শতভাগ প্রতিরোধ', icon: '🛡️', color: '#7c3aed', bg: '#f5f3ff' },
  { val: 'QR কোড', label: 'ডিজিটাল ই-খতিয়ান', sub: 'স্মার্টফোনে তাৎক্ষণিক যাচাই', icon: '⚡', color: '#b45309', bg: '#fef3c7' },
];

const ROLES = [
  {
    role: 'নাগরিক পোর্টাল',
    subtitle: 'Citizen Services',
    icon: '👤',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    glow: 'rgba(16,185,129,0.15)',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#047857',
    desc: 'নিজস্ব মালিকানাধীন জমির খতিয়ান পর্যবেক্ষণ, কিউআর কোড স্ক্যান, এবং অনলাইনে দাখিলা ফি পরিশোধ।',
    features: ['জমির খতিয়ান তল্লাশি', 'নামজারি আবেদন স্থিতি', 'QR কোড ভেরিফিকেশন'],
  },
  {
    role: 'সাব-রেজিস্ট্রি অফিস',
    subtitle: 'Sub-Registry Officer',
    icon: '🏛️',
    gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    glow: 'rgba(2,132,199,0.15)',
    bg: '#f0f9ff',
    border: '#bae6fd',
    color: '#0369a1',
    desc: 'দলিল সম্পাদন ও যাচাই, NID বায়োমেট্রিক ক্রস-চেক, P3 জালিয়াতি শনাক্তকরণ ও এসি ল্যান্ডে বরাদ্দ প্রেরণ।',
    features: ['দলিল নিবন্ধন ও হ্যাশিং', 'P3 অ্যান্টি-ফ্রড স্ক্রিনিং', 'মালিকানা বরাদ্দ আবেদন'],
  },
  {
    role: 'সহকারী কমিশনার (ভূমি)',
    subtitle: 'AC Land Office',
    icon: '⚖️',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    glow: 'rgba(217,119,6,0.15)',
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#b45309',
    desc: 'সাব-রেজিস্ট্রি থেকে প্রেরিত দলিলের ফিল্ড রিপোর্ট যাচাই, নামজারি (ই-নামজারি) অনুমোদন ও নতুন খতিয়ান সৃষ্টি।',
    features: ['নামজারি কেস নিষ্পত্তি', 'খতিয়ান সংশোধন অনুমোদন', 'স্বয়ংক্রিয় ফি চালনা'],
  },
  {
    role: 'ভূমি মন্ত্রণালয় প্রশাসন',
    subtitle: 'Ministry Central Admin',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glow: 'rgba(124,58,237,0.15)',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    color: '#6d28d9',
    desc: 'সারাদেশের সকল ভূমি অফিসের কার্যকলাপ পর্যবেক্ষণ, নতুন কর্মকর্তা নিয়োগ, সিস্টেম ভূমিকা এবং অডিট লগ।',
    features: ['কেন্দ্রীয় কর্মকর্তা ব্যবস্থাপনা', 'সারাদেশের রিয়েলটাইম অ্যানালিটিক্স', 'নিরাপত্তা অডিট লগ'],
  },
];

const FLOW = [
  { step: '০১', icon: '📝', label: 'আবেদন দাখিল', sub: 'দলিল প্রস্তুত ও NID যাচাই', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { step: '০২', icon: '🛡️', label: 'P3 ফ্রড ফিল্টার', sub: 'SHA-256 ক্রিপ্টো যাচাই', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { step: '০৩', icon: '🔒', label: 'পেন্ডিং লক', sub: 'ডাবল-সেলিং স্বয়ংক্রিয় রোধ', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  { step: '০৪', icon: '🏛️', label: 'এসি ল্যান্ড রিভিউ', sub: 'মাঠ পর্যায়ের সত্যতা যাচাই', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  { step: '০৫', icon: '💳', label: 'অনলাইন পেমেন্ট', sub: 'সরকারি কোষাগারে ই-চালান', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { step: '০৬', icon: '📄', label: 'ডিজিটাল খতিয়ান', sub: 'QR কোডযুক্ত সনদ প্রস্তুত', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
];

const FEATURES = [
  {
    icon: <Shield size={24} />,
    title: 'জাল দলিল ও ভুয়া খতিয়ান প্রতিরোধ',
    desc: 'প্রতিটি দলিলের বিষয়বস্তু SHA-256 এনক্রিপ্টেড হ্যাশে রূপান্তরিত হয়। ফলে এক অক্ষরের গরমিলও তৎক্ষণাৎ ধরা পড়ে।',
    color: '#047857', bg: '#ecfdf5', border: '#a7f3d0',
  },
  {
    icon: <Lock size={24} />,
    title: 'ডাবল-সেলিং ও প্রতারণা বন্ধ',
    desc: 'একটি জমির দলিল প্রক্রিয়াকালে সিস্টেমে Pending Lock সক্রিয় হয়, ফলে একই জমি অন্য কারো কাছে দ্বিতীয়বার বিক্রয় অসম্ভব।',
    color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'স্বয়ংক্রিয় সমন্বিত ওয়ার্কফ্লো',
    desc: 'সাব-রেজিস্ট্রি দলিল করার সাথে সাথে এসি ল্যান্ড অফিসে নামজারির নোটিশ চলে যায়। কোনো কাগজের ফাইলের প্রয়োজন নেই।',
    color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe',
  },
  {
    icon: <Database size={24} />,
    title: 'সুরক্ষিত কেন্দ্রীয় ক্লাউড ডাটাবেস',
    desc: 'MongoDB Atlas ক্লাস্টারে সার্বক্ষণিক ব্যাকআপ ও রেপ্লিকা ব্যবস্থাপনায় প্রতিটি নাগরিকের ভূমির মালিকানা সুরক্ষিত।',
    color: '#b45309', bg: '#fffbeb', border: '#fde68a',
  },
  {
    icon: <Zap size={24} />,
    title: 'তাৎক্ষণিক ইমেইল ও ওটিপি অ্যালার্ট',
    desc: 'জমি হস্তান্তর, নামজারি অনুমোদন বা ভেরিফিকেশনের প্রতিটি ধাপে নাগরিক ও ক্রেতা সরাসরি ইমেইল ওটিপি ও বিজ্ঞপ্তি পান।',
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
  },
  {
    icon: <FileText size={24} />,
    title: 'QR কোড ভেরিফায়েবল ডিজিটাল খতিয়ান',
    desc: 'যেকোনো স্মার্টফোন দিয়ে খতিয়ানের কিউআর কোড স্ক্যান করলেই সরকারের মূল ডাটাবেজ থেকে মালিকানার সত্যতা প্রদর্শিত হয়।',
    color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  // Public quick verification states
  const [verifyForm, setVerifyForm] = useState({ dag_no: '', khatian_no: '', mouza: 'গুজিয়া' });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [landingMouzas, setLandingMouzas] = useState(['গুজিয়া', 'ধানমন্ডি', 'মিরপুর', 'শিবগঞ্জ', 'চকসারকার', 'মহাস্থান', 'পাইকপাড়া']);

  useEffect(() => {
    axios.get('/api/mouzas')
      .then(res => {
        if (res.data.success && res.data.mouzas?.length) {
          setLandingMouzas(res.data.mouzas);
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickVerify = async (e) => {
    if (e) e.preventDefault();
    if (!verifyForm.dag_no?.trim() && !verifyForm.khatian_no?.trim()) {
      setVerifyError('অনুগ্রহ করে দাগ নম্বর অথবা খতিয়ান নম্বর প্রদান করুন।');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const res = await axios.get('/api/verify-land', {
        params: {
          dag_no: verifyForm.dag_no?.trim(),
          khatian_no: verifyForm.khatian_no?.trim(),
          mouza: verifyForm.mouza?.trim()
        }
      });
      if (res.data) {
        setVerifyResult(res.data);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'যাচাইকরণে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO SECTION — WITH EXISTING "bg.png" BACKGROUND
      ══════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: '54px 20px 84px',
        backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.93) 0%, rgba(240, 253, 244, 0.90) 50%, rgba(255, 255, 255, 0.92) 100%), url('/images/bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderBottom: '1.5px solid #cbd5e1',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Top Pill Badge */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(6,95,70,0.06)'
            }}>
              <img src="/images/logo.png" alt="e-ভূমি" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি মন্ত্রণালয়
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 8px #22c55e'
              }} />
            </div>
          </div>

          {/* Hero Content — Centered & Clean */}
          <div style={{
            maxWidth: '860px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: '900',
              lineHeight: 1.18,
              color: '#0f172a',
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}>
              ডিজিটাল ভূমিসেবা ও{' '}
              <span style={{
                background: 'linear-gradient(135deg, #047857 0%, #16a34a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                ই-নামজারি নেটওয়ার্ক
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: '#334155',
              lineHeight: 1.8,
              marginBottom: '36px',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              নাগরিকের ভূমির অধিকার সুরক্ষায় অত্যাধুনিক প্রযুক্তি। সাব-রেজিস্ট্রার দলিল নিবন্ধন,
              এসি ল্যান্ড নামজারি এবং নাগরিকের QR-কোডযুক্ত খতিয়ান যাচাইয়ের সমন্বিত সরকারি প্ল্যাটফর্ম।
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '36px',
            }}>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #065f46, #059669)',
                  boxShadow: '0 4px 16px rgba(6,95,70,0.25)',
                }}
              >
                <LogIn size={18} /> পোর্টালে লগইন <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/verify')}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#065f46',
                  borderColor: '#a7f3d0',
                  background: '#f0fdf4',
                }}
              >
                <Search size={18} /> খতিয়ান ও জমি যাচাই
              </button>

              <button
                onClick={() => navigate('/register')}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  background: '#ffffff',
                  borderColor: '#cbd5e1',
                  color: '#0f172a',
                }}
              >
                <UserPlus size={18} /> নাগরিক নিবন্ধন
              </button>
            </div>

            {/* Trust Micro Indicators */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              paddingTop: '20px',
              borderTop: '1px solid rgba(203, 213, 225, 0.8)',
              fontSize: '13.5px',
              color: '#475569',
              fontWeight: '600',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#16a34a" /> সরকারি গ্যাজেট ও ভূমি আইনসম্মত
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="#0284c7" /> এনক্রিপ্টেড ও সম্পূর্ণ নিরাপদ
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot" style={{ display: 'inline-block' }} /> ২৪/৭ ডিজিটাল অনলাইন সেবা
              </span>
            </div>
          </div>

        </div>
      </section>



      {/* ══════════════════════════════════════════
          STATS BAR — LIGHT & ELEGANT
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{
          maxWidth: '1280px',
          margin: '-30px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}>
          {STATS.map((s, i) => (
            <div
              key={i}
              className="bd-pattern-card"
              style={{
                padding: '20px 22px',
                borderTop: `4px solid ${s.color}`,
                boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.06)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{s.icon}</span>
                <span style={{ fontSize: '12px', color: s.color, fontWeight: '700', background: s.bg, padding: '2px 8px', borderRadius: '6px' }}>
                  সক্রিয়
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: s.color, marginBottom: '2px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PUBLIC VERIFICATION SECTION — DIRECT OPEN VERIFICATION
      ══════════════════════════════════════════ */}
      <section id="public-verify" style={{ padding: '60px 20px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            background: '#ffffff',
            border: '2px solid #bbf7d0',
            borderLeft: '6px solid #16a34a',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 10px 30px rgba(22, 163, 74, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
                  <ShieldCheck size={16} /> সর্বসাধারণের জন্য উন্মুক্ত জমি যাচাইকরণ সেবা
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                  জমি কেনার পূর্বে সরাসরি সত্যতা ও মালিকানা যাচাই করুন
                </h2>
                <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
                  দাগ নম্বর, খতিয়ান নম্বর ও মৌজা দিয়ে যে কেউ জমির বর্তমান মালিকানা, আইনি স্থিতি (Stay Order/মামলা) এবং জমিটি ইতোমধ্যে বিক্রিত (Sold) কি না তা লাইভ যাচাই করতে পারবেন।
                </p>
              </div>
              <button
                onClick={() => navigate('/verify')}
                className="btn-secondary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#166534',
                  borderColor: '#86efac',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                পূর্ণাঙ্গ যাচাইকরণ পোর্টালে যান <ArrowRight size={15} />
              </button>
            </div>

            {/* Quick Verification Form */}
            <form onSubmit={handleQuickVerify} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                  মৌজার নাম নির্বাচন করুন
                </label>
                <select
                  className="input-field"
                  value={verifyForm.mouza}
                  onChange={(e) => setVerifyForm(p => ({ ...p, mouza: e.target.value }))}
                  style={{ width: '100%', height: '42px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', color: '#0f172a' }}
                >
                  {landingMouzas.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                  দাগ নম্বর (Plot No)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১০১"
                  className="input-field"
                  value={verifyForm.dag_no}
                  onChange={(e) => setVerifyForm(p => ({ ...p, dag_no: e.target.value }))}
                  style={{ width: '100%', height: '42px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                  খতিয়ান নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১ বা ১০-M"
                  className="input-field"
                  value={verifyForm.khatian_no}
                  onChange={(e) => setVerifyForm(p => ({ ...p, khatian_no: e.target.value }))}
                  style={{ width: '100%', height: '42px', fontSize: '13px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', color: '#0f172a' }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                  }}
                >
                  <Search size={16} /> {verifyLoading ? 'যাচাই হচ্ছে...' : 'জমি যাচাই করুন'}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {verifyError && (
              <div style={{ marginTop: '14px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '10px', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
                ⚠️ {verifyError}
              </div>
            )}

            {/* Live Verification Result Box */}
            {verifyResult && (
              <div style={{
                marginTop: '18px',
                padding: '20px',
                borderRadius: '14px',
                background: verifyResult.signal === 'safe' ? '#f0fdf4' : verifyResult.signal === 'warning' ? '#fffbeb' : '#fef2f2',
                border: `2px solid ${verifyResult.signal === 'safe' ? '#86efac' : verifyResult.signal === 'warning' ? '#fcd34d' : '#f87171'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {verifyResult.signal === 'safe' ? (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={22} />
                      </div>
                    ) : verifyResult.signal === 'warning' ? (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={22} />
                      </div>
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={22} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: verifyResult.signal === 'safe' ? '#166534' : verifyResult.signal === 'warning' ? '#92400e' : '#991b1b' }}>
                        {verifyResult.signal === 'safe' ? '🟢 নিরাপদ: বৈধ ও সক্রিয় জমি' : verifyResult.signal === 'warning' ? '🟡 সতর্কতা: মিউটেশন বা লেনদেন চলমান' : '🔴 ঝুঁকি: জমিটি বিক্রিত (Sold) অথবা আইনি বিরোধ'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px', fontWeight: '600' }}>
                        {verifyResult.message}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontWeight: '800',
                    background: verifyResult.signal === 'safe' ? '#dcfce7' : verifyResult.signal === 'warning' ? '#fef3c7' : '#fee2e2',
                    color: verifyResult.signal === 'safe' ? '#166534' : verifyResult.signal === 'warning' ? '#92400e' : '#991b1b',
                    border: '1px solid currentColor'
                  }}>
                    স্ট্যাটাস: {verifyResult.data?.status || (verifyResult.success ? 'যাচাইকৃত' : 'রেকর্ড নেই')}
                  </span>
                </div>

                {verifyResult.data && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মৌজা: <strong style={{ color: '#0f172a' }}>{verifyResult.data.mouza}</strong></div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>দাগ নং: <strong style={{ color: '#0f172a' }}>{verifyResult.data.dag_no}</strong></div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>খতিয়ান নং: <strong style={{ color: '#0f172a' }}>{verifyResult.data.khatian_no}</strong></div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মালিক: <strong style={{ color: '#1d4ed8' }}>{verifyResult.data.owner_name}</strong></div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মোট জমি: <strong style={{ color: '#16a34a' }}>{verifyResult.data.total_area_decimal} শতক</strong></div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মালিকের NID (গোপনীয়): <strong style={{ fontFamily: 'monospace' }}>{verifyResult.data.owner_nid}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ROLES SECTION — PURE LIGHT GOVERNMENT PORTAL
      ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Star size={13} fill="#065f46" /> সমন্বিত প্ল্যাটফর্ম
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              ভূমিকা ভিত্তিক ৪টি স্বতন্ত্র ড্যাশবোর্ড
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              একক সিস্টেমে প্রতিটি স্তরের কর্মকর্তা ও নাগরিকের জন্য নির্ধারিত অনুমতি ও সুরক্ষিত পরিবেশ
            </p>
          </div>

          {/* Roles Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '24px',
          }}>
            {ROLES.map((r, i) => (
              <div
                key={i}
                className="bd-pattern-card"
                onMouseEnter={() => setActiveRole(i)}
                onMouseLeave={() => setActiveRole(null)}
                style={{
                  padding: '28px 24px',
                  border: `1.5px solid ${activeRole === i ? r.color : '#e2e8f0'}`,
                  borderRadius: '20px',
                  boxShadow: activeRole === i ? '0 12px 30px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: activeRole === i ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: r.bg,
                    border: `1px solid ${r.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '18px',
                    boxShadow: `0 4px 12px ${r.glow}`,
                  }}>
                    {r.icon}
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    {r.role}
                  </h3>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: r.color,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                  }}>
                    {r.subtitle}
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, marginBottom: '20px' }}>
                    {r.desc}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {r.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={11} color={r.color} />
                        </div>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: r.bg,
                    border: `1.5px solid ${r.border}`,
                    color: r.color,
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.background = r.bg}
                >
                  প্রবেশ করুন <ChevronRight size={15} />
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW PIPELINE — LIGHT THEMED WITH WATERMARK
      ══════════════════════════════════════════ */}
      <section className="bd-pattern-bg" style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <TrendingUp size={13} /> ডিজিটাল কার্যপ্রবাহ
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              ৬-ধাপের স্বয়ংক্রিয় ভূমি সেবা পাইপলাইন
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
              ম্যানুয়াল ফাইলিং ও হয়রানি মুক্ত—আবেদন থেকে খতিয়ান তৈরি সম্পূর্ণ ডিজিটাল
            </p>
          </div>

          {/* Workflow Steps Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            {FLOW.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${f.border}`,
                  borderRadius: '16px',
                  padding: '22px 18px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '11px',
                  fontWeight: '900',
                  color: f.color,
                  background: f.bg,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}>
                  {f.step}
                </div>

                <div style={{ fontSize: '32px', marginBottom: '12px', marginTop: '4px' }}>
                  {f.icon}
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  {f.label}
                </h4>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  {f.sub}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          ORBIT INFOGRAPHIC — e-BHUMI ECOSYSTEM
      ══════════════════════════════════════════ */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 50%, #f8fafc 100%)',
        borderTop: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '60px',
            alignItems: 'center',
          }}>
            {/* Left: Text content */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 14px', borderRadius: '999px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                color: '#0369a1', fontSize: '12px', fontWeight: '700', marginBottom: '16px',
              }}>
                <Globe size={13} /> সংযুক্ত ইকোসিস্টেম
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '16px', lineHeight: 1.2 }}>
                ৬টি সেবা — একটি সমন্বিত
                <span style={{
                  background: 'linear-gradient(135deg, #047857, #16a34a)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{' '}ভূমি নেটওয়ার্ক</span>
              </h2>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, marginBottom: '28px' }}>
                NID যাচাই, QR খতিয়ান, SHA-256 দলিল হ্যাশিং, ইমেইল OTP, ক্লাউড ডেটাবেস এবং
                এসি ল্যান্ড অনুমোদন — সবকিছু একটি ইন্টিগ্রেটেড প্ল্যাটফর্মে।
              </p>

              {/* Feature bullets */}
              {[
                { icon: '🔐', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', title: 'SHA-256 দলিল হ্যাশিং', desc: 'প্রতিটি দলিলের বিষয়বস্তু অপরিবর্তনীয় ক্রিপ্টো হ্যাশে সংরক্ষিত' },
                { icon: '🆔', color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe', title: 'NID বায়োমেট্রিক যাচাই', desc: 'জাতীয় পরিচয়পত্র দিয়ে মালিকানা প্রমাণ নিশ্চিতকরণ' },
                { icon: '📱', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: 'QR খতিয়ান স্ক্যান', desc: 'স্মার্টফোনে তাৎক্ষণিক মালিকানা সত্যতা যাচাই সম্ভব' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  padding: '14px', borderRadius: '14px',
                  border: `1px solid ${item.border}`,
                  background: item.bg,
                  marginBottom: '12px',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{
                    fontSize: '22px', width: '42px', height: '42px',
                    background: '#ffffff', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${item.border}`, flexShrink: 0,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: item.color, marginBottom: '3px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Orbit SVG Diagram */}
            <div style={{ textAlign: 'center' }}>
              <div className="bd-orbit-animate" style={{ maxWidth: '420px', margin: '0 auto' }}>
                <img
                  src="/images/bd_land_orbit.svg"
                  alt="e-ভূমি ডিজিটাল ইকোসিস্টেম ডায়াগ্রাম"
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', fontStyle: 'italic' }}>
                e-ভূমি সমন্বিত সেবা নেটওয়ার্ক — সকল স্টেকহোল্ডার একই প্ল্যাটফর্মে সংযুক্ত
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES GRID — CLEAN LIGHT CARDS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Sparkles size={13} /> নিরাপত্তা ও স্বাচ্ছন্দ্য
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              কেন e-ভূমি প্ল্যাটফর্ম অনন্য?
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
              জালিয়াতি শূন্যে নামিয়ে আনতে ক্রিপ্টোগ্রাফিক সুরক্ষা ও রিয়েলটাইম ক্লাউড প্রযুক্তি
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bd-pattern-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  gap: '18px',
                  alignItems: 'flex-start',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = f.color;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: f.color,
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALL TO ACTION (CTA) — LIGHT PRESTIGE BANNER
      ══════════════════════════════════════════ */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fef3c7 100%)',
        borderTop: '1px solid #bbf7d0',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <img
            src="/images/bd_land_seal.png"
            alt="বাংলাদেশ ভূমি সেবা সিল"
            className="bd-seal-glow"
            style={{ width: '80px', height: '80px', margin: '0 auto 20px', display: 'block' }}
          />

          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: '900', color: '#065f46', marginBottom: '16px', lineHeight: 1.2 }}>
            স্মার্ট ভূমি সেবায় আপনাকে স্বাগতম
          </h2>

          <p style={{ fontSize: '16px', color: '#334155', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            ঘরে বসেই নিজের ভূমির অধিকার যাচাই করুন অথবা নির্ধারিত ভূমি কর্মকর্তা হিসেবে সিস্টেমে লগইন করুন।
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, #065f46, #047857)',
                boxShadow: '0 4px 16px rgba(6,95,70,0.3)',
              }}
            >
              <UserPlus size={18} /> নাগরিক অ্যাকাউন্ট খুলুন
            </button>

            <button
              onClick={() => navigate('/login')}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                background: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#0f172a',
              }}
            >
              <LogIn size={18} /> কর্মকর্তা পোর্টাল
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — OFFICIAL GOVERNMENT LIGHT THEME
      ══════════════════════════════════════════ */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '40px 20px 24px',
        color: '#475569',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            paddingBottom: '24px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/images/bd_land_seal.png" alt="" style={{ width: '38px', height: '38px' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#065f46' }}>e-ভূমি বাংলাদেশ</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>ডিজিটাল ভূমি ব্যবস্থাপনা ও রেকর্ড নেটওয়ার্ক</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: '600' }}>
                <PhoneCall size={14} /> হেল্পলাইন: ১৬১২২
              </span>
              <span onClick={() => navigate('/verify')} style={{ cursor: 'pointer', color: '#0369a1', fontWeight: '600' }}>
                খতিয়ান অনুসন্ধান
              </span>
              <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#065f46', fontWeight: '600' }}>
                অফিসার লগইন
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '20px',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <div>© ২০২৬ গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · সর্বস্বত্ব সংরক্ষিত।</div>
            <div>সমন্বিত ডিজিটাল ভূমি প্রশাসন আর্কিটেকচার (P3, P4, P5 ও এনক্রিপ্টেড ওটিপি ইঞ্জিন)</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
