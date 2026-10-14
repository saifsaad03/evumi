import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Mail,
  Key,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve pending registration payload from navigation state or sessionStorage
  const [regData, setRegData] = useState(() => {
    if (location.state && location.state.email) {
      sessionStorage.setItem('pending_registration', JSON.stringify(location.state));
      return location.state;
    }
    const cached = sessionStorage.getItem('pending_registration');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 6-digit OTP states
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [animatedIndex, setAnimatedIndex] = useState(null);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Timers: Resend cooldown (60s) & Expiry countdown (600s = 10 mins)
  const [resendCooldown, setResendCooldown] = useState(60);
  const [expiryCountdown, setExpiryCountdown] = useState(600);
  const [previewOtp, setPreviewOtp] = useState(regData?.previewOtp || null);
  const [resendSuccessMsg, setResendSuccessMsg] = useState(null);

  // Focus on first box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Expiry timer
  useEffect(() => {
    if (expiryCountdown <= 0) return;
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryCountdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format seconds to mm:ss in Bangla numerals
  const formatTimeBangla = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const englishTime = `${pad(mins)}:${pad(secs)}`;
    const bnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', ':': ':' };
    return englishTime.split('').map((char) => bnDigits[char] || char).join('');
  };

  // Handle digit typing
  const handleDigitChange = (index, value) => {
    const cleanChar = value.replace(/\D/g, '').slice(-1); // Only last numeric char
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);
    setError(null);

    if (cleanChar) {
      setAnimatedIndex(index);
      setTimeout(() => setAnimatedIndex(null), 300);

      // Auto advance to next input box
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle keydown for backspace & arrow navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle pasting full 6 digits
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    setError(null);

    // Focus on next empty box or the last one
    const targetIdx = Math.min(pastedData.length, 5);
    if (inputRefs.current[targetIdx]) {
      inputRefs.current[targetIdx].focus();
    }
  };

  // Auto-fill preview OTP
  const handleQuickFill = () => {
    if (!previewOtp) return;
    const otpArr = previewOtp.split('').slice(0, 6);
    setDigits(otpArr);
    setError(null);
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (resendCooldown > 0 || !regData?.email) return;
    setLoading(true);
    setError(null);
    setResendSuccessMsg(null);

    try {
      const res = await axios.post('/api/otp/send-registration-otp', {
        email: regData.email,
        nid: regData.nid,
        name: regData.name
      });

      if (res.data.success) {
        setResendCooldown(60);
        setExpiryCountdown(600);
        setDigits(['', '', '', '', '', '']);
        setResendSuccessMsg('আপনার ইমেইলে নতুন ওটিপি পাঠানো হয়েছে!');
        if (res.data.otpToken) {
          setRegData(prev => {
            const updated = { ...prev, otpToken: res.data.otpToken };
            sessionStorage.setItem('pending_registration', JSON.stringify(updated));
            return updated;
          });
        }
        if (res.data.previewOtp) {
          setPreviewOtp(res.data.previewOtp);
        }
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ওটিপি পুনরায় পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP & Verify
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = digits.join('');

    if (fullOtp.length !== 6) {
      setError('অনুগ্রহ করে পূর্ণ ৬ ডিজিটের ওটিপি কোড প্রদান করুন।');
      triggerShake();
      return;
    }

    if (!regData) {
      setError('নিবন্ধনের তথ্য অনুপস্থিত। অনুগ্রহ করে পুনরায় নিবন্ধন করুন।');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/otp/verify-and-register', {
        ...regData,
        otp: fullOtp,
        otpToken: regData.otpToken || null
      });

      if (res.data.success) {
        setIsSuccess(true);
        sessionStorage.removeItem('pending_registration');

        // Smooth redirect to Login page after celebration animation
        setTimeout(() => {
          navigate('/login', {
            state: {
              email: regData.email,
              registeredSuccess: true,
              message: '🎉 নাগরিক অ্যাকাউন্ট সফলভাবে সক্রিয় হয়েছে! অনুগ্রহ করে এখন লগইন করুন।'
            }
          });
        }, 1800);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message
        || (err.response?.status === 500 ? 'সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : null)
        || (err.message && !err.message.includes('status code') ? err.message : null)
        || 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন।';
      setError(errMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const filledCount = digits.filter(Boolean).length;

  // Fallback view if no registration was initiated
  if (!regData || !regData.email) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: '#f0f4f8'
      }}>
        <div className="glass-card animate-fade-in-up" style={{ maxWidth: '480px', width: '100%', padding: '36px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            border: '2px solid #fca5a5',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            fontSize: '28px'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            কোনো সক্রিয় ওটিপি অধিবেশন নেই
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            নাগরিক নিবন্ধনের জন্য প্রথমে আপনার ব্যক্তিগত ও প্রশাসনিক তথ্য পূরণ করুন।
          </p>
          <Link
            to="/register"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textDecoration: 'none',
              padding: '12px 24px',
              width: '100%'
            }}
          >
            <ArrowLeft size={16} /> নিবন্ধন পাতায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      background: '#f0f4f8'
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }} className="animate-fade-in-up">

        {/* ================= SUCCESS CELEBRATION VIEW ================= */}
        {isSuccess ? (
          <div className="glass-card success-pop" style={{
            padding: '44px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(22, 163, 74, 0.2)',
            border: '2px solid #86efac',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)'
            }}>
              <CheckCircle2 size={48} />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '999px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              <Sparkles size={14} /> ইমেইল ভেরিফিকেশন সফল!
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              নাগরিক অ্যাকাউন্ট তৈরি সম্পন্ন!
            </h1>

            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              অভিনন্দন <strong>{regData.name}</strong>! আপনার এনআইডি ও ইমেইল সফলভাবে নিশ্চিত করা হয়েছে।
            </p>

            <div style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#16a34a' }}></span>
              লগইন পেজে নিয়ে যাওয়া হচ্ছে...
            </div>

            <button
              onClick={() => navigate('/login', { state: { email: regData.email, registeredSuccess: true } })}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px'
              }}
            >
              এখনই লগইন করুন <ArrowRight size={18} />
            </button>
          </div>
        ) : (

          /* ================= MAIN OTP SUBMIT CARD ================= */
          <div className="glass-card" style={{ padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>

            {/* Top decorative pulse aura */}
            <div style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '180px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(22, 163, 74, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Header Badge & Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
              {/* Animated Floating Icon */}
              <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 16px' }}>
                <div
                  className="pulse-ring-element"
                  style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    background: 'rgba(22, 163, 74, 0.12)',
                    zIndex: 0
                  }}
                />
                <div style={{
                  position: 'relative',
                  width: '72px',
                  height: '72px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 8px 24px rgba(26, 107, 60, 0.28)',
                  zIndex: 1
                }}>
                  <Mail size={34} />
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '999px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: '700',
                marginBottom: '10px'
              }}>
                <ShieldCheck size={13} /> জাতীয় পরিচয়পত্র ও ইমেইল ভেরিফিকেশন
              </div>

              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                ইমেইল ওটিপি যাচাই করুন
              </h1>

              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                আপনার ইমেইল <strong style={{ color: '#0f172a' }}>{regData.email}</strong> এ একটি ৬ ডিজিটের কোড পাঠানো হয়েছে।
              </p>
            </div>

            {/* Error Message with Shake Animation */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Resend Success Message */}
            {resendSuccessMsg && (
              <div style={{
                padding: '10px 16px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} /> {resendSuccessMsg}
              </div>
            )}

            {/* Simulation Preview Mode Banner (if SMTP fallback was used) */}
            {previewOtp && (
              <div style={{
                padding: '12px 16px',
                background: '#fef3c7',
                border: '1px dashed #f59e0b',
                borderRadius: '12px',
                color: '#92400e',
                fontSize: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  💡 <strong>টেস্ট মোড ওটিপি:</strong>{' '}
                  <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'monospace', color: '#b45309', letterSpacing: '2px' }}>
                    {previewOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  স্বয়ংক্রিয় বসান
                </button>
              </div>
            )}

            {/* ================= 6-DIGIT ANIMATED INPUT BOXES ================= */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '22px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '14px'
                }}
                className={isShaking ? 'otp-shake' : ''}
                onPaste={handlePaste}
                >
                  {digits.map((digit, index) => {
                    const isFilled = Boolean(digit);
                    const isJustTyped = animatedIndex === index;
                    return (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`otp-box-input ${isFilled ? 'filled' : ''} ${isJustTyped ? 'digit-animated' : ''}`}
                        autoFocus={index === 0}
                        aria-label={`Digit ${index + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Progress bar and digit count indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                    <div style={{
                      width: '60px',
                      height: '5px',
                      borderRadius: '999px',
                      background: '#e2e8f0',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(filledCount / 6) * 100}%`,
                        background: filledCount === 6 ? '#16a34a' : '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span>{filledCount}/৬ ডিজিট</span>
                  </div>

                  {/* Expiry Countdown */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: expiryCountdown < 60 ? '#dc2626' : '#64748b'
                  }}>
                    <Clock size={13} />
                    <span>মেয়াদ: {formatTimeBangla(expiryCountdown)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || filledCount !== 6}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  cursor: filledCount === 6 && !loading ? 'pointer' : 'not-allowed',
                  opacity: filledCount === 6 && !loading ? 1 : 0.65
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    ওটিপি যাচাই ও নাগরিক অ্যাকাউন্ট নিশ্চিত করুন
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions: Resend & Edit Details */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}>
              {/* Back to Edit Registration */}
              <button
                type="button"
                onClick={() => navigate('/register', { state: regData })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 0'
                }}
              >
                <ArrowLeft size={14} /> তথ্য সংশোধন করুন
              </button>

              {/* Resend OTP button */}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94a3b8' : '#16a34a',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 0'
                }}
              >
                <RotateCcw size={14} className={loading ? 'animate-spin-slow' : ''} />
                {resendCooldown > 0 ? (
                  <span>পুনরায় কোড পাঠান ({formatTimeBangla(resendCooldown)})</span>
                ) : (
                  <span>পুনরায় কোড পাঠান</span>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b'
            }}>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" style={{ color: '#16a34a', fontWeight: '700', textDecoration: 'none' }}>
                লগইন করুন
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
