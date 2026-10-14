import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Search, ArrowRight, CheckCircle, Lock, Zap,
  LogIn, UserPlus, Database, MapPin, FileText, Star,
  ChevronRight, Globe, Award, TrendingUp, Eye
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────── */
const STATS = [
  { val: '৯টি', label: 'সিড মৌজা', sub: 'শিবগঞ্জ উপজেলা', icon: '📌', color: '#1a6b3c' },
  { val: '৪টি', label: 'সিস্টেম রোল', sub: 'একক প্ল্যাটফর্ম', icon: '🔐', color: '#1d4ed8' },
  { val: 'SHA-256', label: 'দলিল যাচাই', sub: 'এনক্রিপ্টেড', icon: '🛡️', color: '#7c3aed' },
  { val: 'QR', label: 'ই-খতিয়ান', sub: 'তাৎক্ষণিক যাচাই', icon: '📄', color: '#b45309' },
];

const ROLES = [
  {
    role: 'নাগরিক',
    subtitle: 'Citizen Portal',
    icon: '👤',
    gradient: 'linear-gradient(135deg, #b45309, #d97706)',
    glow: 'rgba(180,83,9,0.25)',
    bg: '#fef3c7',
    border: '#fde68a',
    color: '#92400e',
    desc: 'নিজস্ব জমির রেকর্ড দেখুন, P5 নাগরিক যাচাই করুন এবং অনলাইনে ফি পরিশোধ করুন।',
    features: ['জমির রেকর্ড দেখুন', 'অনলাইন পেমেন্ট', 'QR যাচাই'],
  },
  {
    role: 'সাব-রেজিস্ট্রি',
    subtitle: 'Register Office',
    icon: '🏛️',
    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    glow: 'rgba(29,78,216,0.25)',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    desc: 'দলিল নিবন্ধন, NID যাচাই, P3 জালিয়াতি পর্যবেক্ষণ ও এসি ল্যান্ডে বরাদ্দ প্রেরণ।',
    features: ['দলিল নিবন্ধন', 'NID যাচাই', 'P3 অ্যান্টি-ফ্রড'],
  },
  {
    role: 'এসি ল্যান্ড',
    subtitle: 'AC Land Office',
    icon: '⚖️',
    gradient: 'linear-gradient(135deg, #047857, #16a34a)',
    glow: 'rgba(4,120,87,0.25)',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#047857',
    desc: 'রেজিস্ট্রি বরাদ্দ অনুমোদন, নামজারি ইস্যু এবং QR-কোডযুক্ত খতিয়ান প্রদান।',
    features: ['বরাদ্দ অনুমোদন', 'নামজারি ইস্যু', 'QR খতিয়ান'],
  },
  {
    role: 'মন্ত্রণালয়',
    subtitle: 'Ministry Admin',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glow: 'rgba(124,58,237,0.25)',
    bg: '#ede9fe',
    border: '#c4b5fd',
    color: '#7c3aed',
    desc: 'কর্মকর্তা তৈরি, ভূমিকা ব্যবস্থাপনা, কেন্দ্রীয় রেকর্ড নিয়ন্ত্রণ ও সিস্টেম অডিট।',
    features: ['কর্মকর্তা ব্যবস্থাপনা', 'কেন্দ্রীয় নিয়ন্ত্রণ', 'অডিট লগ'],
  },
];

const FLOW = [
  { icon: '📝', label: 'আবেদন', sub: 'সাব-রেজিস্ট্রি', color: '#1d4ed8', bg: '#dbeafe' },
  { icon: '🛡️', label: 'P3 যাচাই', sub: 'জালিয়াতি পর্যবেক্ষণ', color: '#92400e', bg: '#fef3c7' },
  { icon: '✅', label: 'Deed', sub: 'SHA-256 হ্যাশ', color: '#047857', bg: '#dcfce7' },
  { icon: '🔒', label: 'Pending Lock', sub: 'ডাবল-সেল বন্ধ', color: '#991b1b', bg: '#fee2e2' },
  { icon: '🏛️', label: 'AC Land', sub: 'নামজারি', color: '#7c3aed', bg: '#ede9fe' },
  { icon: '💳', label: 'Payment', sub: 'অনলাইন ফি', color: '#b45309', bg: '#fef3c7' },
  { icon: '📄', label: 'QR খতিয়ান', sub: 'নতুন মালিক', color: '#047857', bg: '#dcfce7' },
];

