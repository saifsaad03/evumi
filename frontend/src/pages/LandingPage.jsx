import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, Search, ArrowRight, CheckCircle, Lock, Zap,
  LogIn, UserPlus, Database, MapPin, FileText, Star,
  ChevronRight, Globe, Award, TrendingUp, Sparkles, Check, PhoneCall,
  ShieldCheck, ShieldAlert, AlertTriangle, PlayCircle,
  KeyRound, Link2, Cpu, FileCheck2, Binary, Fingerprint
} from 'lucide-react';

// ওয়েবসাইট ব্যবহার নির্দেশিকা ভিডিও লিংক
const GUIDELINE_VIDEO_URL = "https://youtu.be/wHDfV-j33jw";

// YouTube URL কে স্বয়ংক্রিয়ভাবে embed URL-এ রূপান্তর করার ফাংশন
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

/* ─── Live System Stats ─────────────────────────────────── */
const STATS = [
  { val: '১০০% টেম্পার-প্রুফ', label: 'ব্লকচেইন হ্যাশ চেইন', sub: 'অপরিবর্তনীয় ও সুরক্ষিত রেকর্ড', icon: '⛓️', color: '#047857', bg: '#ecfdf5' },
  { val: 'PKI সাইন', label: 'ডিজিটাল সিগনেচার', sub: 'কর্মকর্তা অনুমোদন ভেরিফাইড', icon: '🔑', color: '#0369a1', bg: '#f0f9ff' },
  { val: 'AES-256', label: 'ফিল্ড-লেভেল এনক্রিপশন', sub: 'নাগরিক সংবেদনশীল ডাটা সুরক্ষিত', icon: '🛡️', color: '#7c3aed', bg: '#f5f3ff' },
  { val: 'ডাইনামিক', label: 'ভৌগোলিক লোকেশন', sub: 'বিভাগ, জেলা, উপজেলা ও মৌজা', icon: '📍', color: '#b45309', bg: '#fef3c7' },
];

