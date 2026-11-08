import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Search, ArrowRight, CheckCircle, Lock, Zap,
  LogIn, UserPlus, Database, MapPin, FileText, Star,
  Award, TrendingUp, Sparkles, Check, PhoneCall,
  ShieldCheck, AlertTriangle, PlayCircle,
  KeyRound, Link2, Fingerprint, Building2,
  Users, Scale, CheckCircle2, XCircle, ArrowUpRight, HelpCircle
} from 'lucide-react';

// ওয়েবসাইট ব্যবহার নির্দেশিকা ভিডিও লিংক
const GUIDELINE_VIDEO_URL = "https://youtu.be/wHDfV-j33jw";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

/* ─── Live Executive System Stats ─────────────────────────── */
const STATS = [
  { val: '০০% ডাবল-সেলিং', label: 'পেন্ডিং লক ইঞ্জিন', sub: 'একই জমি একাধিকবার বিক্রয় অসম্ভব', icon: '🔒', color: '#b91c1c', bg: '#fef2f2' },
  { val: '১০০% টেম্পার-প্রুফ', label: 'ব্লকচেইন হ্যাশ চেইন', sub: 'অপরিবর্তনীয় ক্রিপ্টোগ্রাফিক লেজার', icon: '⛓️', color: '#047857', bg: '#ecfdf5' },
  { val: 'RSA-2048', label: 'পিকেআই ডিজিটাল সাইন', sub: 'কর্মকর্তা অনুমোদন ডিজিটালভাবে সুরক্ষিত', icon: '🔑', color: '#0369a1', bg: '#f0f9ff' },
  { val: 'AES-256-GCM', label: 'ফিল্ড-লেভেল এনক্রিপশন', sub: 'নাগরিক সংবেদনশীল ডাটা ক্লাউডে সুরক্ষিত', icon: '🛡️', color: '#7c3aed', bg: '#f5f3ff' },
];

