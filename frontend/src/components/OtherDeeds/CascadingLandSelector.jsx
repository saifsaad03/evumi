import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, RefreshCw, Search } from 'lucide-react';

export default function CascadingLandSelector({
  nidLabel = 'মালিকের NID নম্বর',
  nidPlaceholder = '১০/১৩/১৭ ডিজিট NID লিখুন',
  nidValue = '',
  onNidChange,
  donorNid,
  setDonorNid,
  donorNidLabel,
  donorNidPlaceholder,
  onSelectionChange,
  setLandLocation,
  onSearch,
  searching = false,
  accentColor = '#2563eb',
  searchButtonText = '🔍 জমি অনুসন্ধান ও যাচাই করুন',
  compact = false
}) {
  const actualNid = nidValue !== undefined && nidValue !== '' ? nidValue : (donorNid || '');
  const handleNidChange = onNidChange || setDonorNid;
  const actualLabel = donorNidLabel || nidLabel;
  const actualPlaceholder = donorNidPlaceholder || nidPlaceholder;
  const handleLocChange = onSelectionChange || setLandLocation;
  const [divisionsList, setDivisionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [upazilasList, setUpazilasList] = useState([]);
  const [mouzasList, setMouzasList] = useState([]);
  const [khatiansList, setKhatiansList] = useState([]);
  const [dagsList, setDagsList] = useState([]);

  const [selectedDivId, setSelectedDivId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');
  const [selectedUpzId, setSelectedUpzId] = useState('');
  const [selectedMouzaId, setSelectedMouzaId] = useState('');
  const [selectedKhatianId, setSelectedKhatianId] = useState('');
  const [selectedDagId, setSelectedDagId] = useState('');

  const [locationNames, setLocationNames] = useState({
    division: '',
    district: '',
    upazila: '',
    mouza: '',
    khatian_no: '',
    dag_no: ''
  });

  const [loading, setLoading] = useState(false);

  // Load divisions on mount
  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/locations/divisions');
      setDivisionsList(res.data?.data || []);
      // Reset everything
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

      const cleanLoc = {
        division: '',
        district: '',
        upazila: '',
        mouza: '',
        khatian_no: '',
        dag_no: ''
      };
      setLocationNames(cleanLoc);
      if (handleLocChange) handleLocChange({ ...cleanLoc, isComplete: false });
    } catch (err) {
      console.error('Failed to load divisions:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Division Change
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

    const newLoc = {
      division: divName,
      district: '',
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    };
    setLocationNames(newLoc);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete: false });

    if (!divId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/locations/districts?division_id=${divId}`);
      setDistrictsList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load districts:', err);
      setDistrictsList([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. District Change
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

    const newLoc = {
      ...locationNames,
      district: distName,
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    };
    setLocationNames(newLoc);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete: false });

    if (!distId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}`);
      setUpazilasList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load upazilas:', err);
      setUpazilasList([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Upazila Change
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

    const newLoc = {
      ...locationNames,
      upazila: upzName,
      mouza: '',
      khatian_no: '',
      dag_no: ''
    };
    setLocationNames(newLoc);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete: false });

    if (!upzId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}`);
      setMouzasList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load mouzas:', err);
      setMouzasList([]);
    } finally {
      setLoading(false);
    }
  };

  // 4. Mouza Change
  const handleMouzaChange = async (mouzaId) => {
    setSelectedMouzaId(mouzaId);
    setSelectedKhatianId('');
    setKhatiansList([]);
    setSelectedDagId('');
    setDagsList([]);

    const mouzaObj = mouzasList.find(m => m._id === mouzaId);
    const mouzaName = mouzaObj ? (mouzaObj.name || mouzaObj.bn_name) : '';

    const newLoc = {
      ...locationNames,
      mouza: mouzaName,
      khatian_no: '',
      dag_no: ''
    };
    setLocationNames(newLoc);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete: false });

    if (!mouzaId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/locations/khatians?mouza_id=${mouzaId}`);
      setKhatiansList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load khatians:', err);
      setKhatiansList([]);
    } finally {
      setLoading(false);
    }
  };

  // 5. Khatian Change
  const handleKhatianChange = async (khatianId) => {
    setSelectedKhatianId(khatianId);
    setSelectedDagId('');
    setDagsList([]);

    const khObj = khatiansList.find(k => k._id === khatianId);
    const khNo = khObj ? khObj.khatian_no : '';

    const newLoc = {
      ...locationNames,
      khatian_no: khNo,
      dag_no: ''
    };
    setLocationNames(newLoc);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete: false });

    if (!khatianId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/locations/dags?khatian_id=${khatianId}`);
      setDagsList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load dags:', err);
      setDagsList([]);
    } finally {
      setLoading(false);
    }
  };

  // 6. Dag Change
  const handleDagChange = (dagId) => {
    setSelectedDagId(dagId);
    const dagObj = dagsList.find(d => d._id === dagId);
    const dagNo = dagObj ? dagObj.dag_no : '';

    const newLoc = {
      ...locationNames,
      dag_no: dagNo
    };
    setLocationNames(newLoc);
    const isComplete = Boolean(newLoc.mouza && newLoc.khatian_no && newLoc.dag_no);
    if (handleLocChange) handleLocChange({ ...newLoc, isComplete });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch({
        owner_nid: nidValue?.trim() || '',
        ...locationNames
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact
          ? 'repeat(auto-fit, minmax(180px, 1fr))'
          : 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: compact ? '12px' : '16px',
        marginBottom: '16px'
      }}>
        {/* NID Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            {actualLabel} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={actualPlaceholder}
            value={actualNid}
            onChange={e => handleNidChange && handleNidChange(e.target.value)}
            required
            style={{ width: '100%', color: '#0f172a', fontWeight: '600', height: '40px' }}
          />
        </div>

        {/* ১. বিভাগ */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ১. বিভাগ (Division) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedDivId}
            onChange={e => handleDivisionChange(e.target.value)}
            required
            disabled={loading || divisionsList.length === 0}
            style={{ width: '100%', color: '#0f172a', fontWeight: '600', height: '40px', background: '#ffffff' }}
          >
            <option value="">-- বিভাগ নির্বাচন করুন --</option>
            {divisionsList.map(d => (
              <option key={d._id} value={d._id}>{d.name || d.bn_name}</option>
            ))}
          </select>
        </div>

        {/* ২. জেলা */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ২. জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedDistId}
            onChange={e => handleDistrictChange(e.target.value)}
            required
            disabled={loading || !selectedDivId || districtsList.length === 0}
            style={{
              width: '100%',
              color: '#0f172a',
              fontWeight: '600',
              height: '40px',
              background: !selectedDivId ? '#f8fafc' : '#ffffff'
            }}
          >
            <option value="">{selectedDivId ? '-- জেলা নির্বাচন করুন --' : '-- প্রথমে বিভাগ নির্বাচন করুন --'}</option>
            {districtsList.map(d => (
              <option key={d._id} value={d._id}>{d.name || d.bn_name}</option>
            ))}
          </select>
        </div>

        {/* ৩. উপজেলা */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ৩. উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedUpzId}
            onChange={e => handleUpazilaChange(e.target.value)}
            required
            disabled={loading || !selectedDistId || upazilasList.length === 0}
            style={{
              width: '100%',
              color: '#0f172a',
              fontWeight: '600',
              height: '40px',
              background: !selectedDistId ? '#f8fafc' : '#ffffff'
            }}
          >
            <option value="">{selectedDistId ? '-- উপজেলা নির্বাচন করুন --' : '-- প্রথমে জেলা নির্বাচন করুন --'}</option>
            {upazilasList.map(u => (
              <option key={u._id} value={u._id}>{u.name || u.bn_name}</option>
            ))}
          </select>
        </div>

        {/* ৪. মৌজা */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ৪. মৌজা (Mouza) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedMouzaId}
            onChange={e => handleMouzaChange(e.target.value)}
            required
            disabled={loading || !selectedUpzId || mouzasList.length === 0}
            style={{
              width: '100%',
              color: '#0f172a',
              fontWeight: '600',
              height: '40px',
              background: !selectedUpzId ? '#f8fafc' : '#ffffff'
            }}
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
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ৫. খতিয়ান নম্বর (Khatian) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedKhatianId}
            onChange={e => handleKhatianChange(e.target.value)}
            required
            disabled={loading || !selectedMouzaId || khatiansList.length === 0}
            style={{
              width: '100%',
              color: '#0f172a',
              fontWeight: '600',
              height: '40px',
              background: !selectedMouzaId ? '#f8fafc' : '#ffffff'
            }}
          >
            <option value="">{selectedMouzaId ? '-- খতিয়ান নম্বর নির্বাচন করুন --' : '-- প্রথমে মৌজা নির্বাচন করুন --'}</option>
            {khatiansList.map(k => (
              <option key={k._id} value={k._id}>
                {k.khatian_no} {k.khatian_type ? `(${k.khatian_type})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ৬. দাগ নম্বর */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
            ৬. দাগ নম্বর (Plot No) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="input-field"
            value={selectedDagId}
            onChange={e => handleDagChange(e.target.value)}
            required
            disabled={loading || !selectedKhatianId || dagsList.length === 0}
            style={{
              width: '100%',
              color: '#0f172a',
              fontWeight: '600',
              height: '40px',
              background: !selectedKhatianId ? '#f8fafc' : '#ffffff'
            }}
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

      {/* Step Helper & Refresh Bar */}
      <div style={{
        background: '#f8fafc',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '11.5px',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} color={accentColor} />
          <span>অনুসন্ধান ক্রম: <strong>বিভাগ ➔ জেলা ➔ উপজেলা ➔ মৌজা ➔ খতিয়ান ➔ দাগ নম্বর</strong></span>
        </div>
        <button
          type="button"
          onClick={loadDivisions}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: accentColor,
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="ডাটাবেজ রিফ্রেশ করুন"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      <button
        type="submit"
        disabled={searching || !nidValue?.trim() || !selectedDagId}
        style={{
          width: '100%',
          padding: '11px 18px',
          fontSize: '13.5px',
          fontWeight: '700',
          background: (!nidValue?.trim() || !selectedDagId || searching) ? '#94a3b8' : accentColor,
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          cursor: (!nidValue?.trim() || !selectedDagId || searching) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: (!nidValue?.trim() || !selectedDagId) ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease'
        }}
      >
        {searching ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>অনুসন্ধান ও যাচাই করা হচ্ছে...</span>
          </>
        ) : (
          <span>{searchButtonText}</span>
        )}
      </button>
    </form>
  );
}