/* ─── Today's Key Security & Architectural Upgrades ──────── */
const TODAY_UPGRADES = [
  {
    icon: <KeyRound size={24} />,
    badge: 'PKI Engine',
    title: 'অ্যাসিমেট্রিক পিকেআই ডিজিটাল সিগনেচার',
    subtitle: 'কর্মকর্তা ডিজিটাল অনুমোদন',
    desc: 'সাব-রেজিস্ট্রার ও সহকারী কমিশনার (ভূমি) কর্মকর্তাদের প্রতিটি দলিল অনুমোদন ক্রিপ্টোগ্রাফিক কি (Key) দ্বারা ডিজিটাল স্বাক্ষরযুক্ত। ফলে জাল অনুমোদন সম্পূর্ণ অসম্ভব।',
    bullets: ['RSA-2048 / ECC ক্রিপ্টো সাইনিং', 'কর্মকর্তার অফিসিয়াল আইডেন্টিটি যাচাই'],
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  {
    icon: <Link2 size={24} />,
    badge: 'Blockchain Ledger',
    title: 'ব্লকচেইন হ্যাশ চেইনিং লেজার',
    subtitle: 'অপরিবর্তনীয় মালিকানা চেইন',
    desc: 'প্রতিটি দলিলের ক্রিপ্টোগ্রাফিক হ্যাশ পূর্ববর্তী দলিলের সাথে লিংক করে একটি ব্লকচেইন লেজার তৈরি করা হয়েছে। গত ৫০-১০০ বছরের মালিকানা চেইনে এক অক্ষরের পরিবর্তনও ধরা পড়বে।',
    bullets: ['SHA-256 Merkle Hash Chaining', 'ঐতিহাসিক মালিকানা রেকর্ড সুরক্ষিত'],
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd'
  },
  {
    icon: <Fingerprint size={24} />,
    badge: 'Chained Audit Logs',
    title: 'ক্রিপ্টোগ্রাফিক অডিট ট্রেইল সিকিউরিটি',
    subtitle: 'জিরো-ট্রাস্ট লগ নজরদারি',
    desc: 'সিস্টেমের প্রতিটি প্রশাসনিক অ্যাকশন ও পরিবর্তনের সাথে আগের লগের হ্যাশ স্বয়ংক্রিয়ভাবে সংযুক্ত থাকে। ডাটাবেজ এডমিনও কোনো পুরোনো লগ মুছতে বা পরিবর্তন করতে পারে না।',
    bullets: ['হ্যাশ-সংযুক্ত ক্রিপ্টোগ্রাফিক লগ', 'অননুমোদিত ব্যাকডোর হস্তক্ষেপ প্রতিরোধ'],
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  },
  {
    icon: <Lock size={24} />,
    badge: 'Encryption at Rest',
    title: 'AES-256-GCM ফিল্ড লেভেল এনক্রিপশন',
    subtitle: 'নাগরিক ডাটা প্রটেকশন',
    desc: 'নাগরিকদের জাতীয় পরিচয়পত্র (NID), মোবাইল নম্বর ও সংবেদনশীল তথ্য ক্লাউড ডাটাবেজে স্টোর হওয়ার পূর্বেই মিলিটারি-গ্রেড AES-256-GCM সাইফারটেক্সটে রূপান্তরিত হয়।',
    bullets: ['ডাটাবেজ ব্রিচেও তথ্য সম্পূর্ণ সুরক্ষিত', 'GDPR ও ন্যাশনাল সাইবার সিকিউরিটি মানদণ্ড'],
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a'
  },
  {
    icon: <MapPin size={24} />,
    badge: 'Dynamic Geolocation',
    title: 'ডাইনামিক ভৌগোলিক লোকেশন ম্যানেজমেন্ট',
    subtitle: 'ক্যাসকেডিং লোকেশন ইঞ্জিন',
    desc: 'সারা দেশের বিভাগ, জেলা, উপজেলা এবং মৌজা সম্পূর্ণ সেন্ট্রালাইজড ডাটাবেজ থেকে রিয়েলটাইমে লোড হয়। নতুন মৌজা বা অঞ্চল যুক্ত হলে তা তাৎক্ষণিক লাইভ কার্যকর হয়।',
    bullets: ['ডাইনামিক ক্যাসকেডিং ড্রপডাউন', 'রিয়েলটাইম ডাটাবেজ জিও-ফিল্টারিং'],
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4'
  },
  {
    icon: <ShieldCheck size={24} />,
    badge: 'Pending Land Lock',
    title: 'রিয়েলটাইম অ্যান্টি-ডাবল সেলিং লকিং',
    subtitle: 'স্বয়ংক্রিয় ডাটাবেজ প্রটেকশন',
    desc: 'একটি নির্দিষ্ট দাগ বা খতিয়ানের দলিল প্রক্রিয়াকরণের মুহূর্তে জমিতে Pending Lock সক্রিয় হয়, ফলে আবেদন নিষ্পত্তি না হওয়া পর্যন্ত একই জমি দ্বিতীয়বার বিক্রয় সম্পূর্ণ অসম্ভব।',
    bullets: ['একযোগে একাধিক বিক্রয় বা রেজিস্ট্রি রোধ', 'স্বয়ংক্রিয় ফ্রড ডিটেকশন নোটিফিকেশন'],
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca'
  }
];

/* ─── 4 Role Portals ────────────────────────────────────── */
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

/* ─── 6-Step Workflow ───────────────────────────────────── */
const FLOW = [
  { step: '০১', icon: '📝', label: 'আবেদন দাখিল', sub: 'দলিল প্রস্তুত ও NID যাচাই', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { step: '০২', icon: '🛡️', label: 'P3 ফ্রড ফিল্টার', sub: 'SHA-256 ক্রিপ্টো যাচাই', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { step: '০৩', icon: '🔒', label: 'পেন্ডিং লক', sub: 'ডাবল-সেলিং স্বয়ংক্রিয় রোধ', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  { step: '০৪', icon: '🏛️', label: 'এসি ল্যান্ড রিভিউ', sub: 'মাঠ পর্যায়ের সত্যতা ও PKI সাইন', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  { step: '০৫', icon: '💳', label: 'অনলাইন পেমেন্ট', sub: 'সরকারি কোষাগারে ই-চালান', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { step: '০৬', icon: '📄', label: 'ডিজিটাল খতিয়ান', sub: 'QR কোডযুক্ত সনদ ও হ্যাশ চেইন', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
];

/* ─── Core Security Attributes ──────────────────────────── */
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

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO SECTION — WITH "bg.png" BACKGROUND
      ══════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: '56px 20px 84px',
        backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.93) 0%, rgba(240, 253, 244, 0.90) 50%, rgba(255, 255, 255, 0.92) 100%), url('/images/bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderBottom: '1.5px solid #cbd5e1',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Top Pill Badges */}
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
            maxWidth: '880px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5.5vw, 54px)',
              fontWeight: '900',
              lineHeight: 1.18,
              color: '#0f172a',
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}>
              ডিজিটাল ভূমিসেবা, ই-নামজারি ও{' '}
              <span style={{
                background: 'linear-gradient(135deg, #047857 0%, #16a34a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                এন্টারপ্রাইজ ক্রিপ্টোগ্রাফিক নেটওয়ার্ক
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 17.5px)',
              color: '#334155',
              lineHeight: 1.8,
              marginBottom: '36px',
              maxWidth: '760px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              জাতীয় ভূমি নিরাপত্তা নিশ্চিতে পিকেআই (PKI) ডিজিটাল স্বাক্ষর, অপরিবর্তনীয় ব্লকচেইন হ্যাশ চেইনিং, ডাইনামিক মৌজা ডাটাবেজ এবং রিয়েলটাইম অ্যান্টি-ডাবল সেলিং সমন্বিত সরকারি স্মার্ট ভূমিসেবা প্ল্যাটফর্ম।
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
                <CheckCircle size={16} color="#16a34a" /> PKI ডিজিটাল স্বাক্ষর
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="#0284c7" /> ব্লকচেইন হ্যাশ চেইনিং
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} color="#7c3aed" /> AES-256 ডাটা এনক্রিপশন
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#b45309" /> ডাইনামিক লোকেশন ইঞ্জিন
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
              <div style={{ fontSize: '24px', fontWeight: '900', color: s.color, marginBottom: '2px' }}>
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
          TODAY'S ENTERPRISE SECURITY & FEATURE UPGRADES
          (Modern CSS Grid Showcase — Pure Vector-free UI)
      ══════════════════════════════════════════ */}
      <section id="features" style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 50%, #f8fafc 100%)',
        borderTop: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12.5px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Sparkles size={14} color="#059669" />
              <span>আজকের প্রধান প্রযুক্তিগত ও ক্রিপ্টোগ্রাফিক উদ্ভাবনসমূহ</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 38px)',
              fontWeight: '900',
              color: '#0f172a',
              marginBottom: '12px',
              lineHeight: 1.25
            }}>
              জাতীয় ভূমি নিরাপত্তায় সর্বাধুনিক{' '}
              <span style={{
                background: 'linear-gradient(135deg, #047857, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                ক্রিপ্টোগ্রাফিক ও সিস্টেম আপগ্রেড
              </span>
            </h2>

            <p style={{ color: '#475569', fontSize: '15px', maxWidth: '680px', margin: '0 auto', lineHeight: 1.7 }}>
              জাল দলিল, ডাবল-সেলিং ও তথ্য বিকৃতি শতভাগ রোধ করতে যুক্ত করা হয়েছে এন্টারপ্রাইজ ক্রিপ্টোগ্রাফিক সিগনেচার, ব্লকচেইন হ্যাশ চেইন ও ডাইনামিক ক্লাউড লোকেশন ইঞ্জিন।
            </p>
          </div>

          {/* 6 Feature Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
          }}>
            {TODAY_UPGRADES.map((item, i) => (
              <div
                key={i}
                className="bd-pattern-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '26px 24px',
                  border: `1.5px solid ${item.border}`,
                  boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = item.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.04)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: item.bg,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${item.border}`
                    }}>
                      {item.icon}
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: item.color,
                      background: item.bg,
                      border: `1px solid ${item.border}`,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: item.color, marginBottom: '12px' }}>
                    {item.subtitle}
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.7, marginBottom: '20px' }}>
                    {item.desc}
                  </p>
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px dashed #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {item.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                      <CheckCircle size={14} color={item.color} style={{ flexShrink: 0 }} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW PIPELINE — LIGHT THEMED WITH WATERMARK
      ══════════════════════════════════════════ */}
      <section id="workflow" className="bd-pattern-bg" style={{
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
              ম্যানুয়াল ফাইলিং ও হয়রানি মুক্ত—আবেদন দাখিল থেকে ব্লকচেইন ডিজিটাল খতিয়ান তৈরি সম্পূর্ণ স্বয়ংক্রিয়
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
          ROLES SECTION — PURE LIGHT GOVERNMENT PORTAL
      ══════════════════════════════════════════ */}
      <section id="roles" style={{ padding: '80px 20px', background: '#f8fafc' }}>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES GRID — CLEAN LIGHT CARDS
      ══════════════════════════════════════════ */}
      <section id="security" style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
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
              <Award size={13} /> নিরাপত্তা ও জাতীয় মানদণ্ড
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              কেন e-ভূমি প্ল্যাটফর্ম অনন্য ও সুরক্ষিত?
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
          GUIDELINE VIDEO TUTORIAL SECTION
      ══════════════════════════════════════════ */}
      <section id="guide" style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
        borderTop: '1px solid #e2e8f0',
        padding: '72px 20px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Section Heading */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '14px'
            }}>
              <PlayCircle size={16} color="#059669" />
              <span>প্ল্যাটফর্ম ব্যবহার নির্দেশিকা</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 3.8vw, 36px)',
              fontWeight: '900',
              color: '#0f172a',
              marginBottom: '12px',
              lineHeight: 1.3
            }}>
              ই-ভূমি প্ল্যাটফর্ম ব্যবহারের সহজ নির্দেশিকা
            </h2>

            <p style={{
              fontSize: '15px',
              color: '#475569',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              ডিজিタル ভূমিসেবা গ্রহণ, জমির খতিয়ান অনুসন্ধান, মালিকানা দাবি ও অনলাইন প্রক্রিয়াসমূহ সহজে বুঝতে নিচের ভিডিও নির্দেশিকাটি দেখুন।
            </p>
          </div>

          {/* Video Container (16:9 Aspect Ratio) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              height: 0,
              overflow: 'hidden',
              borderRadius: '14px',
              background: '#0f172a'
            }}>
              <iframe
                src={getYouTubeEmbedUrl(GUIDELINE_VIDEO_URL)}
                title="ই-ভূমি ব্যবহার নির্দেশিকা ভিডিও"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '14px'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Quick Guide Chips */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '12.5px',
              color: '#475569'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>নির্দেশনা ধাপসমূহ:</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>১. খতিয়ান অনুসন্ধান</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>২. নাগরিক ড্যাশবোর্ড</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>৩. মালিকানা দাবি ফরম</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALL TO ACTION (CTA) — LIGHT PRESTIGE BANNER
      ══════════════════════════════════════════ */}
      <section id="helpline" style={{
        padding: '70px 20px',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fef3c7 100%)',
        borderTop: '1px solid #bbf7d0',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <img
            src="/images/logo.png"
            alt="e-ভূমি লোগো"
            style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto 18px', display: 'block' }}
          />

          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '900', color: '#065f46', marginBottom: '14px', lineHeight: 1.2 }}>
            স্মার্ট ও সুরক্ষিত ভূমি সেবায় আপনাকে স্বাগতম
          </h2>

          <p style={{ fontSize: '15.5px', color: '#334155', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.7 }}>
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
                padding: '13px 30px',
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
                padding: '13px 26px',
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
              <img src="/images/logo.png" alt="e-ভূমি লোগো" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
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
            <div>সমন্বিত ডিজিটাল ভূমি প্রশাসন আর্কিটেকচার (PKI, ব্লকচেইন হ্যাশ চেইন ও এনক্রিপ্টেড ডাটাবেজ)</div>
          </div>

          <div style={{
            textAlign: 'center',
            paddingTop: '18px',
            marginTop: '18px',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '13px',
            fontWeight: '700',
            color: '#065f46',
            letterSpacing: '0.01em'
          }}>
            This Website is Developed By MD SAAD &amp; MD CHAND
          </div>
        </div>
      </footer>

    </div>
  );
}
