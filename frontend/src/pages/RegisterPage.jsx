import { useState } from 'react';
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
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict
} from '../utils/geoData';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};

  // Administrative cascaded defaults: রাজশাহী > বগুড়া > শিবগঞ্জ
  const initialDivision = prefill.division || 'রাজশাহী';
  const initialDistricts = getDistrictsForDivision(initialDivision);
  const initialDistrict = prefill.district || 'বগুড়া';
  const initialUpazilas = getUpazilasForDistrict(initialDistrict);
  const initialUpazila = prefill.upazila || 'শিবগঞ্জ';

  const [formData, setFormData] = useState({
    name: prefill.name || '',
    father_name: prefill.father_name || '',
    mother_name: prefill.mother_name || '',
    nid: prefill.nid || '',
    division: initialDivision,
    district: initialDistrict,
    upazila: initialUpazila,
    phone: prefill.phone || '',
    email: prefill.email || '',
    password: prefill.password || ''
  });

  const [districtsList, setDistrictsList] = useState(initialDistricts);
  const [upazilasList, setUpazilasList] = useState(initialUpazilas);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascade handler for Division
  const handleDivisionChange = (e) => {
    const selectedDivision = e.target.value;
    const districts = getDistrictsForDivision(selectedDivision);
    const defaultDistrict = districts[0] || '';
    const upazilas = getUpazilasForDistrict(defaultDistrict);
    const defaultUpazila = upazilas[0] || '';

    setDistrictsList(districts);
    setUpazilasList(upazilas);

    setFormData(prev => ({
      ...prev,
      division: selectedDivision,
      district: defaultDistrict,
      upazila: defaultUpazila
    }));
  };

  // Cascade handler for District
  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    const upazilas = getUpazilasForDistrict(selectedDistrict);
    const defaultUpazila = upazilas[0] || '';

    setUpazilasList(upazilas);

    setFormData(prev => ({
      ...prev,
      district: selectedDistrict,
      upazila: defaultUpazila
    }));
  };

  const handleUpazilaChange = (e) => {
    const selectedUpazila = e.target.value;
    setFormData(prev => ({
      ...prev,
      upazila: selectedUpazila
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
    <div className="bd-pattern-bg" style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '820px', width: '100%', position: 'relative', zIndex: 1 }} className="animate-fade-in-up">

        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src="/images/logo.png" 
            alt="e-ভূমি লোগো" 
            style={{
              width: '68px',
              height: '68px',
              objectFit: 'contain',
              margin: '0 auto 12px',
              display: 'block'
            }} 
          />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 16px',
            borderRadius: '999px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#15803d',
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={14} /> বাংলাদেশ ভূমি প্রশাসন · সুরক্ষিত নাগরিক নিবন্ধন
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            নতুন নাগরিক অ্যাকাউন্ট তৈরি করুন
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            তথ্য পূরণ করে সাবমিট করুন। পরবর্তী ধাপে আপনার ইমেইলে প্রেরিত ৬ ডিজিটের ওটিপি যাচাই করে অ্যাকাউন্ট সক্রিয় হবে।
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Full Name & NID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  নাগরিকের পূর্ণ নাম (Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="name"
                    required
                    className="input-field"
                    placeholder="যেমন: মো. রহিম উদ্দিন"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: '100%', paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  জাতীয় পরিচয়পত্র নম্বর (NID) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nid"
                  required
                  className="input-field"
                  placeholder="১০ বা ১৭ ডিজিটের এনআইডি"
                  value={formData.nid}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Row 2: Father's Name & Mother's Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  পিতার নাম (Father's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  className="input-field"
                  placeholder="পিতার পূর্ণ নাম লিখুন"
                  value={formData.father_name}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  মাতার নাম (Mother's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="mother_name"
                  required
                  className="input-field"
                  placeholder="মাতার পূর্ণ নাম লিখুন"
                  value={formData.mother_name}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Row 3: Administrative Cascading Selectors */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                <MapPin size={16} style={{ color: '#16a34a' }} /> স্থায়ী প্রশাসনিক এলাকা নির্বাচন
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {/* Division */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                    বিভাগ (Division) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleDivisionChange}
                    className="input-field"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {BANGLADESH_DIVISIONS.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                    জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    className="input-field"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {districtsList.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                    উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleUpazilaChange}
                    className="input-field"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {upazilasList.map(upz => (
                      <option key={upz} value={upz}>{upz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4: Phone & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  মোবাইল নম্বর (Phone) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="input-field"
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                  ইমেইল ঠিকানা (Email) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="input-field"
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', borderColor: '#93c5fd' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  ✉️ এই ইমেইলে তাৎক্ষণিক ৬ ডিজিটের ওটিপি কোড পাঠানো হবে।
                </span>
              </div>
            </div>

            {/* Row 5: Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '600' }}>
                পাসওয়ার্ড (Password) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                className="input-field"
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            {/* Notice */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>নিবন্ধন বাটনে ক্লিক করলে সরাসরি ওটিপি জমা দেওয়ার পেজে নিয়ে যাওয়া হবে।</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '12px',
                marginTop: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
                  ওটিপি কোড পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <Send size={18} />
                  নিবন্ধন করুন ও ওটিপি যাচাই পেজে যান
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0',
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
      </div>
    </div>
  );
}
