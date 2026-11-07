import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, 
  MapPin, UserCheck, Layers, Hash, FileText, Check, Lock, Info, XCircle, RefreshCw
} from 'lucide-react';

export default function P5CitizenVerify() {
    const [searchForm, setSearchForm] = useState({
    seller_nid: '',
    division: '',
    district: '',
    upazila: '',
    mouza: '',
    khatian_no: '',
    dag_no: '',
    requested_area: ''
  });

  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [landRecord, setLandRecord] = useState(null);
  const [alertData, setAlertData] = useState(null);

  // Cascading Dynamic Location States: Division ➔ District ➔ Upazila ➔ Mouza ➔ Khatian ➔ Dag
  const [divisionsList, setDivisionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [upazilasList, setUpazilasList] = useState([]);
  const [mouzasList, setMouzasList] = useState([]);
  const [khatiansList, setKhatiansList] = useState([]);
  const [dagsList, setDagsList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [selectedDivId, setSelectedDivId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');
  const [selectedUpzId, setSelectedUpzId] = useState('');
  const [selectedMouzaId, setSelectedMouzaId] = useState('');
  const [selectedKhatianId, setSelectedKhatianId] = useState('');
  const [selectedDagId, setSelectedDagId] = useState('');

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get('/api/locations/divisions');
      setDivisionsList(res.data?.data || []);
      setSelectedDivId('');
      setDistrictsList([]);
      setSelectedDistId('');
      setUpazilasList([]);
      setSelectedUpzId('');
      setMouzasList([]);
      setSelectedMouzaId('');
      setKhatiansList([]);
      setSelectedKhatianId('');
      setDagsList([]);
      setSelectedDagId('');
    } catch (err) {
      console.error('Failed to load divisions:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDivisionChange = async (divId) => {
    setSelectedDivId(divId);
    setSelectedDistId('');
    setDistrictsList([]);
    setSelectedUpzId('');
    setUpazilasList([]);
    setSelectedMouzaId('');
    setMouzasList([]);
    setSelectedKhatianId('');
    setKhatiansList([]);
    setSelectedDagId('');
    setDagsList([]);

    const divObj = divisionsList.find(d => d._id === divId);
    const divName = divObj ? (divObj.name || divObj.bn_name) : '';

    setSearchForm(prev => ({
      ...prev,
      division: divName,
      district: '',
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    if (!divId) return;

    setLoadingLocations(true);
    try {
      const res = await axios.get(`/api/locations/districts?division_id=${divId}`);
      setDistrictsList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load districts:', err);
      setDistrictsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDistrictChange = async (distId) => {
    setSelectedDistId(distId);
    setSelectedUpzId('');
    setUpazilasList([]);
    setSelectedMouzaId('');
    setMouzasList([]);
    setSelectedKhatianId('');
    setKhatiansList([]);
    setSelectedDagId('');
    setDagsList([]);

    const distObj = districtsList.find(d => d._id === distId);
    const distName = distObj ? (distObj.name || distObj.bn_name) : '';

    setSearchForm(prev => ({
      ...prev,
      district: distName,
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    if (!distId) return;

    setLoadingLocations(true);
    try {
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}`);
      setUpazilasList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load upazilas:', err);
      setUpazilasList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleUpazilaChange = async (upzId) => {
    setSelectedUpzId(upzId);
    setSelectedMouzaId('');
    setMouzasList([]);
    setSelectedKhatianId('');
    setKhatiansList([]);
    setSelectedDagId('');
    setDagsList([]);

    const upzObj = upazilasList.find(u => u._id === upzId);
    const upzName = upzObj ? (upzObj.name || upzObj.bn_name) : '';

    setSearchForm(prev => ({
      ...prev,
      upazila: upzName,
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    if (!upzId) return;

    setLoadingLocations(true);
    try {
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}`);
      setMouzasList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load mouzas:', err);
      setMouzasList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleMouzaChange = async (mouzaId) => {
    setSelectedMouzaId(mouzaId);
    setSelectedKhatianId('');
    setKhatiansList([]);
    setSelectedDagId('');
    setDagsList([]);

    const mouzaObj = mouzasList.find(m => m._id === mouzaId);
    const mouzaName = mouzaObj ? (mouzaObj.name || mouzaObj.bn_name) : '';

    setSearchForm(prev => ({
      ...prev,
      mouza: mouzaName,
      khatian_no: '',
      dag_no: ''
    }));

    if (!mouzaId) return;

    setLoadingLocations(true);
    try {
      const res = await axios.get(`/api/locations/khatians?mouza_id=${mouzaId}`);
      setKhatiansList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load khatians:', err);
      setKhatiansList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleKhatianChange = async (khatianId) => {
    setSelectedKhatianId(khatianId);
    setSelectedDagId('');
    setDagsList([]);

    const khObj = khatiansList.find(k => k._id === khatianId);
    const khNo = khObj ? khObj.khatian_no : '';

    setSearchForm(prev => ({
      ...prev,
      khatian_no: khNo,
      dag_no: ''
    }));

    if (!khatianId) return;

    setLoadingLocations(true);
    try {
      const res = await axios.get(`/api/locations/dags?khatian_id=${khatianId}`);
      setDagsList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load dags:', err);
      setDagsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDagChange = (dagId) => {
    setSelectedDagId(dagId);
    const dagObj = dagsList.find(d => d._id === dagId);
    const dagNo = dagObj ? dagObj.dag_no : '';

    setSearchForm(prev => ({
      ...prev,
      dag_no: dagNo
    }));
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchForm.seller_nid?.trim() || !searchForm.mouza?.trim() || !searchForm.dag_no?.trim() || !searchForm.khatian_no?.trim()) {
      setSearchError('অনুগ্রহ করে বিক্রেতার NID নম্বর, মৌজা, খতিয়ান এবং দাগ নম্বর নির্বাচন বা প্রদান করুন (বিভাগ ➔ জেলা ➔ উপজেলা ➔ মৌজা ➔ খতিয়ান ➔ দাগ)।');
      return;
    }

    setLoading(true);
    setSearchError('');
    setLandRecord(null);
    setAlertData(null);

    try {
      // Connect to unified live Anti-Double Selling & Land Verification Engine
      const res = await axios.post('/api/verify-deed', {
        seller_nid: searchForm.seller_nid?.trim(),
        division: searchForm.division?.trim(),
        district: searchForm.district?.trim(),
        upazila: searchForm.upazila?.trim(),
        mouza: searchForm.mouza?.trim(),
        khatian_no: searchForm.khatian_no?.trim(),
        dag_no: searchForm.dag_no?.trim(),
        requested_area: searchForm.requested_area || '1'
      });

      if (res.data) {
        if (!res.data.success) {
          setAlertData(res.data);
          setLandRecord(null);
        } else {
          setLandRecord(res.data.record);
          setAlertData(null);
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে। অনুগ্রহ করে সার্ভার সংযোগ চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchForm({
      seller_nid: '',
      division: '',
      district: '',
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: '',
      requested_area: ''
    });
    setSelectedDivId('');
    setDistrictsList([]);
    setSelectedDistId('');
    setUpazilasList([]);
    setSelectedUpzId('');
    setMouzasList([]);
    setSelectedMouzaId('');
    setKhatiansList([]);
    setSelectedKhatianId('');
    setDagsList([]);
    setSelectedDagId('');
    setLandRecord(null);
    setAlertData(null);
    setSearchError('');
  };

  return (
    <div className="p5-verify-container">
      {/* Top Header Banner */}
      <div className="p5-header-card">
        <div className="p5-header-inner">
          <div className="p5-header-left">
            <div className="p5-header-icon">
              <ShieldCheck size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 className="p5-header-title">
                  জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
                </h2>
                <span className="p5-header-badge">
                  নাগরিক ও উন্মুক্ত পোর্টাল (Public Verification Engine)
                </span>
              </div>
              <p className="p5-header-sub">
                জমি কেনার পূর্বে বিক্রেতার বৈধ মালিকানা, আদালতের মামলা, স্থগিতাদেশ (Stay Order) ও ডাবল-সেলিং ঝুঁকি লাইভ যাচাই করুন
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Search Form | Right Verification Results */}
      <div className="p5-main-grid">
        
        {/* Left Column: Search Form */}
        <div className="p5-form-card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="#2563eb" />
            জমির তথ্য অনুসন্ধান ও যাচাইকরণ
          </h3>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="যেমন: 1998567890123"
                value={searchForm.seller_nid}
                onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
              />
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '3px', display: 'block', fontWeight: '500' }}>
                বিক্রেতার দেওয়া NID দিন যাতে ভুয়া মালিকানা (Fake Owner) শনাক্ত করা যায়
              </span>
            </div>

            <div className="p5-location-grid">
                {/* ১. বিভাগ */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ১. বিভাগ (Division) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedDivId}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || divisionsList.length === 0}
                  >
                    <option value="">-- বিভাগ নির্বাচন করুন --</option>
                    {divisionsList.map(d => (
                      <option key={d._id} value={d._id}>{d.name || d.bn_name}</option>
                    ))}
                  </select>
                </div>

                {/* ২. জেলা */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ২. জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedDistId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: !selectedDivId ? '#f1f5f9' : '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || !selectedDivId || districtsList.length === 0}
                  >
                    <option value="">{selectedDivId ? '-- জেলা নির্বাচন করুন --' : '-- প্রথমে বিভাগ নির্বাচন করুন --'}</option>
                    {districtsList.map(d => (
                      <option key={d._id} value={d._id}>{d.name || d.bn_name}</option>
                    ))}
                  </select>
                </div>

                {/* ৩. উপজেলা */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ৩. উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedUpzId}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: !selectedDistId ? '#f1f5f9' : '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || !selectedDistId || upazilasList.length === 0}
                  >
                    <option value="">{selectedDistId ? '-- উপজেলা নির্বাচন করুন --' : '-- প্রথমে জেলা নির্বাচন করুন --'}</option>
                    {upazilasList.map(u => (
                      <option key={u._id} value={u._id}>{u.name || u.bn_name}</option>
                    ))}
                  </select>
                </div>

                {/* ৪. মৌজা */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ৪. মৌজা (Mouza) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedMouzaId}
                    onChange={(e) => handleMouzaChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: !selectedUpzId ? '#f1f5f9' : '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || !selectedUpzId || mouzasList.length === 0}
                  >
                    <option value="">{selectedUpzId ? '-- মৌজা নির্বাচন করুন --' : '-- প্রথমে উপজেলা নির্বাচন করুন --'}</option>
                    {mouzasList.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name || m.bn_name} {m.jl_no ? `(জে.এল ${m.jl_no})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ৫. খতিয়ান নং */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ৫. খতিয়ান নম্বর (Khatian) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedKhatianId}
                    onChange={(e) => handleKhatianChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: !selectedMouzaId ? '#f1f5f9' : '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || !selectedMouzaId || khatiansList.length === 0}
                  >
                    <option value="">{selectedMouzaId ? '-- খতিয়ান নম্বর নির্বাচন করুন --' : '-- প্রথমে মৌজা নির্বাচন করুন --'}</option>
                    {khatiansList.map(k => (
                      <option key={k._id} value={k._id}>
                        খতিয়ান {k.khatian_no} {k.khatian_type ? `(${k.khatian_type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ৬. দাগ নং */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ৬. দাগ নম্বর (Dag No) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedDagId}
                    onChange={(e) => handleDagChange(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: !selectedKhatianId ? '#f1f5f9' : '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                    disabled={loadingLocations || !selectedKhatianId || dagsList.length === 0}
                  >
                    <option value="">{selectedKhatianId ? '-- দাগ নম্বর নির্বাচন করুন --' : '-- প্রথমে খতিয়ান নির্বাচন করুন --'}</option>
                    {dagsList.map(d => (
                      <option key={d._id} value={d._id}>
                        দাগ {d.dag_no} {d.total_area_decimal ? `(${d.total_area_decimal} শতক)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '700' }}>
                প্রস্তাবিত ক্রয়ের পরিমাণ (শতক - ঐচ্ছিক)
              </label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="যেমন: ৫"
                value={searchForm.requested_area}
                onChange={(e) => setSearchForm(prev => ({ ...prev, requested_area: e.target.value }))}
                style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff' }}
              />
            </div>

            <div className="p5-btn-group">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Search size={16} />
                {loading ? 'যাচাই করা হচ্ছে...' : '🔍 জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'}
              </button>

              {(landRecord || alertData || searchError) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                  style={{ padding: '12px 18px', fontSize: '13px', fontWeight: '700', background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#0f172a' }}
                >
                  রিসেট
                </button>
              )}
            </div>
          </form>

          {/* Validation Error Message */}
          {searchError && (
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              ⚠️ {searchError}
            </div>
          )}

          {/* Educational Notice */}
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#1e293b',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: '800', color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} /> এই ইঞ্জিন কী কী স্বয়ংক্রিয়ভাবে পরীক্ষা করে:
            </div>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li><strong>আদালতের মামলা ও Stay Order:</strong> জমিতে কোনো নিষেধাজ্ঞা বলবৎ আছে কি না।</li>
              <li><strong>অ্যান্টি-ডাবল সেলিং:</strong> জমিটির অন্য কোনো চলমান নামজারি বা দলিল প্রক্রিয়াধীন কি না।</li>
              <li><strong>মালিকের এনআইডি বৈধতা:</strong> বিক্রেতা প্রকৃত মালিক কি না।</li>
              <li><strong>সরকারি খাস জমি:</strong> জমিটি ১নং খতিয়ানের খাস জমি কি না।</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Verification Results */}
        <div>
          {/* Default Empty State */}
          {!loading && !landRecord && !alertData && (
            <div className="p5-result-empty">
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Search size={32} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                ফলাফল দেখার অপেক্ষায়
              </h4>
              <p style={{ color: '#475569', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6, margin: 0, fontWeight: '500' }}>
                বাম পাশের ফর্মে দাগ নম্বর ও মৌজার নাম লিখে <strong>'জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'</strong> বাটনে ক্লিক করলে লাইভ আইনি ও নিবন্ধন স্ট্যাটাস প্রদর্শিত হবে।
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="p5-result-loading">
              <div className="animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '3px solid #bfdbfe',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d4ed8' }}>
                ডেটাবেজ ও ভূমি আইনি রেকর্ড যাচাই করা হচ্ছে...
              </div>
            </div>
          )}

          {/* Alert View (Court Case, Stay Order, Double Selling, Fake Owner, Khas Land, etc.) */}
          {alertData && (
            <div className="p5-alert-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldAlert size={28} color="#dc2626" />
                <div>
                  <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#991b1b', margin: 0 }}>
                    {alertData.alert_type === 'COURT_CASE_STAY_ORDER' ? '⛔ আদালতীয় মামলা ও স্থগিতাদেশ সতর্কতা (Stay Order Alert)' :
                     alertData.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' :
                     alertData.alert_type === 'FAKE_OWNER' ? '🚨 জালিয়াতি সতর্কতা (Fake Owner Detected)' :
                     alertData.alert_type === 'UNASSIGNED_LAND' ? '⚠️ সরকারি খাস জমি সতর্কতা (Unassigned Land)' :
                     alertData.alert_type === 'ALREADY_SOLD' ? '🚫 পূর্বেই বিক্রিত জমি (Already Sold)' :
                     alertData.alert_type === 'NOT_FOUND' ? '🔍 রেকর্ড পাওয়া যায়নি (Record Not Found)' :
                     '⚠️ ভূমি রেকর্ড যাচাইকরণ সতর্কতা'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700' }}>
                    {alertData.alert_type === 'NOT_FOUND' ? 'যাচাইকরণের ফলাফল: কোনো সঠিক মালিকানা তথ্য পাওয়া যায়নি' : 'আইনি সিদ্ধান্ত: এই জমিটি কেনা অথবা বায়না করা ঝুঁকিপূর্ণ / সম্পূর্ণ নিষিদ্ধ'}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1.5px solid #fca5a5',
                color: '#7f1d1d',
                fontSize: '13px',
                lineHeight: 1.6,
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                {alertData.message}
              </div>

              {alertData.court_case && (
                <div className="p5-alert-grid">
                  <div>মামলা সংক্রান্ত অবস্থা: <strong style={{ color: '#991b1b' }}>{alertData.court_case.has_court_case ? 'সক্রিয় মোকদ্দমা' : 'মামলামুক্ত'}</strong></div>
                  <div>স্থগিতাদেশ (Stay Order): <strong style={{ color: alertData.court_case.stay_order ? '#dc2626' : '#166534' }}>{alertData.court_case.stay_order ? 'বলবৎ আছে' : 'নেই'}</strong></div>
                  {alertData.court_case.case_details && (
                    <div style={{ gridColumn: 'span 2', marginTop: '4px', color: '#b45309', fontWeight: '700' }}>
                      কেস রেফারেন্স: {alertData.court_case.case_details}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Verified Land Card (Safe To Buy) */}
          {landRecord && !alertData && (
            <div className="p5-success-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={28} color="#16a34a" />
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#166534', margin: 0 }}>
                      🟢 জমি বৈধ, নিরাপদ ও ক্রয়যোগ্য
                    </h4>
                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                      100% Verified Safe Land · কোনো ডাবল-সেলিং বা মামলা নেই
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: '#dcfce7',
                  color: '#166534',
                  fontWeight: '700',
                  border: '1px solid #86efac'
                }}>
                  স্ট্যাটাস: {landRecord.status} (Active)
                </span>
              </div>

              <div className="p5-details-grid">
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>মৌজা:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.mouza}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>দাগ নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.dag_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>খতিয়ান নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.khatian_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>জে.এল নম্বর:</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{landRecord.jl_no}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>বর্তমান মালিক:</span>
                  <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>{landRecord.owner_name}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block', marginBottom: '2px', fontWeight: '600' }}>মালিকের NID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '13px' }}>{landRecord.owner_nid}</strong>
                </div>
                <div className="p5-area-row" style={{
                  gridColumn: '1 / -1',
                  background: '#dcfce7',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#166534', fontWeight: '700' }}>মোট বিক্রয়যোগ্য পরিমাণ:</span>
                  <strong style={{ color: '#15803d', fontSize: '16px' }}>
                    {landRecord.available_area_decimal || landRecord.total_area_decimal} শতক
                  </strong>
                </div>
              </div>

              {/* Verified Checklist */}
              <div className="p5-checklist-box" style={{
                background: '#ffffff',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #86efac',
                fontSize: '12px'
              }}>
                <div style={{ color: '#166534', fontWeight: '800', marginBottom: '6px' }}>
                  যাচাইকরণ ফলাফল রিপোর্ট:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#1e293b', fontWeight: '500' }}>
                  <div>✓ আদালতের কোনো মামলা বা স্থগিতাদেশ (Stay Order) নেই।</div>
                  <div>✓ কোনো পেন্ডিং নামজারি বা ডাবল-সেলিং প্রক্রিয়া চলমান নেই।</div>
                  <div>✓ প্রদত্ত বিক্রেতার NID ও মালিকানার তথ্য ম্যাচ করেছে।</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
