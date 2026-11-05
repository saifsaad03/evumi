import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  UserPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  Send
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};

  const [formData, setFormData] = useState({
    name: prefill.name || '',
    father_name: prefill.father_name || '',
    mother_name: prefill.mother_name || '',
    nid: prefill.nid || '',
    division: prefill.division || '',
    district: prefill.district || '',
    upazila: prefill.upazila || '',
    mouza: prefill.mouza || '',
    phone: prefill.phone || '',
    email: prefill.email || '',
    password: prefill.password || ''
  });

  // Dynamic location lists loaded from Admin Panel database
  const [divisionsList, setDivisionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [upazilasList, setUpazilasList] = useState([]);
  const [mouzasList, setMouzasList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─────────────────────────────────────────────────────────────
  // Dynamic Locations Fetching from Database (Admin Panel Configured)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get('/api/locations/divisions');
      if (res.data.success && res.data.data.length > 0) {
        const divs = res.data.data;
        setDivisionsList(divs);

        // ONLY prefill if prefill.division was explicitly passed via navigation state!
        if (prefill.division) {
          const matchedDiv = divs.find(d => d.name === prefill.division);
          if (matchedDiv) {
            setFormData(p => ({ ...p, division: matchedDiv.name }));
            await loadDistricts(matchedDiv._id);
          }
        }
      } else {
        setDivisionsList([]);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic divisions:', err);
      setDivisionsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadDistricts = async (divId) => {
    try {
      const res = await axios.get(`/api/locations/districts?division_id=${divId}`);
      if (res.data.success && res.data.data.length > 0) {
        const dists = res.data.data;
        setDistrictsList(dists);

        // ONLY prefill if prefill.district was explicitly passed!
        if (prefill.district) {
          const matchedDist = dists.find(d => d.name === prefill.district);
          if (matchedDist) {
            setFormData(p => ({ ...p, district: matchedDist.name }));
            await loadUpazilas(matchedDist._id);
          }
        }
      } else {
        setDistrictsList([]);
      }
    } catch (err) {
      console.warn('Failed to fetch districts:', err);
      setDistrictsList([]);
    }
  };

  const loadUpazilas = async (distId) => {
    try {
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}`);
      if (res.data.success && res.data.data.length > 0) {
        const upzs = res.data.data;
        setUpazilasList(upzs);

        // ONLY prefill if prefill.upazila was explicitly passed!
        if (prefill.upazila) {
          const matchedUpz = upzs.find(u => u.name === prefill.upazila);
          if (matchedUpz) {
            setFormData(p => ({ ...p, upazila: matchedUpz.name }));
            await loadMouzas(matchedUpz._id);
          }
        }
      } else {
        setUpazilasList([]);
      }
    } catch (err) {
      console.warn('Failed to fetch upazilas:', err);
      setUpazilasList([]);
    }
  };

  const loadMouzas = async (upzId) => {
    try {
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}`);
      if (res.data.success && res.data.data.length > 0) {
        const mzs = res.data.data;
        setMouzasList(mzs);

        // ONLY prefill if prefill.mouza was explicitly passed!
        if (prefill.mouza) {
          const matchedMz = mzs.find(m => m.name === prefill.mouza);
          if (matchedMz) {
            setFormData(p => ({ ...p, mouza: matchedMz.name }));
          }
        }
      } else {
        setMouzasList([]);
      }
    } catch (err) {
      console.warn('Failed to fetch mouzas:', err);
      setMouzasList([]);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Cascading Selection Handlers (No Auto-Selection of Children)
  // ─────────────────────────────────────────────────────────────
  const handleDivisionChange = (e) => {
    const selectedDivName = e.target.value;
    const divObj = divisionsList.find(d => d.name === selectedDivName);
    
    // Reset all child levels so nothing is auto-selected!
    setFormData(prev => ({
      ...prev,
      division: selectedDivName,
      district: '',
      upazila: '',
      mouza: ''
    }));
    setUpazilasList([]);
    setMouzasList([]);

    if (divObj) {
      loadDistricts(divObj._id);
    } else {
      setDistrictsList([]);
    }
  };

  const handleDistrictChange = (e) => {
    const selectedDistName = e.target.value;
    const distObj = districtsList.find(d => d.name === selectedDistName);
    
    // Reset upazila and mouza so they are not auto-selected!
    setFormData(prev => ({
      ...prev,
      district: selectedDistName,
      upazila: '',
      mouza: ''
    }));
    setMouzasList([]);

    if (distObj) {
      loadUpazilas(distObj._id);
    } else {
      setUpazilasList([]);
    }
  };

  const handleUpazilaChange = (e) => {
    const selectedUpzName = e.target.value;
    const upzObj = upazilasList.find(u => u.name === selectedUpzName);
    
    // Reset mouza so it is not auto-selected!
    setFormData(prev => ({
      ...prev,
      upazila: selectedUpzName,
      mouza: ''
    }));

    if (upzObj) {
      loadMouzas(upzObj._id);
    } else {
      setMouzasList([]);
    }
  };

  const handleMouzaChange = (e) => {
    const selectedMouzaName = e.target.value;
    setFormData(prev => ({
      ...prev,
      mouza: selectedMouzaName
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Step 1: Send Registration OTP & Navigate to /verify-otp
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.name.trim() || !formData.father_name.trim() || !formData.mother_name.trim()) {
      setError('অনুগ্রহ করে নাম, পিতার নাম এবং মাতার নাম সঠিকভাবে পূরণ করুন।');
      return;
    }
    if (!formData.division || !formData.district || !formData.upazila || !formData.mouza) {
      setError('অনুগ্রহ করে স্থায়ী এলাকার বিভাগ, জেলা, উপজেলা এবং মৌজা নির্বাচন করুন।');
      return;
    }
    if (formData.nid.trim().length < 10) {
      setError('জাতীয় পরিচয়পত্র (NID) নম্বর ১০, ১৩ অথবা ১৭ ডিজিটের হতে হবে।');
      return;
    }
    if (formData.phone.trim().length < 11) {
      setError('১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (!confirmPassword) {
      setError('অনুগ্রহ করে কনফার্ম পাসওয়ার্ড ফিল্ডটি পূরণ করুন।');
      return;
    }
    if (formData.password !== confirmPassword) {
      setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না। অনুগ্রহ করে একই পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/otp/send-registration-otp', {
        email: formData.email.trim().toLowerCase(),
        nid: formData.nid.trim(),
        name: formData.name.trim()
      });

      if (res.data.success) {
        const payload = {
          ...formData,
          email: formData.email.trim().toLowerCase(),
          nid: formData.nid.trim(),
          name: formData.name.trim(),
          otpToken: res.data.otpToken || null,
          otpMessage: res.data.message
        };

        // Cache in sessionStorage for persistence across refresh
        sessionStorage.setItem('pending_registration', JSON.stringify(payload));

        // Navigate immediately to the dedicated OTP submission page
        navigate('/verify-otp', { state: payload });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message
        || (err.response?.status === 500 ? 'সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।' : null)
        || (err.message && !err.message.includes('status code') ? err.message : null)
        || 'ওটিপি পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bd-pattern-bg register-container">
      <div style={{ maxWidth: '1040px', width: '100%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }} className="animate-fade-in-up">

        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px 12px',
            marginBottom: '6px'
          }}>
            <img 
              src="/images/logo.png" 
              alt="e-ভূমি লোগো" 
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                flexShrink: 0
              }} 
            />
            <h1 style={{
              fontSize: 'clamp(18px, 4.5vw, 21px)',
              fontWeight: '800',
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.3
            }}>
              নতুন নাগরিক অ্যাকাউন্ট তৈরি করুন
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#15803d',
              fontSize: '11.5px',
              fontWeight: '700',
              whiteSpace: 'nowrap'
            }}>
              <ShieldCheck size={14} /> সুরক্ষিত নিবন্ধন
            </span>
          </div>
          <p style={{
            color: '#64748b',
            fontSize: 'clamp(11.5px, 3.2vw, 12.5px)',
            margin: 0,
            lineHeight: 1.4,
            padding: '0 4px'
          }}>
            তথ্য পূরণ করে সাবমিট করুন · পরবর্তী ধাপে ইমেইলে প্রেরিত ৬ ডিজিটের ওটিপি যাচাই করে অ্যাকাউন্ট সক্রিয় হবে
          </p>
        </div>

        {/* Form Card */}
        <div className="register-card">

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '9px 14px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '12.5px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontWeight: '600',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Row 1: Personal Information (Responsive Grid) */}
            <div className="register-grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  নাগরিকের পূর্ণ নাম (Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="যেমন: মো. রহিম উদ্দিন"
                  value={formData.name}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  পিতার নাম (Father's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  placeholder="পিতার পূর্ণ নাম লিখুন"
                  value={formData.father_name}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  মাতার নাম (Mother's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="mother_name"
                  required
                  placeholder="মাতার পূর্ণ নাম লিখুন"
                  value={formData.mother_name}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>
            </div>

            {/* Row 2: Identity & Contact (Responsive Grid) */}
            <div className="register-grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  জাতীয় পরিচয়পত্র (NID) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nid"
                  required
                  placeholder="১০ বা ১৭ ডিজিটের এনআইডি"
                  value={formData.nid}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  মোবাইল নম্বর (Phone) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  ইমেইল ঠিকানা (Email) <span style={{ color: '#dc2626' }}>*</span> <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '11px' }}>[ওটিপি যাবে]</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="register-input"
                  style={{ borderColor: '#3b82f6' }}
                />
              </div>
            </div>

            {/* Row 3: Administrative Cascading Selectors (Dynamically Loaded from Admin Panel) */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 14px'
            }} className="register-location-box">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px 12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#0f766e',
                  lineHeight: 1.3
                }}>
                  <MapPin size={14} color="#0d9488" style={{ flexShrink: 0 }} />
                  <span>স্থায়ী প্রশাসনিক এলাকা (এডমিন প্যানেলে যুক্ত এলাকা অনুযায়ী ডায়নামিক)</span>
                </div>
                {loadingLocations && (
                  <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    ডাটা লোড হচ্ছে...
                  </span>
                )}
              </div>

              <div className="register-grid-location">
                {/* 1. Division */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                    বিভাগ (Division) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleDivisionChange}
                    required
                    className="register-select"
                  >
                    <option value="">-- বিভাগ বেছে নিন --</option>
                    {divisionsList.map(div => (
                      <option key={div._id || div.name} value={div.name}>{div.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. District */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                    জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    required
                    disabled={!formData.division || districtsList.length === 0}
                    className="register-select"
                    style={{
                      background: (!formData.division || districtsList.length === 0) ? '#f1f5f9' : '#ffffff',
                      cursor: (!formData.division || districtsList.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {!formData.division ? '-- প্রথমে বিভাগ নির্বাচন করুন --' : (districtsList.length === 0 ? '-- কোনো জেলা নেই --' : '-- জেলা বেছে নিন --')}
                    </option>
                    {districtsList.map(dist => (
                      <option key={dist._id || dist.name} value={dist.name}>{dist.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Upazila */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                    উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleUpazilaChange}
                    required
                    disabled={!formData.district || upazilasList.length === 0}
                    className="register-select"
                    style={{
                      background: (!formData.district || upazilasList.length === 0) ? '#f1f5f9' : '#ffffff',
                      cursor: (!formData.district || upazilasList.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {!formData.district ? '-- প্রথমে জেলা নির্বাচন করুন --' : (upazilasList.length === 0 ? '-- কোনো উপজেলা নেই --' : '-- উপজেলা বেছে নিন --')}
                    </option>
                    {upazilasList.map(upz => (
                      <option key={upz._id || upz.name} value={upz.name}>{upz.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Mouza */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                    মৌজা (Mouza) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="mouza"
                    value={formData.mouza}
                    onChange={handleMouzaChange}
                    required
                    disabled={!formData.upazila || mouzasList.length === 0}
                    className="register-select"
                    style={{
                      background: (!formData.upazila || mouzasList.length === 0) ? '#f1f5f9' : '#ffffff',
                      cursor: (!formData.upazila || mouzasList.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">
                      {!formData.upazila ? '-- প্রথমে উপজেলা নির্বাচন করুন --' : (mouzasList.length === 0 ? '-- কোনো মৌজা নেই --' : '-- মৌজা বেছে নিন --')}
                    </option>
                    {mouzasList.map(mz => (
                      <option key={mz._id || mz.name} value={mz.name}>
                        {mz.name} {mz.jl_no ? `(জে.এল: ${mz.jl_no})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4: Password & Submit Button (Responsive Grid) */}
            <div className="register-grid-3" style={{ alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  পাসওয়ার্ড (Password) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  value={formData.password}
                  onChange={handleChange}
                  className="register-input"
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '4px', fontWeight: '700' }}>
                  <span>কনফার্ম পাসওয়ার্ড (Confirm) <span style={{ color: '#dc2626' }}>*</span></span>
                  {confirmPassword && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: formData.password === confirmPassword ? '#16a34a' : '#dc2626'
                    }}>
                      {formData.password === confirmPassword ? '✓ মিলেছে' : '✕ মিলছে না'}
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  placeholder="পুনরায় একই পাসওয়ার্ড লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="register-input"
                  style={{
                    borderColor: confirmPassword 
                      ? (formData.password === confirmPassword ? '#16a34a' : '#dc2626') 
                      : '#cbd5e1'
                  }}
                />
              </div>

              <div className="register-submit-col">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '38px',
                    minHeight: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '800',
                    borderRadius: '7px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                      ওটিপি পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      নিবন্ধন ও ওটিপি যাচাই করুন
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compact Notice */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '7px',
              padding: '8px 12px',
              fontSize: '11.5px',
              color: '#15803d',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '7px',
              lineHeight: 1.4
            }}>
              <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>নিবন্ধন বাটনে ক্লিক করলে আপনার ইমেইলে ওটিপি কোড যাবে এবং স্বয়ংক্রিয়ভাবে ওটিপি যাচাই পেজ ওপেন হবে।</span>
            </div>

          </form>

          {/* Already have an account */}
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '12.5px',
            color: '#64748b'
          }}>
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link to="/login" style={{ color: '#16a34a', fontWeight: '800', textDecoration: 'none' }}>
              লগইন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
