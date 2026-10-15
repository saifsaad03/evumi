import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Search, UserCheck, Send, CheckCircle, Clock, AlertTriangle, FileText, Layers, Hash, MapPin, Sparkles } from 'lucide-react';
import P4RegistryPanel from './P4RegistryPanel';
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getMouzasForUpazila,
  getJlNoForMouza
} from '../utils/geoData';

export default function RegisterOfficeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'deed_registry'

  // Cascade Filter State (Defaulted to Rajshahi > Bogura > Shibganj > গুজিয়া)
  const [filter, setFilter] = useState({
    division: 'রাজশাহী',
    district: 'বগুড়া',
    upazila: 'শিবগঞ্জ',
    mouza: 'গুজিয়া',
    jl_no: '1',
    khatian_no: '',
    dag_no: ''
  });

  // Dynamic Options
  const [divisionsList] = useState(BANGLADESH_DIVISIONS);
  const [districtsList, setDistrictsList] = useState(getDistrictsForDivision('রাজশাহী'));
  const [upazilasList, setUpazilasList] = useState(getUpazilasForDistrict('বগুড়া'));
  const [mouzasList, setMouzasList] = useState(getMouzasForUpazila('শিবগঞ্জ'));

  // Cascade change handlers
  const handleDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const defaultDist = districts[0] || 'বগুড়া';
    const upazilas = getUpazilasForDistrict(defaultDist);
    const defaultUpazila = upazilas[0] || 'শিবগঞ্জ';
    const mouzas = getMouzasForUpazila(defaultUpazila);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setDistrictsList(districts);
    setUpazilasList(upazilas);
    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      division: div,
      district: defaultDist,
      upazila: defaultUpazila,
      mouza: defaultMouza,
      jl_no: jl
    }));
  };

  const handleDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const defaultUpazila = upazilas[0] || 'শিবগঞ্জ';
    const mouzas = getMouzasForUpazila(defaultUpazila);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setUpazilasList(upazilas);
    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      district: dist,
      upazila: defaultUpazila,
      mouza: defaultMouza,
      jl_no: jl
    }));
  };

  const handleUpazilaChange = (upz) => {
    const mouzas = getMouzasForUpazila(upz);
    const defaultMouza = mouzas[0]?.mouza || 'গুজিয়া';
    const jl = mouzas[0]?.jl_no || '1';

    setMouzasList(mouzas);
    setFilter(prev => ({
      ...prev,
      upazila: upz,
      mouza: defaultMouza,
      jl_no: jl
    }));
  };

  const handleMouzaChange = (mouzaName) => {
    const jl = getJlNoForMouza(mouzaName);
    setFilter(prev => ({
      ...prev,
      mouza: mouzaName,
      jl_no: jl
    }));
  };

  // Selected land & found user
  const [selectedLand, setSelectedLand] = useState(null);
  const [searchingLand, setSearchingLand] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // Volume & Page fields (placed directly above Assign button)
  const [volumeBook, setVolumeBook] = useState('');
  const [pageNo, setPageNo] = useState('');
  const [deedNo, setDeedNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Submitting
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [assignError, setAssignError] = useState(null);

  // Citizen Email OTP verification states
  const [citizenOtp, setCitizenOtp] = useState('');
  const [sendingCitizenOtp, setSendingCitizenOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState(null);
  const [otpPreview, setOtpPreview] = useState(null);
  const [otpError, setOtpError] = useState(null);

  // Sent Requests List
  const [sentRequests, setSentRequests] = useState([]);

  // Check if land is actually allocated to a private citizen (not unassigned / khas)
  const checkIsAllocated = (land) => {
    if (!land) return false;
    if (land.status === 'Pending_AC_Land_Review' || land.status === 'Pending_Mutation' || land.status === 'Sold') {
      return true;
    }
    const isUnassigned = !land.owner_nid ||
      land.owner_nid === '1000000000000' ||
      land.owner_nid === 'অনলাইনে রেকর্ড নেই' ||
      land.owner_name === 'অনলাইনে অনিবন্ধিত' ||
      (land.owner_name && land.owner_name.includes('সরকার')) ||
      (land.owner_name && land.owner_name.includes('খাস'));

    return !isUnassigned;
  };

  useEffect(() => {
    fetchSentRequests();
    handleSearchLand();
    handleSearchUser();
  }, []);

  const fetchSentRequests = async () => {
    try {
      const res = await axios.get('/api/assign/requests');
      if (res.data.success) {
        setSentRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const handleSearchLand = async () => {
    setSearchingLand(true);
    setAssignSuccess(null);
    try {
      const res = await axios.get('/api/assign/search-land', {
        params: {
          mouza: filter.mouza,
          dag_no: filter.dag_no
        }
      });
      if (res.data.success && res.data.data.length > 0) {
        setSelectedLand(res.data.data[0]);
      } else {
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Land search error:', err);
    } finally {
      setSearchingLand(false);
    }
  };

  const handleSearchUser = async () => {
    if (!userQuery) return;
    setSearchingUser(true);
    setUserError(null);
    try {
      const res = await axios.get('/api/assign/search-user', {
        params: { query: userQuery }
      });
      if (res.data.success) {
        setFoundUser(res.data.data);
      }
    } catch (err) {
      setUserError(err.response?.data?.message || 'নাগরিক খুঁজে পাওয়া যায়নি');
      setFoundUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSendCitizenOtp = async () => {
    if (!foundUser) {
      alert('অনুগ্রহ করে প্রথমে লক্ষ্য নাগরিক খুঁজে বের করুন!');
      return;
    }
    if (!selectedLand) {
      alert('অনুগ্রহ করে জমি নির্বাচন করুন!');
      return;
    }
    setSendingCitizenOtp(true);
    setOtpSentMessage(null);
    setOtpPreview(null);
    setOtpError(null);
    try {
      const res = await axios.post('/api/otp/send-land-assign-otp', {
        citizen_nid: foundUser.nid,
        citizen_email: foundUser.email,
        dag_no: selectedLand.dag_no,
        mouza: selectedLand.mouza,
        land_record_id: selectedLand._id
      });
      if (res.data.success) {
        setOtpSentMessage(res.data.message);
        if (res.data.previewOtp) {
          setOtpPreview(res.data.previewOtp);
        }
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'নাগরিকের ইমেইলে ওটিপি পাঠানো যায়নি।');
    } finally {
      setSendingCitizenOtp(false);
    }
  };

  const handleAssignLand = async (e) => {
    e.preventDefault();
    if (!selectedLand) {
      alert('অনুগ্রহ করে প্রথমে জমি নির্বাচন করুন!');
      return;
    }
    if (!foundUser) {
      alert('অনুগ্রহ করে লক্ষ্য নাগরিক খুঁজে নির্বাচন করুন!');
      return;
    }
    if (!volumeBook || !pageNo) {
      alert('ভলিউম বই নম্বর এবং পৃষ্ঠা নম্বর প্রদান আবশ্যক!');
      return;
    }
    if (!citizenOtp || citizenOtp.trim().length !== 6) {
      alert('🔒 নাগরিকের ইমেইল ওটিপি (৬ ডিজিট) প্রদান আবশ্যক!');
      return;
    }

    setAssigning(true);
    setAssignSuccess(null);
    setAssignError(null);

    try {
      const res = await axios.post('/api/assign/create-request', {
        land_record_id: selectedLand._id,
        user_nid: foundUser.nid,
        volume_book: volumeBook,
        page_no: pageNo,
        deed_no: deedNo,
        remarks: remarks,
        otp: citizenOtp.trim()
      });

      if (res.data.success) {
        setAssignSuccess(res.data.message);
        setCitizenOtp('');
        setOtpSentMessage(null);
        setOtpPreview(null);
        fetchSentRequests();
        handleSearchLand(); // refresh land status
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || 'বরাদ্দ অনুরোধ পাঠানো ব্যর্থ হয়েছে');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="dashboard-dark" style={{ paddingTop: '1px', paddingBottom: '40px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 20px' }}>
        {/* Header Banner */}
        <div className="glass-card" style={{
          padding: '20px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(59,130,246,0.35)'
            }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  সাব-রেজিস্ট্রি অফিস ড্যাশবোর্ড
                </h1>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  fontWeight: '700'
                }}>
                  Register Office
                </span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '4px 0 0 0' }}>
                কর্মকর্তা: <strong style={{ color: '#f1f5f9' }}>{user?.name || 'সাব-রেজিস্ট্রার'}</strong> | {user?.office_details?.office_name || 'উপজেলা সাব-রেজিস্ট্রি অফিস'}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar + Main Content */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <aside style={{
            width: '280px',
            flexShrink: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px 16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#94a3b8',
              padding: '0 8px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px'
            }}>
              রেজিস্ট্রি ফিচার মেনু
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Feature 1: সরকারি জমি বরাদ্দ */}
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: activeTab === 'assign'
                    ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.9), rgba(3, 105, 161, 0.95))'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: activeTab === 'assign' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  boxShadow: activeTab === 'assign' ? '0 6px 20px rgba(2, 132, 199, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: activeTab === 'assign' ? 'rgba(255,255,255,0.2)' : 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTab === 'assign' ? '#ffffff' : '#38bdf8',
                  flexShrink: 0
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ color: '#ffffff', lineHeight: 1.3 }}>🏛️ সরকারি জমি বরাদ্দ</div>
                  <div style={{ fontSize: '11px', color: activeTab === 'assign' ? '#e0f2fe' : '#94a3b8', fontWeight: '400' }}>
                    খাস জমি বরাদ্দ প্রস্তাব
                  </div>
                </div>
              </button>

              {/* Feature 2: অ্যান্টি-ডাবল সেলিং প্যানেল */}
              <button
                type="button"
                onClick={() => setActiveTab('deed_registry')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: activeTab === 'deed_registry'
                    ? 'linear-gradient(135deg, rgba(29, 78, 216, 0.9), rgba(37, 99, 235, 0.95))'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: activeTab === 'deed_registry' ? '1.5px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  boxShadow: activeTab === 'deed_registry' ? '0 6px 20px rgba(37, 99, 235, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: activeTab === 'deed_registry' ? 'rgba(255,255,255,0.2)' : 'rgba(96, 165, 250, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeTab === 'deed_registry' ? '#ffffff' : '#60a5fa',
                  flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ color: '#ffffff', lineHeight: 1.3 }}>🛡️ অ্যান্টি-ডাবল সেলিং প্যানেল</div>
                  <div style={{ fontSize: '11px', color: activeTab === 'deed_registry' ? '#dbeafe' : '#94a3b8', fontWeight: '400' }}>
                    দলিল নিবন্ধন ও যাচাইকরণ
                  </div>
                </div>
              </button>
            </div>
          </aside>

          {/* Right Main Content */}
          <main style={{ flex: 1, minWidth: 0 }}>

      {activeTab === 'assign' && (
        <div>
          {/* Instructions bar */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Building2 size={20} color="#60a5fa" />
            <div>
              <strong>ওয়ার্কফ্লো নির্দেশিকা:</strong> ১. ক্যাসকেড ফিল্টার দিয়ে জমি খুঁজুন ➔ ২. নাগরিকের NID দিয়ে ইউজার বের করুন ➔ ৩. ভলিউম বই ও পৃষ্ঠা নম্বর লিখুন ➔ ৪. 'এসি ল্যান্ডে পাঠান' বাটনে ক্লিক করুন। এসি ল্যান্ড রিভিউ করে অনুমোদন দিলে স্বয়ংক্রিয়ভাবে নাগরিকের নামে বরাদ্দ সম্পন্ন হবে।
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(320px, 1fr)', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Cascade Land Filter & Citizen Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Cascade Filter Box */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#60a5fa" /> ক্যাসকেড ফিল্টার (জমি অনুসন্ধান)
                </h3>

                {/* Flow indicators */}
                <div style={{
                  fontSize: '11px',
                  color: '#93c5fd',
                  marginBottom: '16px',
                  background: 'rgba(59,130,246,0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>
                  বিভাগ ➔ জেলা ➔ উপজেলা/সার্কেল ➔ মৌজা ➔ জেল নম্বর ➔ খতিয়ান ➔ দাগ নম্বর
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>১. বিভাগ (Division)</label>
                    <select
                      className="input-field"
                      value={filter.division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    >
                      {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>২. জেলা (District)</label>
                    <select
                      className="input-field"
                      value={filter.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    >
                      {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>৩. উপজেলা (Upazila)</label>
                    <select
                      className="input-field"
                      value={filter.upazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    >
                      {upazilasList.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>৪. মৌজা (মৌজা ও জে.এল)</label>
                    <select
                      className="input-field"
                      value={filter.mouza}
                      onChange={(e) => handleMouzaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    >
                      {mouzasList.map(m => (
                        <option key={m.jl_no + m.mouza} value={m.mouza}>
                          {m.mouza} (জে.এল {m.jl_no})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>৫. জে.এল নং (স্বয়ংক্রিয়)</label>
                    <input
                      type="text"
                      readOnly
                      className="input-field"
                      value={filter.jl_no}
                      style={{ width: '100%', fontSize: '12px', background: 'rgba(255,255,255,0.06)', color: '#86efac', fontWeight: '600' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>৬. খতিয়ান নং</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="খতিয়ান নং লিখুন"
                      value={filter.khatian_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, khatian_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>৭. দাগ নং (প্লট)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="দাগ নং লিখুন"
                      value={filter.dag_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, dag_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px', color: '#f8fafc' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchLand}
                  className="btn-primary"
                  style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Search size={16} /> জমি ফিল্টার ও নির্বাচন করুন
                </button>
              </div>

              {/* Selected Land Preview */}
              {selectedLand && (() => {
                const isLandAllocated = checkIsAllocated(selectedLand);
                const displayOwnerName = isLandAllocated ? selectedLand.owner_name : 'অনলাইনে অনিবন্ধিত';
                const displayOwnerNid = isLandAllocated ? selectedLand.owner_nid : 'প্রযোজ্য নয় (অনলাইনে অনিবন্ধিত)';

                return (
                  <div className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${isLandAllocated ? '#ef4444' : '#10b981'}`, background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                        নির্বাচিত জমি: দাগ {selectedLand.dag_no} (মৌজা: {selectedLand.mouza})
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: isLandAllocated ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: isLandAllocated ? '#fca5a5' : '#86efac',
                        border: `1px solid ${isLandAllocated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                        fontWeight: '700'
                      }}>
                        {isLandAllocated ? '🔒 বরাদ্দকৃত / লক' : '🟢 বরাদ্দযোগ্য সরকারি খাস জমি'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '13px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '2px' }}>খতিয়ান:</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedLand.khatian_no || '১'}</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '2px' }}>জে.এল নং:</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedLand.jl_no}</strong>
                      </div>
                      <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                        <span style={{ color: '#86efac', display: 'block', fontSize: '11px', marginBottom: '2px' }}>মোট পরিমাণ:</span>
                        <strong style={{ color: '#4ade80', fontSize: '14px' }}>{selectedLand.total_area_decimal} শতক</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '2px' }}>বর্তমান মালিক:</span>
                        <strong style={{ color: isLandAllocated ? '#fca5a5' : '#38bdf8' }}>{displayOwnerName}</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '2px' }}>মালিকের NID:</span>
                        <strong style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{displayOwnerNid}</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '2px' }}>উপজেলা:</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedLand.upazila || 'শিবগঞ্জ'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: Citizen Search + Volume/Page Fields + Submit to AC Land */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#60a5fa" /> লক্ষ্য নাগরিক নির্বাচন ও বরাদ্দ ফরম
              </h3>

              {/* User search */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  নাগরিক অনুসন্ধান (NID / ফোন / ইমেইল)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="নাগরিকের NID / ফোন / ইমেইল দিন"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchUser(); } }}
                    style={{ flex: 1, fontSize: '13px', color: '#f8fafc' }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchUser}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600' }}
                  >
                    খুঁজুন
                  </button>
                </div>
              </div>

              {userError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  ⚠️ {userError}
                </div>
              )}

              {/* Found user preview */}
              {foundUser && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', color: '#86efac', fontSize: '14px' }}>
                      👤 {foundUser.name}
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: '999px', color: '#bbf7d0' }}>
                      নিবন্ধিত নাগরিক
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div>NID: <strong style={{ fontFamily: 'monospace' }}>{foundUser.nid}</strong></div>
                    <div>মোবাইল: <strong>{foundUser.phone}</strong></div>
                    <div>পিতা: <strong>{foundUser.father_name}</strong></div>
                    <div>ঠিকানা: <strong>{foundUser.upazila}, {foundUser.district}</strong></div>
                  </div>
                </div>
              )}

              {/* Volume Book and Page Number directly above Assign button */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#93c5fd', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> সাব-রেজিস্ট্রি বালাম ও ভলিউম বই সংক্রান্ত তথ্য (বাধ্যতামূলক)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                      ভলিউম বই নম্বর <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="যেমন: VOL-2026-X"
                      value={volumeBook}
                      onChange={(e) => setVolumeBook(e.target.value)}
                      style={{ width: '100%', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: '500' }}>
                      পৃষ্ঠা নম্বর <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="যেমন: ১২৮"
                      value={pageNo}
                      onChange={(e) => setPageNo(e.target.value)}
                      style={{ width: '100%', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    দলিল নম্বর (Deed No)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="DEED-2026-088"
                    value={deedNo}
                    onChange={(e) => setDeedNo(e.target.value)}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    রেজিস্ট্রার মন্তব্য
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="স্বত্ব পর্যালোচনা মন্তব্য"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Citizen Email OTP Verification Block */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔒 নাগরিক সম্মতি ও ইমেইল ওটিপি (OTP) যাচাইকরণ
                  </div>
                  {foundUser && (
                    <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                      {foundUser.email}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.5 }}>
                  এসি ল্যান্ড অফিসে প্রস্তাব পাঠানোর পূর্বে নাগরিকের ব্যক্তিগত ইমেইলে ওটিপি প্রেরণ ও তা যাচাই করা বাধ্যতামূলক।
                </p>

                {/* Prerequisites Status Bar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>১. নির্বাচিত জমি:</span>
                    <strong style={{ color: selectedLand ? '#86efac' : '#f87171' }}>
                      {selectedLand ? `দাগ নং ${selectedLand.dag_no} (${selectedLand.mouza}) ✓` : '❌ বাম পাশ থেকে জমি নির্বাচন করুন'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>২. লক্ষ্য নাগরিক:</span>
                    <strong style={{ color: foundUser ? '#86efac' : '#f87171' }}>
                      {foundUser ? `${foundUser.name} (${foundUser.email}) ✓` : '❌ উপরে নাগরিক NID দিয়ে খুঁজুন'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSendCitizenOtp}
                    disabled={sendingCitizenOtp || !foundUser || !selectedLand}
                    className="btn-secondary"
                    title={!selectedLand ? 'প্রথমে জমি নির্বাচন করুন' : !foundUser ? 'প্রথমে নাগরিক খুঁজুন' : 'ওটিপি পাঠান'}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: (!foundUser || !selectedLand) ? 'rgba(255, 255, 255, 0.04)' : 'rgba(59, 130, 246, 0.15)',
                      borderColor: (!foundUser || !selectedLand) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.3)',
                      color: (!foundUser || !selectedLand) ? '#64748b' : '#93c5fd',
                      cursor: (!foundUser || !selectedLand) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Send size={13} />
                    {sendingCitizenOtp ? 'ওটিপি পাঠানো হচ্ছে...' : '✉️ নাগরিকের ইমেইলে OTP পাঠান'}
                  </button>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="৬ ডিজিটের ওটিপি লিখুন"
                    value={citizenOtp}
                    onChange={(e) => setCitizenOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field"
                    style={{
                      flex: 1,
                      fontSize: '15px',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      color: '#4ade80'
                    }}
                  />
                </div>

                {otpSentMessage && (
                  <div style={{ padding: '8px 10px', background: 'rgba(34, 197, 94, 0.1)', color: '#86efac', borderRadius: '6px', fontSize: '11px', marginBottom: '6px' }}>
                    ✅ {otpSentMessage}
                  </div>
                )}

                {otpPreview && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <span style={{ color: '#86efac', fontWeight: '700' }}>🔑 ওটিপি কোড: </span>
                      <strong style={{ fontSize: '16px', letterSpacing: '3px', color: '#4ade80', fontFamily: 'monospace' }}>{otpPreview}</strong>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>নাগরিকের ইনবক্সে এবং এখানে প্রদর্শিত হচ্ছে</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCitizenOtp(otpPreview)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#16a34a',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '11px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      📋 ওটিপি কোড ইনপুট করুন
                    </button>
                  </div>
                )}

                {otpError && (
                  <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '6px', fontSize: '11px' }}>
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              {/* Status messages */}
              {assignSuccess && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: '#86efac',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {assignSuccess}
                </div>
              )}

              {assignError && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  ⚠️ {assignError}
                </div>
              )}

              {/* Check if land is already allocated to another citizen */}
              {selectedLand && checkIsAllocated(selectedLand) && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  color: '#fee2e2',
                  fontSize: '13px',
                  marginBottom: '14px',
                  lineHeight: 1.5
                }}>
                  🔒 <strong>সতর্কতা:</strong> দাগ নং {selectedLand.dag_no} জমিটি ইতিমধ্যে <strong>{selectedLand.owner_name}</strong> (NID: {selectedLand.owner_nid})-এর নামে বরাদ্দকৃত/রেকর্ডভুক্ত রয়েছে। অন্য কাউকে পুনরায় বরাদ্দ করা যাবে না।
                </div>
              )}

              {/* THE ASSIGN BUTTON */}
              {(() => {
                const isLandAllocated = checkIsAllocated(selectedLand);
                return (
                  <button
                    type="button"
                    onClick={handleAssignLand}
                    disabled={assigning || !selectedLand || !foundUser || citizenOtp.length !== 6 || isLandAllocated}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '13px',
                      fontSize: '15px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: isLandAllocated ? 'rgba(239, 68, 68, 0.25)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      cursor: isLandAllocated ? 'not-allowed' : 'pointer',
                      boxShadow: isLandAllocated ? 'none' : '0 4px 16px rgba(29, 78, 216, 0.4)'
                    }}
                  >
                    <Send size={18} />
                    {assigning ? 'অনুরোধ পাঠানো হচ্ছে...' : isLandAllocated ? '🔒 জমিটি ইতিমধ্যে বরাদ্দকৃত (নিষিদ্ধ)' : 'নাগরিককে জমি বরাদ্দ করুন ➔ এসি ল্যান্ডে পাঠান'}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Table: Sent Assignment Requests */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#60a5fa" /> প্রেরিত জমি বরাদ্দ অনুরোধসমূহের স্থিতি
              </h3>
              <button onClick={fetchSentRequests} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }}>
                রিফ্রেশ
              </button>
            </div>

            {sentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                এখনো কোনো জমি বরাদ্দ অনুরোধ পাঠানো হয়নি।
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 12px' }}>অনুরোধ নং</th>
                      <th style={{ padding: '10px 12px' }}>নাগরিক</th>
                      <th style={{ padding: '10px 12px' }}>জমির তথ্য</th>
                      <th style={{ padding: '10px 12px' }}>ভলিউম / পৃষ্ঠা</th>
                      <th style={{ padding: '10px 12px' }}>বর্তমান স্ট্যাটাস</th>
                      <th style={{ padding: '10px 12px' }}>পর্যালোচনা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentRequests.map((req) => (
                      <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#93c5fd' }}>
                          {req.request_id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#f1f5f9' }}>{req.user_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {req.user_nid}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>দাগ: <strong>{req.dag_no}</strong> | খতিয়ান: {req.khatian_no}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>মৌজা: {req.mouza} ({req.area_decimal} শতক)</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>ভলিউম: <strong>{req.volume_book}</strong></div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>পৃষ্ঠা: {req.page_no}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: req.status === 'Approved' ? 'rgba(34, 197, 94, 0.15)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#fca5a5' : '#fde047',
                            border: `1px solid ${req.status === 'Approved' ? 'rgba(34, 197, 94, 0.3)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}>
                            {req.status === 'Approved' ? '✅ অনুমোদিত (Approved)' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত (Rejected)' : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                          {req.ac_land_reviewed_by ? (
                            <div>
                              <div>কর্মকর্তা: {req.ac_land_reviewed_by}</div>
                              {req.rejection_reason && <div style={{ color: '#ef4444' }}>কারণ: {req.rejection_reason}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>পর্যালোচনার অপেক্ষায়</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Existing Sub-Registry Deed Registration Panel */}
      {activeTab === 'deed_registry' && (
        <div>
          <P4RegistryPanel />
        </div>
      )}
          </main>
        </div>
      </div>
    </div>
  );
}
