import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Search, UserCheck, Send, CheckCircle, Clock, AlertTriangle, FileText, Layers, Hash, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
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
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'deed_registry' | 'requests'

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
        fetchSentRequests();
        handleSearchLand(); // refresh land status
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || 'বরাদ্দ অনুরোধ পাঠানো ব্যর্থ হয়েছে');
    } finally {
      setAssigning(false);
    }
  };

  const navItems = [
    {
      id: 'assign',
      label: 'সরকারি জমি বরাদ্দ ও প্রস্তাব',
      icon: Layers,
    },
    {
      id: 'deed_registry',
      label: 'দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং',
      icon: FileText,
    },
    {
      id: 'requests',
      label: 'প্রেরিত বরাদ্দের ট্র্যাকিং',
      icon: Clock,
      badge: sentRequests.length,
      badgeColor: '#1d4ed8',
      badgeBg: '#dbeafe'
    }
  ];

  const stats = [
    { label: 'মোট প্রেরিত', value: sentRequests.length, color: '#1d4ed8' },
    { label: 'অনুমোদিত', value: sentRequests.filter(r => r.status === 'Approved').length, color: '#047857' },
    { label: 'অপেক্ষমান', value: sentRequests.filter(r => r.status === 'Pending').length, color: '#b45309' },
  ];

  return (
    <DashboardLayout
      title="সাব-রেজিস্ট্রি অফিস ড্যাশবোর্ড"
      subtitle={`কর্মকর্তা: ${user?.name || 'সাব-রেজিস্ট্রার'} | ${user?.office_details?.office_name || 'উপজেলা সাব-রেজিস্ট্রি অফিস'}`}
      badge={{ label: 'সাব-রেজিস্ট্রি অফিস' }}
      icon={Building2}
      roleTheme="blue"
      stats={stats}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'assign' && (
        <div>
          {/* Instructions bar */}
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#1e3a8a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Building2 size={20} color="#2563eb" />
            <div>
              <strong style={{ color: '#1e40af' }}>ওয়ার্কফ্লো নির্দেশিকা:</strong> ১. ক্যাসকেড ফিল্টার দিয়ে জমি খুঁজুন ➔ ২. নাগরিকের NID দিয়ে ইউজার বের করুন ➔ ৩. ভলিউম বই ও পৃষ্ঠা নম্বর লিখুন ➔ ৪. 'এসি ল্যান্ডে পাঠান' বাটনে ক্লিক করুন। এসি ল্যান্ড রিভিউ করে অনুমোদন দিলে স্বয়ংক্রিয়ভাবে নাগরিকের নামে বরাদ্দ সম্পন্ন হবে।
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(320px, 1fr)', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Cascade Land Filter & Citizen Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Cascade Filter Box */}
              <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#2563eb" /> ক্যাসকেড ফিল্টার (জমি অনুসন্ধান)
                </h3>

                {/* Flow indicators */}
                <div style={{
                  fontSize: '11px',
                  color: '#1e40af',
                  marginBottom: '16px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: '700'
                }}>
                  বিভাগ ➔ জেলা ➔ উপজেলা/সার্কেল ➔ মৌজা ➔ জেল নম্বর ➔ খতিয়ান ➔ দাগ নম্বর
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>১. বিভাগ (Division)</label>
                    <select
                      className="input-field"
                      value={filter.division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    >
                      {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>২. জেলা (District)</label>
                    <select
                      className="input-field"
                      value={filter.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    >
                      {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৩. উপজেলা (Upazila)</label>
                    <select
                      className="input-field"
                      value={filter.upazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    >
                      {upazilasList.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৪. মৌজা (মৌজা ও জে.এল)</label>
                    <select
                      className="input-field"
                      value={filter.mouza}
                      onChange={(e) => handleMouzaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    >
                      {mouzasList.map(m => (
                        <option key={m.jl_no + m.mouza} value={m.mouza}>
                          {m.mouza} (জে.এল {m.jl_no})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৫. জে.এল নং (স্বয়ংক্রিয়)</label>
                    <input
                      type="text"
                      readOnly
                      className="input-field"
                      value={filter.jl_no}
                      style={{ width: '100%', fontSize: '12px', background: '#f8fafc', color: '#166534', fontWeight: '700', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৬. খতিয়ান নং</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="খতিয়ান নং লিখুন"
                      value={filter.khatian_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, khatian_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৭. দাগ নং (প্লট)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="দাগ নং লিখুন"
                      value={filter.dag_no}
                      onChange={(e) => setFilter(prev => ({ ...prev, dag_no: e.target.value }))}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchLand}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#ffffff' }}
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
                  <div className="glass-card" style={{ padding: '20px', borderLeft: `5px solid ${isLandAllocated ? '#ef4444' : '#16a34a'}`, background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        নির্বাচিত জমি: দাগ {selectedLand.dag_no} (মৌজা: {selectedLand.mouza})
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: isLandAllocated ? '#fee2e2' : '#dcfce7',
                        color: isLandAllocated ? '#991b1b' : '#166534',
                        border: `1px solid ${isLandAllocated ? '#f87171' : '#86efac'}`,
                        fontWeight: '700'
                      }}>
                        {isLandAllocated ? '🔒 বরাদ্দকৃত / লক' : '🟢 বরাদ্দযোগ্য সরকারি খাস জমি'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '13px' }}>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>খতিয়ান:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedLand.khatian_no || '১'}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>জে.এল নং:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedLand.jl_no}</strong>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                        <span style={{ color: '#166534', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>মোট পরিমাণ:</span>
                        <strong style={{ color: '#15803d', fontSize: '14px' }}>{selectedLand.total_area_decimal} শতক</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>বর্তমান মালিক:</span>
                        <strong style={{ color: isLandAllocated ? '#b91c1c' : '#1d4ed8' }}>{displayOwnerName}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>মালিকের NID:</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{displayOwnerNid}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>উপজেলা:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedLand.upazila || 'শিবগঞ্জ'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: Citizen Search + Volume/Page Fields + Submit to AC Land */}
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#2563eb" /> লক্ষ্য নাগরিক নির্বাচন ও বরাদ্দ ফরম
              </h3>

              {/* User search */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#1e293b', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
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
                    style={{ flex: 1, fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchUser}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#0f172a' }}
                  >
                    খুঁজুন
                  </button>
                </div>
              </div>

              {userError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', fontWeight: '600' }}>
                  ⚠️ {userError}
                </div>
              )}

              {/* Found user preview */}
              {foundUser && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', color: '#166534', fontSize: '14px' }}>
                      👤 {foundUser.name}
                    </div>
                    <span style={{ fontSize: '11px', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px', color: '#166534', border: '1px solid #86efac', fontWeight: '700' }}>
                      নিবন্ধিত নাগরিক
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e293b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div>NID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{foundUser.nid}</strong></div>
                    <div>মোবাইল: <strong style={{ color: '#0f172a' }}>{foundUser.phone}</strong></div>
                    <div>পিতা: <strong style={{ color: '#0f172a' }}>{foundUser.father_name}</strong></div>
                    <div>ঠিকানা: <strong style={{ color: '#0f172a' }}>{foundUser.upazila}, {foundUser.district}</strong></div>
                  </div>
                </div>
              )}

              {/* Volume Book and Page Number directly above Assign button */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> সাব-রেজিস্ট্রি বালাম ও ভলিউম বই সংক্রান্ত তথ্য (বাধ্যতামূলক)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                      ভলিউম বই নম্বর <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="যেমন: VOL-2026-X"
                      value={volumeBook}
                      onChange={(e) => setVolumeBook(e.target.value)}
                      style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                      পৃষ্ঠা নম্বর <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="যেমন: ১২৮"
                      value={pageNo}
                      onChange={(e) => setPageNo(e.target.value)}
                      style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    দলিল নম্বর (Deed No)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="DEED-2026-088"
                    value={deedNo}
                    onChange={(e) => setDeedNo(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    রেজিস্ট্রার মন্তব্য
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="স্বত্ব পর্যালোচনা মন্তব্য"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Citizen Email OTP Verification Block */}
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔒 নাগরিক সম্মতি ও ইমেইল ওটিপি (OTP) যাচাইকরণ
                  </div>
                  {foundUser && (
                    <span style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '700' }}>
                      {foundUser.email}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '11px', color: '#334155', margin: '0 0 10px', lineHeight: 1.5, fontWeight: '500' }}>
                  এসি ল্যান্ড অফিসে প্রস্তাব পাঠানোর পূর্বে নাগরিকের ব্যক্তিগত ইমেইলে ওটিপি প্রেরণ ও তা যাচাই করা বাধ্যতামূলক।
                </p>

                {/* Prerequisites Status Bar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: '#e2e8f0',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#334155', fontWeight: '600' }}>১. নির্বাচিত জমি:</span>
                    <strong style={{ color: selectedLand ? '#15803d' : '#b91c1c' }}>
                      {selectedLand ? `দাগ নং ${selectedLand.dag_no} (${selectedLand.mouza}) ✓` : '❌ বাম পাশ থেকে জমি নির্বাচন করুন'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#334155', fontWeight: '600' }}>২. লক্ষ্য নাগরিক:</span>
                    <strong style={{ color: foundUser ? '#15803d' : '#b91c1c' }}>
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
                      background: (!foundUser || !selectedLand) ? '#f1f5f9' : '#2563eb',
                      borderColor: (!foundUser || !selectedLand) ? '#cbd5e1' : '#1d4ed8',
                      color: (!foundUser || !selectedLand) ? '#94a3b8' : '#ffffff',
                      cursor: (!foundUser || !selectedLand) ? 'not-allowed' : 'pointer',
                      fontWeight: '700'
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
                      fontWeight: '800',
                      color: '#15803d',
                      background: '#ffffff',
                      border: '2px solid #16a34a'
                    }}
                  />
                </div>

                {otpSentMessage && (
                  <div style={{ padding: '8px 10px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', fontSize: '11px', marginBottom: '6px', fontWeight: '600' }}>
                    ✅ {otpSentMessage}
                  </div>
                )}



                {otpError && (
                  <div style={{ padding: '8px 10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              {/* Status messages */}
              {assignSuccess && (
                <div style={{
                  padding: '12px',
                  background: '#dcfce7',
                  border: '1.5px solid #86efac',
                  borderRadius: '8px',
                  color: '#166534',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  {assignSuccess}
                </div>
              )}

              {assignError && (
                <div style={{
                  padding: '12px',
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  ⚠️ {assignError}
                </div>
              )}

              {/* Check if land is already allocated to another citizen */}
              {selectedLand && checkIsAllocated(selectedLand) && (
                <div style={{
                  padding: '14px',
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                  marginBottom: '14px',
                  lineHeight: 1.5,
                  fontWeight: '500'
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
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: isLandAllocated ? '#fee2e2' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      color: isLandAllocated ? '#991b1b' : '#ffffff',
                      border: isLandAllocated ? '1.5px solid #f87171' : 'none',
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
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#2563eb" /> প্রেরিত জমি বরাদ্দ অনুরোধসমূহের স্থিতি
              </h3>
              <button onClick={fetchSentRequests} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#0f172a', fontWeight: '700' }}>
                রিফ্রেশ
              </button>
            </div>

            {sentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#475569', fontSize: '13px', fontWeight: '500' }}>
                এখনো কোনো জমি বরাদ্দ অনুরোধ পাঠানো হয়নি।
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
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
                      <tr key={req._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#1d4ed8', fontWeight: '700' }}>
                          {req.request_id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f172a' }}>{req.user_name}</strong>
                          <div style={{ fontSize: '11px', color: '#475569' }}>NID: {req.user_nid}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#0f172a' }}>দাগ: <strong>{req.dag_no}</strong> | খতিয়ান: {req.khatian_no}</div>
                          <div style={{ fontSize: '11px', color: '#475569' }}>মৌজা: {req.mouza} ({req.area_decimal} শতক)</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#0f172a' }}>ভলিউম: <strong>{req.volume_book}</strong></div>
                          <div style={{ fontSize: '11px', color: '#475569' }}>পৃষ্ঠা: {req.page_no}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: req.status === 'Approved' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                            color: req.status === 'Approved' ? '#166534' : req.status === 'Rejected' ? '#991b1b' : '#92400e',
                            border: `1px solid ${req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#f87171' : '#fde68a'}`
                          }}>
                            {req.status === 'Approved' ? '✅ অনুমোদিত (Approved)' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত (Rejected)' : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#1e293b' }}>
                          {req.ac_land_reviewed_by ? (
                            <div>
                              <div>কর্মকর্তা: {req.ac_land_reviewed_by}</div>
                              {req.rejection_reason && <div style={{ color: '#dc2626', fontWeight: '600' }}>কারণ: {req.rejection_reason}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#475569' }}>পর্যালোচনার অপেক্ষায়</span>
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

      {/* TAB 2: Sub-Registry Deed Registration Panel */}
      {activeTab === 'deed_registry' && (
        <div>
          <P4RegistryPanel />
        </div>
      )}

      {/* TAB 3: Sent Assignment Requests Tracking */}
      {activeTab === 'requests' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={20} color="#2563eb" /> প্রেরিত জমি বরাদ্দ অনুরোধসমূহের স্থিতি ও ট্র্যাকিং
            </h3>
            <button onClick={fetchSentRequests} className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px', background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#0f172a', fontWeight: '700' }}>
              রিফ্রেশ
            </button>
          </div>

          {sentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>
              এখনো কোনো জমি বরাদ্দ অনুরোধ পাঠানো হয়নি।
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
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
                    <tr key={req._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#1d4ed8', fontWeight: '700' }}>
                        {req.request_id}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#0f172a' }}>{req.user_name}</strong>
                        <div style={{ fontSize: '11px', color: '#475569' }}>NID: {req.user_nid}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ color: '#0f172a' }}>দাগ: <strong>{req.dag_no}</strong> | খতিয়ান: {req.khatian_no}</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>মৌজা: {req.mouza} ({req.area_decimal} শতক)</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ color: '#0f172a' }}>ভলিউম: <strong>{req.volume_book}</strong></div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>পৃষ্ঠা: {req.page_no}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: req.status === 'Approved' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                          color: req.status === 'Approved' ? '#166534' : req.status === 'Rejected' ? '#991b1b' : '#92400e',
                          border: `1px solid ${req.status === 'Approved' ? '#86efac' : req.status === 'Rejected' ? '#f87171' : '#fde68a'}`
                        }}>
                          {req.status === 'Approved' ? '✅ অনুমোদিত (Approved)' : req.status === 'Rejected' ? '❌ প্রত্যাখ্যাত (Rejected)' : '⏳ এসি ল্যান্ডে অপেক্ষমান'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#1e293b' }}>
                        {req.ac_land_reviewed_by ? (
                          <div>
                            <div>কর্মকর্তা: {req.ac_land_reviewed_by}</div>
                            {req.rejection_reason && <div style={{ color: '#dc2626', fontWeight: '600' }}>কারণ: {req.rejection_reason}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#475569' }}>পর্যালোচনার অপেক্ষায়</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