/* ─── Hackathon Problem vs Solution Matrix ─────────────────── */
const PROBLEM_SOLUTIONS = [
  {
    problem: 'একই জমি গোপনে একাধিক ক্রেতার কাছে বিক্রয় (ডাবল সেলিং প্রতারণা)',
    solution: 'স্বয়ংক্রিয় রিয়েলটাইম "Pending Lock" ও দাগ ফ্রিজিং ব্যবস্থা',
    tech: 'Atomic Transaction Lock',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  {
    problem: 'ভুয়া খতিয়ান ও জাল দলিল তৈরি করে জমি দখল ও মামলা-মোকদ্দমা',
    solution: 'SHA-256 ক্রিপ্টোগ্রাফিক হ্যাশিং ও QR-যাচাইযোগ্য ডিজিটাল খতিয়ান সনদ',
    tech: 'Merkle Hash Chaining',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd'
  },
  {
    problem: 'মৃত্যু সনদ জাল করে কিংবা নারী/দুর্বল ওয়ারিশকে বঞ্চিত করে সম্পত্তি বণ্টন',
    solution: 'জাতীয় মৃত্যু সনদ ভেরিফিকেশন ও ফারায়েজ আইনসম্মত ওয়ারিশান ক্যালকুলেটর',
    tech: 'Digital Succession Protocol',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  },
  {
    problem: 'মসজিদ, মাদ্রাসা ও জনকল্যাণমূলক ওয়াকফ জমি কমিটি কর্তৃক বেআইনি হস্তান্তর',
    solution: 'প্রতিষ্ঠানের জন্য রিড-অনলি মোড ও সাব-রেজিস্ট্রারের একক এখতিয়ারভুক্ত হেফাজত লগ',
    tech: 'Institutional Custody Audit',
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4'
  },
  {
    problem: 'দলিল রেজিস্ট্রির পর নামজারির জন্য মাসের পর মাস ভূমি অফিসে ফাইলিং দুর্ভোগ',
    solution: 'সাব-রেজিস্ট্রি থেকে এসি ল্যান্ড অফিসে ১০০% পেপারলেস রিয়েলটাইম মিউটেশন পাইপলাইন',
    tech: 'Inter-Agency API Sync',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a'
  }
];

/* ─── 5 Institutional & Citizen Portals ───────────────────── */
const ROLES = [
  {
    role: 'নাগরিক পোর্টাল',
    subtitle: 'Citizen Services',
    icon: '👤',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: 'নাগরিকের নিজস্ব অনুমোদিত খতিয়ান তল্লাশি, মালিকানা দাবি দাখিল, রিয়েলটাইম নামজারি ট্র্যাকিং ও QR কোডযুক্ত সনদ ডাউনলোড।',
    features: ['নিজস্ব খতিয়ান তল্লাশি ও সংরক্ষণ', 'ডিজিটাল মালিকানা দাবি দাখিল', 'রিয়েলটাইম নামজারি ট্র্যাকিং'],
  },
  {
    role: 'ওয়াকফ ও ধর্মীয় প্রতিষ্ঠান',
    subtitle: 'Mosque / Waqf Institution',
    icon: '🏛️',
    color: '#0f766e',
    bg: '#f0fdfa',
    border: '#99f6e4',
    desc: 'মসজিদ, মাদ্রাসা ও ধর্মীয় প্রতিষ্ঠানের ওয়াকফ জমি সংরক্ষণ, কমিটি পরিবর্তনহীন স্থায়ী প্রোফাইল এবং সাব-রেজিস্ট্রার অডিট ট্রেইল।',
    features: ['ওয়াকফ জমি ও খতিয়ান সুরক্ষা', 'অপরিবর্তনীয় রিড-অনলি প্রোফাইল', 'সাব-রেজিস্ট্রার মোতাওয়াল্লী হেফাজত লগ'],
  },
  {
    role: 'সাব-রেজিস্ট্রি অফিস',
    subtitle: 'Sub-Registry Officer',
    icon: '📜',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'সাফ-কবলা, বণ্টননামা, হেবা, বিনিময়, বন্ধক, বায়না ও ওয়াকফ দলিল সম্পাদন, বায়োমেট্রিক ওটিপি ভেরিফিকেশন ও এসি ল্যান্ডে ফরোয়ার্ডিং।',
    features: ['৭টি দলিলের ক্রিপ্টোগ্রাফিক নিবন্ধন', 'বায়োমেট্রিক ওটিপি অ্যান্টি-ফ্রড', 'ইনস্ট্যান্ট পেন্ডিং লক সক্রিয়করণ'],
  },
  {
    role: 'সহকারী কমিশনার (ভূমি)',
    subtitle: 'AC Land Office',
    icon: '⚖️',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    desc: 'সাব-রেজিস্ট্রি থেকে প্রেরিত দলিলের ফিল্ড রিপোর্ট পর্যালোচনা, PKI ডিজিটাল সাইন এবং ই-নামজারি অনুমোদনপূর্বক খতিয়ান বিভাজন।',
    features: ['পেপারলেস ই-নামজারি কেস নিষ্পত্তি', 'RSA-2048 PKI কর্মকর্তা ডিজিটাল সাইন', 'স্বয়ংক্রিয় ডিজিটাল খতিয়ান অনুমোদন'],
  },
  {
    role: 'ভূমি মন্ত্রণালয় প্রশাসন',
    subtitle: 'Ministry Central Admin',
    icon: '👑',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    desc: 'সারাদেশের সকল ভূমি অফিসের কার্যকলাপ মনিটরিং, কেন্দ্রীয় কর্মকর্তা নিয়োগ, ক্রিপ্টোগ্রাফিক জিরো-ট্রাস্ট অডিট লগ ও লোকেশন ইঞ্জিন।',
    features: ['কেন্দ্রীয় কর্মকর্তা ও ভূমিকা ব্যবস্থাপনা', 'জিরো-ট্রাস্ট চেইন্ড অডিট লগ', 'ডাইনামিক সেন্ট্রাল লোকেশন ইঞ্জিন'],
  },
];

/* ─── 6-Step Automated Workflow ───────────────────────────── */
const FLOW = [
  { step: '০১', icon: '📝', label: 'দলিল দাখিল ও ওটিপি', sub: 'বায়োমেট্রিক NID ও ইমেইল ওটিপি যাচাই', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { step: '০২', icon: '🛡️', label: 'P3 ক্রিপ্টো ফ্রড ফিল্টার', sub: 'SHA-256 লিগ্যাল স্ট্যাটাস স্ক্রিনিং', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { step: '০৩', icon: '🔒', label: 'ইনস্ট্যান্ট পেন্ডিং লক', sub: 'ডাবল-সেলিং স্বয়ংক্রিয় শতভাগ রোধ', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  { step: '০৪', icon: '🏛️', label: 'সাব-রেজিস্ট্রার সম্পাদন', sub: 'দলিল সৃষ্টি ও এসি ল্যান্ডে প্রস্তাব প্রেরণ', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { step: '০৫', icon: '⚖️', label: 'এসি ল্যান্ড PKI অনুমোদন', sub: 'ফিল্ড রিপোর্ট ও RSA-2048 সাইনিং', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  { step: '০৬', icon: '📄', label: 'ব্লকচেইন ডিজিটাল খতিয়ান', sub: 'QR কোডযুক্ত সনদ ও রেকর্ড হস্তান্তর', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
];

/* ─── 6 Core Security Upgrades ────────────────────────────── */
const CORE_UPGRADES = [
  {
    icon: <KeyRound size={24} />,
    badge: 'PKI Digital Signatures',
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
    subtitle: 'অপরিবর্তনীয় মালিকানা চেইন',
    desc: 'প্রতিটি দলিলের ক্রিপ্টোগ্রাফিক হ্যাশ পূর্ববর্তী দলিলের সাথে লিংক করে একটি ব্লকচেইন লেজার তৈরি করা হয়েছে। বিগত ৫০-১০০ বছরের মালিকানা চেইনে এক অক্ষরের পরিবর্তনও ধরা পড়বে।',
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
    title: 'ডাইনামিক ভৌগোলিক লোকেশন ইঞ্জিন',
    subtitle: 'ক্যাসকেডিং লোকেশন ফিল্টারিং',
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

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO SECTION — FORMAL NATIONAL THEME
      ══════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: '52px 20px 76px',
        backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 253, 244, 0.91) 50%, rgba(255, 255, 255, 0.93) 100%), url('/images/bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderBottom: '1.5px solid #cbd5e1',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Top Pill Badges */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 20px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(6,95,70,0.06)'
            }}>
              <img src="/images/logo.png" alt="e-ভূমি" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি মন্ত্রণালয়</span>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 8px #22c55e'
              }} />
            </div>
          </div>

          {/* Hero Content — Centered, Formal & Crisp */}
          <div style={{
            maxWidth: '920px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: '900',
              lineHeight: 1.2,
              color: '#0f172a',
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}>
              স্মার্ট ভূমি প্রশাসন ও দুর্নীতিমুক্ত{' '}
              <span style={{
                background: 'linear-gradient(135deg, #047857 0%, #15803d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                সমন্বিত ডিজিটাল ভূমি সেবা
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              color: '#334155',
              lineHeight: 1.8,
              marginBottom: '34px',
              maxWidth: '820px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              সাব-রেজিস্ট্রি এবং এসি ল্যান্ড অফিসের শতভাগ পেপারলেস সমন্বয়, পিকেআই (PKI) ডিজিটাল স্বাক্ষর, অপরিবর্তনীয় ব্লকচেইন হ্যাশ চেইনিং এবং রিয়েলটাইম পেন্ডিং লকযুক্ত জাতীয় এন্টারপ্রাইজ ভূমিসেবা প্ল্যাটফর্ম।
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
                  padding: '13px 30px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #065f46, #047857)',
                  color: '#ffffff',
                  boxShadow: '0 6px 20px rgba(6,95,70,0.25)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <LogIn size={18} /> পোর্টালে প্রবেশ করুন <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/verify')}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 26px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#065f46',
                  borderColor: '#a7f3d0',
                  background: '#f0fdf4',
                  cursor: 'pointer'
                }}
              >
                <Search size={18} /> খতিয়ান ও জমি অনুসন্ধান
              </button>

              <button
                onClick={() => navigate('/register')}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  background: '#ffffff',
                  borderColor: '#cbd5e1',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <UserPlus size={18} /> নাগরিক / প্রতিষ্ঠান নিবন্ধন
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
              fontSize: '13px',
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
          STATS BAR — FORMAL METRIC CARDS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{
          maxWidth: '1280px',
          margin: '-30px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
        }}>
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px 22px',
                border: '1.5px solid #cbd5e1',
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
                <span style={{ fontSize: '11.5px', color: s.color, fontWeight: '800', background: s.bg, padding: '2px 8px', borderRadius: '6px' }}>
                  সক্রিয়
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: s.color, marginBottom: '2px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HACKATHON CORE: EXISTING PROBLEMS VS E-BHUMI SOLUTIONS
      ══════════════════════════════════════════ */}
      <section style={{
        padding: '76px 20px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        marginTop: '36px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 16px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12.5px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Award size={14} color="#059669" />
              <span>হ্যাকথন স্পেশাল: জাতীয় সংকট ও প্রযুক্তিগত সমাধান</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: '900',
              color: '#0f172a',
              marginBottom: '12px',
              lineHeight: 1.25
            }}>
              প্রচলিত ভূমি ব্যবস্থাপনা সংকট ও{' '}
              <span style={{
                background: 'linear-gradient(135deg, #047857, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                e-ভূমি সফটওয়্যারের সমাধান
              </span>
            </h2>

            <p style={{ color: '#475569', fontSize: '15px', maxWidth: '720px', margin: '0 auto', lineHeight: 1.7 }}>
              বাংলাদেশের প্রচলিত ভূমি সেবায় শতাব্দীর পর শতাব্দী ধরে চলা মামলা, প্রতারণা ও দুর্নীতি নির্মূল করতে প্রবর্তিত ৫টি অত্যাধুনিক সমাধান:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {PROBLEM_SOLUTIONS.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${item.border}`,
                  borderRadius: '16px',
                  padding: '22px 20px',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: item.bg,
                      color: item.color,
                      fontFamily: 'monospace'
                    }}>
                      KEY PROBLEM #{idx + 1}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                      {item.tech}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', background: '#fef2f2', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                    <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5, fontWeight: '600' }}>
                      <strong>প্রচলিত সমস্যা:</strong> {item.problem}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13.5px', color: '#14532d', lineHeight: 1.5, fontWeight: '700' }}>
                      <strong>e-ভূমি সমাধান:</strong> {item.solution}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW PIPELINE — 6-STEP AUTOMATION
      ══════════════════════════════════════════ */}
      <section id="workflow" style={{
        padding: '76px 20px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1.5px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '46px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <TrendingUp size={13} /> ডিজিটাল কার্যপ্রবাহ
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              ৬-ধাপের সম্পূর্ণ সমন্বিত ভূমিসেবা পাইপলাইন
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              ম্যানুয়াল দৌড়াদৌড়ি ও ফাইলিং মুক্ত—আবেদন দাখিল থেকে ব্লকচেইন ডিজিটাল খতিয়ান সৃষ্টি পর্যন্ত সম্পূর্ণ স্বয়ংক্রিয়
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
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '11px',
                  fontWeight: '900',
                  color: f.color,
                  background: f.bg,
                  padding: '2px 7px',
                  borderRadius: '6px',
                }}>
                  {f.step}
                </div>

                <div style={{ fontSize: '32px', marginBottom: '12px', marginTop: '6px' }}>
                  {f.icon}
                </div>

                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
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
          5 ROLE PORTALS — ROLE-BASED ACCESS ARCHITECTURE
      ══════════════════════════════════════════ */}
      <section id="roles" style={{ padding: '76px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Star size={13} fill="#065f46" /> সমন্বিত পোর্টাল স্থাপত্য
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
              ভূমিকা ভিত্তিক ৫টি বিশেষায়িত ড্যাশবোর্ড
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              একক জাতীয় প্ল্যাটফর্মে প্রতিটি স্তরের কর্মকর্তা, নাগরিক ও ধর্মীয় প্রতিষ্ঠানের জন্য নির্ধারিত সুরক্ষিত অনুমতি
            </p>
          </div>

          {/* 5 Roles Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {ROLES.map((r, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveRole(i)}
                onMouseLeave={() => setActiveRole(null)}
                style={{
                  background: '#ffffff',
                  padding: '24px 20px',
                  border: `1.5px solid ${activeRole === i ? r.color : '#cbd5e1'}`,
                  borderRadius: '18px',
                  boxShadow: activeRole === i ? '0 12px 28px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                  transform: activeRole === i ? 'translateY(-5px)' : 'translateY(0)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: r.bg,
                    border: `1px solid ${r.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '14px',
                  }}>
                    {r.icon}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '3px' }}>
                    {r.role}
                  </h3>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: r.color,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}>
                    {r.subtitle}
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6, marginBottom: '18px' }}>
                    {r.desc}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {r.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#334155' }}>
                        <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={10} color={r.color} />
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
          ENTERPRISE SECURITY & ARCHITECTURE GRID
      ══════════════════════════════════════════ */}
      <section id="security" style={{
        padding: '76px 20px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 50%, #ffffff 100%)',
        borderTop: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '46px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 16px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12.5px',
              fontWeight: '700',
              marginBottom: '12px',
            }}>
              <Sparkles size={14} color="#059669" />
              <span>জাতীয় নিরাপত্তা ও প্রযুক্তিগত মানদণ্ড</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: '900',
              color: '#0f172a',
              marginBottom: '12px',
              lineHeight: 1.25
            }}>
              উন্নত ক্রিপ্টোগ্রাফি ও এন্টারপ্রাইজ ক্লাউড আর্কিটেকচার
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
            {CORE_UPGRADES.map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '24px',
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

                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: item.color, marginBottom: '12px' }}>
                    {item.subtitle}
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, marginBottom: '18px' }}>
                    {item.desc}
                  </p>
                </div>

                <div style={{
                  paddingTop: '14px',
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
          GUIDELINE VIDEO TUTORIAL SECTION
      ══════════════════════════════════════════ */}
      <section id="guide" style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '72px 20px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
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
              ডিজিটাল ভূমিসেবা গ্রহণ, খতিয়ান তল্লাশি, মালিকানা দাবি ও অনলাইন প্রক্রিয়াসমূহ সহজে বুঝতে ভিডিও নির্দেশিকাটি দেখুন।
            </p>
          </div>

          {/* Video Container (16:9 Aspect Ratio) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
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
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: '600' }}>১. খতিয়ান অনুসন্ধান</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: '600' }}>২. নাগরিক ড্যাশবোর্ড</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: '600' }}>৩. মালিকানা দাবি ফরম</span>
                <span style={{ background: '#ffffff', padding: '3px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontWeight: '600' }}>৪. ওয়াকফ প্রতিষ্ঠান হেফাজত</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALL TO ACTION (CTA) — FORMAL GOVERNMENT BANNER
      ══════════════════════════════════════════ */}
      <section id="helpline" style={{
        padding: '68px 20px',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fef3c7 100%)',
        borderTop: '1.5px solid #bbf7d0',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <img
            src="/images/logo.png"
            alt="e-ভূমি লোগো"
            style={{ width: '68px', height: '68px', objectFit: 'contain', margin: '0 auto 18px', display: 'block' }}
          />

          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '900', color: '#065f46', marginBottom: '14px', lineHeight: 1.25 }}>
            স্মার্ট বাংলাদেশ ২০৪১: দুর্নীতিমুক্ত ডিজিটাল ভূমি প্রশাসন
          </h2>

          <p style={{ fontSize: '15px', color: '#334155', maxWidth: '620px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            ঘরে বসেই নিজের ভূমির অধিকার যাচাই করুন, খতিয়ান পর্যবেক্ষণ করুন অথবা নির্ধারিত ভূমি কর্মকর্তা হিসেবে সিস্টেমে লগইন করুন।
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #065f46, #047857)',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(6,95,70,0.25)',
                border: 'none',
                cursor: 'pointer'
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
                fontWeight: '700',
                background: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <LogIn size={18} /> কর্মকর্তা পোর্টাল
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — OFFICIAL GOVERNMENT STANDARD
      ══════════════════════════════════════════ */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1.5px solid #e2e8f0',
        padding: '38px 20px 24px',
        color: '#475569',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            paddingBottom: '22px',
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: '700' }}>
                <PhoneCall size={14} /> হেল্পলাইন: ১৬১২২
              </span>
              <span onClick={() => navigate('/verify')} style={{ cursor: 'pointer', color: '#0369a1', fontWeight: '700' }}>
                খতিয়ান অনুসন্ধান
              </span>
              <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#065f46', fontWeight: '700' }}>
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
            paddingTop: '18px',
            fontSize: '12px',
            color: '#64748b'
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
            This Website is Developed By MD SAAD &amp; Md. Chand Mandol
          </div>
        </div>
      </footer>

    </div>
  );
}