const FEATURES = [
  {
    icon: <Shield size={24} />,
    title: 'জাল দলিল প্রতিরোধ',
    desc: 'SHA-256 ক্রিপ্টোগ্রাফিক হ্যাশ দিয়ে প্রতিটি দলিলের সত্যতা যাচাই নিশ্চিত।',
    color: '#1a6b3c', bg: '#dcfce7', border: '#86efac',
  },
  {
    icon: <Lock size={24} />,
    title: 'ডাবল-সেলিং বন্ধ',
    desc: 'Pending Lock সিস্টেম একই জমি একাধিকবার বিক্রয় রোধ করে।',
    color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'স্বয়ংক্রিয় ওয়ার্কফ্লো',
    desc: 'রেজিস্ট্রি থেকে এসি ল্যান্ড পর্যন্ত সম্পূর্ণ ডিজিটাল প্রক্রিয়া।',
    color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd',
  },
  {
    icon: <Database size={24} />,
    title: 'কেন্দ্রীয় ডেটাবেস',
    desc: 'MongoDB Atlas-এ সুরক্ষিত রিয়েল-টাইম জমির রেকর্ড সংরক্ষণ।',
    color: '#b45309', bg: '#fef3c7', border: '#fcd34d',
  },
  {
    icon: <Eye size={24} />,
    title: 'QR ভেরিফিকেশন',
    desc: 'যেকোনো স্থান থেকে QR স্ক্যান করে তাৎক্ষণিক খতিয়ান যাচাই।',
    color: '#047857', bg: '#ecfdf5', border: '#6ee7b7',
  },
  {
    icon: <Globe size={24} />,
    title: 'মোবাইল-ফার্স্ট',
    desc: 'যেকোনো ডিভাইস থেকে সহজে প্রবেশযোগ্য রেসপন্সিভ ইন্টারফেস।',
    color: '#0e7490', bg: '#cffafe', border: '#67e8f9',
  },
];

/* ─── Animated Counter ──────────────────────────────────── */
function AnimCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        let start = 0;
        const isNum = !isNaN(Number(target));
        if (!isNum) { setCount(target); return; }
        const end = Number(target);
        const dur = 1400;
        const step = dur / end;
        const timer = setInterval(() => {
          start += 1;
          setCount(start);
          if (start >= end) clearInterval(timer);
        }, step);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{typeof count === 'number' ? count + suffix : count}</span>;
}

