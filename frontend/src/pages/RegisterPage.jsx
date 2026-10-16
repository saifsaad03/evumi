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
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '860px', width: '100%', position: 'relative', zIndex: 1 }} className="animate-fade-in-up">

        {/* Compact Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <img 
              src="/images/logo.png" 
              alt="e-ভূমি লোগো" 
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }} 
            />
            <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              নতুন নাগরিক অ্যাকাউন্ট তৈরি করুন
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 9px',
              borderRadius: '999px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#15803d',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <ShieldCheck size={12} /> সুরক্ষিত নিবন্ধন
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '11.5px', margin: 0 }}>
            তথ্য পূরণ করে সাবমিট করুন · পরবর্তী ধাপে ইমেইলে প্রেরিত ৬ ডিজিটের ওটিপি যাচাই করে অ্যাকাউন্ট সক্রিয় হবে
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1.5px solid #cbd5e1',
          padding: '16px 22px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '6px 12px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '7px',
              color: '#b91c1c',
              fontSize: '11.5px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Row 1: Personal Information (3 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  নাগরিকের পূর্ণ নাম (Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="যেমন: মো. রহিম উদ্দিন"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  পিতার নাম (Father's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  placeholder="পিতার পূর্ণ নাম লিখুন"
                  value={formData.father_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  মাতার নাম (Mother's Name) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="mother_name"
                  required
                  placeholder="মাতার পূর্ণ নাম লিখুন"
                  value={formData.mother_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>
            </div>

            {/* Row 2: Identity & Contact (3 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  জাতীয় পরিচয়পত্র (NID) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nid"
                  required
                  placeholder="১০ বা ১৭ ডিজিটের এনআইডি"
                  value={formData.nid}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  মোবাইল নম্বর (Phone) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  ইমেইল ঠিকানা (Email) <span style={{ color: '#dc2626' }}>*</span> <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '10px' }}>[ওটিপি যাবে]</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '33px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #3b82f6'
                  }}
                />
              </div>
            </div>

            {/* Row 3: Administrative Cascading Selectors (Compact bar) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '7px 10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
                <MapPin size={12} /> স্থায়ী প্রশাসনিক এলাকা নির্বাচন
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Division */}
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>
                    বিভাগ (Division) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleDivisionChange}
                    style={{
                      width: '100%',
                      height: '30px',
                      padding: '0 6px',
                      fontSize: '11.5px',
                      borderRadius: '5px',
                      color: '#0f172a',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    {BANGLADESH_DIVISIONS.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>
                    জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    style={{
                      width: '100%',
                      height: '30px',
                      padding: '0 6px',
                      fontSize: '11.5px',
                      borderRadius: '5px',
                      color: '#0f172a',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    {districtsList.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>
                    উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleUpazilaChange}
                    style={{
                      width: '100%',
                      height: '30px',
                      padding: '0 6px',
                      fontSize: '11.5px',
                      borderRadius: '5px',
                      color: '#0f172a',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    {upazilasList.map(upz => (
                      <option key={upz} value={upz}>{upz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 4: Password & Submit Button (2 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#334155', marginBottom: '3px', fontWeight: '700' }}>
                  পাসওয়ার্ড (Password) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 9px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1'
                  }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: '15px', height: '15px' }}></span>
                      ওটিপি পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
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
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={13} style={{ flexShrink: 0 }} />
              <span>নিবন্ধন বাটনে ক্লিক করলে আপনার ইমেইলে ওটিপি কোড যাবে এবং স্বয়ংক্রিয়ভাবে ওটিপি যাচাই পেজ ওপেন হবে।</span>
            </div>

          </form>

          {/* Already have an account */}
          <div style={{
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '11.5px',
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