/* ─── Main Component ────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter','Hind Siliguri',sans-serif", overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0f172a 0%, #1a3a2a 45%, #0c2340 100%)',
        padding: '60px 24px',
      }}>
        {/* Animated grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(26,107,60,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,107,60,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.15}px)`,
        }} />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,60,0.2) 0%, transparent 70%)',
          zIndex: 0, animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%', width: '350px', height: '350px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
          zIndex: 0, animation: 'float 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          zIndex: 0, transform: 'translate(-50%,-50%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '860px', width: '100%' }}
          className="animate-fade-in-up">

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '7px 18px', borderRadius: '999px', marginBottom: '28px',
            background: 'rgba(26,107,60,0.2)',
            border: '1px solid rgba(26,107,60,0.5)',
            color: '#86efac', fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em',
            backdropFilter: 'blur(10px)',
          }}>
            <Zap size={13} fill="#86efac" />
            বাংলাদেশ ভূমি মন্ত্রণালয় · ডিজিটাল ভূমি প্রশাসন ২০২৬
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              borderRadius: '50%', background: '#4ade80',
              animation: 'pulse-green 2s infinite',
            }} />
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 80px)',
            fontWeight: '900', lineHeight: 1.1,
            marginBottom: '24px', letterSpacing: '-0.02em',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #86efac 0%, #4ade80 50%, #22c55e 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>e-ভূমি</span>
            <br />
            <span style={{ color: '#f1f5f9' }}>সমন্বিত ডিজিটাল</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>ভূমি ব্যবস্থাপনা</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8',
            maxWidth: '620px', margin: '0 auto 40px', lineHeight: 1.8,
          }}>
            নাগরিক, সাব-রেজিস্ট্রার, এসি ল্যান্ড ও মন্ত্রণালয়ের জন্য একক সুরক্ষিত প্ল্যাটফর্ম।
            জাল দলিল ও ডাবল-সেলিং প্রতিরোধে SHA-256 প্রযুক্তি।
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '9px',
              padding: '15px 32px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
              color: '#fff', fontSize: '16px', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(22,163,74,0.45)',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter','Hind Siliguri',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.45)'; }}
            >
              <LogIn size={18} /> লগইন পোর্টাল <ArrowRight size={16} />
            </button>

            <button onClick={() => navigate('/register')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '9px',
              padding: '15px 28px', borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.07)',
              color: '#f1f5f9', fontSize: '16px', fontWeight: '600',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter','Hind Siliguri',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <UserPlus size={18} /> নাগরিক নিবন্ধন
            </button>

            <button onClick={() => navigate('/verify')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '9px',
              padding: '15px 28px', borderRadius: '12px',
              border: '1.5px solid rgba(147,197,253,0.3)',
              background: 'rgba(29,78,216,0.15)',
              color: '#93c5fd', fontSize: '16px', fontWeight: '600',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter','Hind Siliguri',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,78,216,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,78,216,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Search size={18} /> জমি যাচাই (P5)
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{
            marginTop: '48px', display: 'flex', gap: '28px',
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { icon: <Shield size={14} />, text: 'SSL সুরক্ষিত' },
              { icon: <Award size={14} />, text: 'সরকার অনুমোদিত' },
              { icon: <CheckCircle size={14} />, text: 'NID যাচাই সক্রিয়' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#cbd5e1', fontSize: '13px', fontWeight: '500',
              }}>
                <span style={{ color: '#4ade80' }}>{t.icon}</span> {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to bottom, transparent, #f0f4f8)',
          zIndex: 1,
        }} />
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', padding: '0 24px' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px', transform: 'translateY(-36px)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              borderTop: `4px solid ${s.color}`,
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{s.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: s.color, marginBottom: '4px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ROLES SECTION
      ══════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', padding: '20px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 16px', borderRadius: '999px', marginBottom: '16px',
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              color: '#15803d', fontSize: '12px', fontWeight: '700',
            }}>
              <Star size={12} fill="#15803d" /> সিস্টেমের চারটি ভূমিকা
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>
              একক প্ল্যাটফর্ম, চারটি পোর্টাল
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              একটি লগইন পেজ থেকে প্রতিটি ভূমিকা নিজস্ব ড্যাশবোর্ডে প্রবেশ করে
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '22px' }}>
            {ROLES.map((r, i) => (
              <div key={i}
                onMouseEnter={() => setActiveRole(i)}
                onMouseLeave={() => setActiveRole(null)}
                style={{
                  background: '#fff',
                  border: `1px solid ${activeRole === i ? r.border : '#e2e8f0'}`,
                  borderRadius: '20px',
                  padding: '28px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  transform: activeRole === i ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: activeRole === i
                    ? `0 20px 50px ${r.glow}, 0 4px 12px rgba(0,0,0,0.06)`
                    : '0 4px 12px rgba(0,0,0,0.06)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Top gradient accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: r.gradient,
                  borderRadius: '20px 20px 0 0',
                }} />

                {/* Icon */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: r.bg, border: `1.5px solid ${r.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', marginBottom: '16px',
                  boxShadow: `0 4px 12px ${r.glow}`,
                }}>
                  {r.icon}
                </div>

                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {r.role}
                  </h3>
                </div>
                <div style={{
                  fontSize: '11px', color: r.color, fontWeight: '700',
                  letterSpacing: '0.06em', marginBottom: '14px', textTransform: 'uppercase',
                }}>
                  {r.subtitle}
                </div>

                <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.7, marginBottom: '18px' }}>
                  {r.desc}
                </p>

                {/* Feature chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {r.features.map((f, fi) => (
                    <span key={fi} style={{
                      padding: '4px 10px', borderRadius: '999px',
                      background: r.bg, border: `1px solid ${r.border}`,
                      color: r.color, fontSize: '11px', fontWeight: '700',
                    }}>
                      {f}
                    </span>
                  ))}
                </div>

                <button onClick={() => navigate('/login')} style={{
                  width: '100%', padding: '11px 16px',
                  background: r.bg, border: `1.5px solid ${r.border}`,
                  color: r.color, borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter','Hind Siliguri',sans-serif",
                }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  পোর্টালে প্রবেশ করুন <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW PIPELINE
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1a3a2a 60%, #0c2340 100%)',
        padding: '80px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(26,107,60,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,107,60,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 16px', borderRadius: '999px', marginBottom: '16px',
              background: 'rgba(26,107,60,0.2)', border: '1px solid rgba(26,107,60,0.4)',
              color: '#86efac', fontSize: '12px', fontWeight: '700',
            }}>
              <TrendingUp size={12} /> সমন্বিত কার্যপ্রবাহ
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: '900', color: '#f1f5f9', marginBottom: '12px' }}>
              🔄 ডিজিটাল Workflow Pipeline
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '15px', maxWidth: '520px', margin: '0 auto' }}>
              সাব-রেজিস্ট্রি থেকে নাগরিকের নামে খতিয়ান পর্যন্ত ৭-ধাপের স্বয়ংক্রিয় প্রক্রিয়া
            </p>
          </div>

          {/* Pipeline */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: '6px',
          }}>
            {FLOW.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${step.bg}40`,
                  borderRadius: '16px', padding: '18px 16px',
                  textAlign: 'center', minWidth: '100px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${step.bg}22`;
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = step.bg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = `${step.bg}40`;
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{step.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#f1f5f9', marginBottom: '3px' }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>{step.sub}</div>
                  <div style={{
                    marginTop: '8px', width: '6px', height: '6px', borderRadius: '50%',
                    background: step.bg, margin: '8px auto 0',
                  }} />
                </div>
                {i < FLOW.length - 1 && (
                  <div style={{ color: '#64748b', fontSize: '20px', fontWeight: '700' }}>›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 16px', borderRadius: '999px', marginBottom: '16px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              color: '#1d4ed8', fontSize: '12px', fontWeight: '700',
            }}>
              <Shield size={12} /> মূল বৈশিষ্ট্যসমূহ
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>
              কেন e-ভূমি ব্যবহার করবেন?
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              আধুনিক প্রযুক্তি ও নিরাপত্তার সমন্বয়ে তৈরি ভূমি ব্যবস্থাপনা সিস্টেম
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px',
                padding: '28px 24px', display: 'flex', gap: '18px', alignItems: 'flex-start',
                transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = f.border;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: '50px', height: '50px', borderRadius: '14px',
                  background: f.bg, border: `1.5px solid ${f.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: f.color,
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
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
          CTA SECTION
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1a3a2a 50%, #0c2340 100%)',
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,107,60,0.15) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)', zIndex: 0,
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: '999px', marginBottom: '28px',
            background: 'rgba(26,107,60,0.2)', border: '1px solid rgba(26,107,60,0.4)',
            color: '#86efac', fontSize: '12px', fontWeight: '700',
          }}>
            <Zap size={12} fill="#86efac" /> আজই শুরু করুন — বিনামূল্যে
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '900',
            color: '#f1f5f9', marginBottom: '16px', lineHeight: 1.2,
          }}>
            ডিজিটাল ভূমি সেবায় <br />
            <span style={{
              background: 'linear-gradient(135deg, #86efac, #4ade80)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>স্বাগতম</span>
          </h2>

          <p style={{
            color: '#94a3b8', fontSize: '16px', marginBottom: '44px',
            lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 44px',
          }}>
            নাগরিক হিসেবে বিনামূল্যে নিবন্ধন করুন অথবা নির্ধারিত কর্মকর্তা হিসেবে পোর্টালে প্রবেশ করুন।
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
              color: '#fff', fontSize: '16px', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(22,163,74,0.4)',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter','Hind Siliguri',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(22,163,74,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.4)'; }}
            >
              <UserPlus size={18} /> নাগরিক নিবন্ধন করুন <ArrowRight size={16} />
            </button>

            <button onClick={() => navigate('/login')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 32px', borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.07)',
              color: '#f1f5f9', fontSize: '16px', fontWeight: '600',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter','Hind Siliguri',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <LogIn size={18} /> কর্মকর্তা লগইন
            </button>
          </div>

          {/* Bottom note */}
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '32px' }}>
            🔒 সকল তথ্য SSL এনক্রিপ্টেড · বাংলাদেশ সরকার কর্তৃক অনুমোদিত
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', marginBottom: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>🌿</span>
          <span style={{
            fontSize: '18px', fontWeight: '900',
            background: 'linear-gradient(135deg, #86efac, #4ade80)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>e-ভূমি</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            · বাংলাদেশ ভূমি মন্ত্রণালয়
          </span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '12px' }}>
          © ২০২৬ e-ভূমি ডিজিটাল ভূমি ব্যবস্থাপনা সিস্টেম। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </footer>
    </div>
  );
}
