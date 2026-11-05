import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers, MapPin, Building2, Plus, Edit, Trash2, CheckCircle,
  AlertTriangle, RefreshCw, ChevronRight, Check, X, Eye, Sparkles,
  Database, ArrowRight, ShieldCheck, ListFilter, HelpCircle
} from 'lucide-react';

export default function DynamicLocationManager() {
  // Active Wizard Step: 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'tree'
  const [activeStep, setActiveStep] = useState('step1');

  // Summary counts
  const [summary, setSummary] = useState({
    divisions: 0,
    districts: 0,
    upazilas: 0,
    mouzas: 0,
    dags: 0,
    khatians: 0
  });

  // Data lists
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [mouzas, setMouzas] = useState([]);
  const [dags, setDags] = useState([]);
  const [khatians, setKhatians] = useState([]);

  // Selected parents for cascading forms & views
  const [selectedDivId, setSelectedDivId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');
  const [selectedUpzId, setSelectedUpzId] = useState('');
  const [selectedMouzaId, setSelectedMouzaId] = useState('');
  const [selectedDagId, setSelectedDagId] = useState('');

  // Creation forms state
  const [divForm, setDivForm] = useState({ name: '', code: '', bn_name: '', description: '' });
  const [distForm, setDistForm] = useState({ division_id: '', name: '', code: '', description: '' });
  const [upzForm, setUpzForm] = useState({ district_id: '', name: '', code: '', description: '' });
  const [mouzaForm, setMouzaForm] = useState({ upazila_id: '', name: '', jl_no: '', remarks: '' });
  const [dagForm, setDagForm] = useState({ mouza_id: '', dag_no: '', land_type: 'নাল / কৃষি জমি', total_area_decimal: 10, remarks: '' });
  const [khatianForm, setKhatianForm] = useState({
    dag_id: '',
    khatian_no: '',
    khatian_type: 'বিএস (BS)',
    remarks: ''
  });

  // UI status
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null); // { type, data }

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setActionMsg(msg);
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchDivisions();
  }, []);

  // When selected division changes, load districts
  useEffect(() => {
    if (selectedDivId) {
      fetchDistricts(selectedDivId);
      setDistForm(p => ({ ...p, division_id: selectedDivId }));
    } else {
      setDistricts([]);
      setSelectedDistId('');
    }
  }, [selectedDivId]);

  // When selected district changes, load upazilas
  useEffect(() => {
    if (selectedDistId) {
      fetchUpazilas(selectedDistId);
      setUpzForm(p => ({ ...p, district_id: selectedDistId }));
    } else {
      setUpazilas([]);
      setSelectedUpzId('');
    }
  }, [selectedDistId]);

  // When selected upazila changes, load mouzas
  useEffect(() => {
    if (selectedUpzId) {
      fetchMouzas(selectedUpzId);
      setMouzaForm(p => ({ ...p, upazila_id: selectedUpzId }));
    } else {
      setMouzas([]);
      setSelectedMouzaId('');
    }
  }, [selectedUpzId]);

  // When selected mouza changes, load dags
  useEffect(() => {
    if (selectedMouzaId) {
      fetchDags(selectedMouzaId);
      setDagForm(p => ({ ...p, mouza_id: selectedMouzaId }));
    } else {
      setDags([]);
      setSelectedDagId('');
    }
  }, [selectedMouzaId]);

  // When selected dag changes, load khatians
  useEffect(() => {
    if (selectedDagId) {
      fetchKhatians(selectedDagId);
      setKhatianForm(p => ({ ...p, dag_id: selectedDagId }));
    } else {
      setKhatians([]);
    }
  }, [selectedDagId]);

  // ─────────────────────────────────────────────────────────────
  // Fetch Functions
  // ─────────────────────────────────────────────────────────────
  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/locations/summary');
      if (res.data.success) setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await axios.get('/api/locations/divisions?includeInactive=true');
      if (res.data.success) {
        setDivisions(res.data.data);
        if (res.data.data.length > 0 && !selectedDivId) {
          setSelectedDivId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDistricts = async (divId) => {
    try {
      const res = await axios.get(`/api/locations/districts?division_id=${divId}&includeInactive=true`);
      if (res.data.success) {
        setDistricts(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDistId(res.data.data[0]._id);
        } else {
          setSelectedDistId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUpazilas = async (distId) => {
    try {
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}&includeInactive=true`);
      if (res.data.success) {
        setUpazilas(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedUpzId(res.data.data[0]._id);
        } else {
          setSelectedUpzId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMouzas = async (upzId) => {
    try {
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}&includeInactive=true`);
      if (res.data.success) {
        setMouzas(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedMouzaId(res.data.data[0]._id);
        } else {
          setSelectedMouzaId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDags = async (mouzaId) => {
    try {
      const res = await axios.get(`/api/locations/dags?mouza_id=${mouzaId}&includeInactive=true`);
      if (res.data.success) {
        setDags(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDagId(res.data.data[0]._id);
        } else {
          setSelectedDagId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKhatians = async (dagId) => {
    try {
      const res = await axios.get(`/api/locations/khatians?dag_id=${dagId}&includeInactive=true`);
      if (res.data.success) {
        setKhatians(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Submission Handlers
  // ─────────────────────────────────────────────────────────────
  const handleCreateDivision = async (e) => {
    e.preventDefault();
    if (!divForm.name.trim()) return showFeedback('বিভাগের নাম লিখুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/divisions', divForm);
      if (res.data.success) {
        showFeedback(res.data.message);
        setDivForm({ name: '', code: '', bn_name: '', description: '' });
        fetchDivisions();
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'বিভাগ তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    if (!distForm.division_id) return showFeedback('বিভাগ নির্বাচন করুন', true);
    if (!distForm.name.trim()) return showFeedback('জেলার নাম লিখুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/districts', distForm);
      if (res.data.success) {
        showFeedback(res.data.message);
        setDistForm(p => ({ ...p, name: '', code: '', description: '' }));
        fetchDistricts(distForm.division_id);
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'জেলা তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUpazila = async (e) => {
    e.preventDefault();
    if (!upzForm.district_id) return showFeedback('জেলা নির্বাচন করুন', true);
    if (!upzForm.name.trim()) return showFeedback('উপজেলার নাম লিখুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/upazilas', upzForm);
      if (res.data.success) {
        showFeedback(res.data.message);
        setUpzForm(p => ({ ...p, name: '', code: '', description: '' }));
        fetchUpazilas(upzForm.district_id);
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'উপজেলা তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMouza = async (e) => {
    e.preventDefault();
    if (!mouzaForm.upazila_id) return showFeedback('উপজেলা নির্বাচন করুন', true);
    if (!mouzaForm.name.trim() || !mouzaForm.jl_no.trim()) return showFeedback('মৌজার নাম ও জে.এল নম্বর প্রদান করুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/mouzas', mouzaForm);
      if (res.data.success) {
        showFeedback(res.data.message);
        setMouzaForm(p => ({ ...p, name: '', jl_no: '', remarks: '' }));
        fetchMouzas(mouzaForm.upazila_id);
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'মৌজা তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDag = async (e) => {
    e.preventDefault();
    if (!dagForm.mouza_id) return showFeedback('মৌজা নির্বাচন করুন', true);
    if (!dagForm.dag_no.trim()) return showFeedback('দাগ নম্বর প্রদান করুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/dags', dagForm);
      if (res.data.success) {
        showFeedback(res.data.message);
        setDagForm(p => ({ ...p, dag_no: '', total_area_decimal: 10, remarks: '' }));
        fetchDags(dagForm.mouza_id);
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'দাগ তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKhatian = async (e) => {
    e.preventDefault();
    if (!khatianForm.dag_id) return showFeedback('দাগ নম্বর নির্বাচন করুন', true);
    if (!khatianForm.khatian_no.trim()) return showFeedback('খতিয়ান নম্বর প্রদান করুন', true);
    setLoading(true);
    try {
      const res = await axios.post('/api/locations/khatians', {
        dag_id: khatianForm.dag_id,
        khatian_no: khatianForm.khatian_no.trim(),
        khatian_type: khatianForm.khatian_type,
        remarks: khatianForm.remarks
      });
      if (res.data.success) {
        showFeedback(res.data.message);
        setKhatianForm(p => ({
          ...p,
          khatian_no: '',
          remarks: ''
        }));
        fetchKhatians(khatianForm.dag_id);
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'খতিয়ান তৈরি ব্যর্থ হয়েছে', true);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Delete Handlers with Integrity Protection
  // ─────────────────────────────────────────────────────────────
  const handleDelete = async (endpoint, id, refreshFn) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      const res = await axios.delete(`/api/locations/${endpoint}/${id}`);
      if (res.data.success) {
        showFeedback(res.data.message);
        refreshFn();
        fetchSummary();
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'মুছে ফেলা ব্যর্থ হয়েছে।', true);
    }
  };

  const stepsList = [
    { id: 'step1', title: 'Step 1: Division', label: '১. বিভাগ তৈরি', count: summary.divisions, color: '#2563eb' },
    { id: 'step2', title: 'Step 2: District', label: '২. জেলা তৈরি', count: summary.districts, color: '#059669' },
    { id: 'step3', title: 'Step 3: Upazila', label: '৩. উপজেলা তৈরি', count: summary.upazilas, color: '#d97706' },
    { id: 'step4', title: 'Step 4: Mouza', label: '৪. মৌজা ও JL তৈরি', count: summary.mouzas, color: '#7c3aed' },
    { id: 'step5', title: 'Step 5: Dag Number', label: '৫. দাগ নম্বর তৈরি', count: summary.dags, color: '#dc2626' },
    { id: 'step6', title: 'Step 6: Khatian Number', label: '৬. খতিয়ান নম্বর তৈরি', count: summary.khatians, color: '#0d9488' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─────────────────────────────────────────────────────────────
          HEADER BANNER & HIERARCHY SUMMARY
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b, #047857)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px' }}>
                <Layers size={24} color="#86efac" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.3px' }}>
                  ডায়নামিক লোকেশন ও জমি তৈরি সিস্টেম (Admin-Controlled Hierarchy)
                </h2>
                <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Division ➔ District ➔ Upazila ➔ Mouza ➔ Dag Number ➔ Khatian Number প্রতিটি স্তর ধাপে ধাপে সুপার এডমিন কর্তৃক নিয়ন্ত্রিত
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { fetchSummary(); fetchDivisions(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> রিফ্রেশ
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {actionMsg && (
          <div style={{ marginTop: '16px', padding: '10px 16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '8px', color: '#a7f3d0', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> {actionMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ marginTop: '16px', padding: '10px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        {/* COMPLETE HIERARCHY PILL STEPS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '22px' }}>
          {stepsList.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              style={{
                padding: '12px 14px',
                background: activeStep === s.id ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                color: activeStep === s.id ? '#0f172a' : '#ffffff',
                borderRadius: '10px',
                border: activeStep === s.id ? `2.5px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '800', color: activeStep === s.id ? s.color : '#94a3b8' }}>
                {s.title}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', marginTop: '4px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '11px', color: activeStep === s.id ? '#475569' : '#cbd5e1', marginTop: '4px' }}>
                সংরক্ষিত: <strong>{s.count}</strong> টি
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: DIVISION CREATE & MANAGE
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step1' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#2563eb" /> ধাপ ১: নতুন বিভাগ যুক্ত করুন (Create Division)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#475569', marginBottom: '16px' }}>
              সিস্টেমে কোনো বিভাগ পূর্বে থেকে তৈরি না থাকলে নতুন বিভাগ নাম দিয়ে শুরু করুন।
            </p>

            <form onSubmit={handleCreateDivision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  বিভাগের নাম (বাংলায়) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রাজশাহী, ঢাকা, চট্টগ্রাম..."
                  value={divForm.name}
                  onChange={(e) => setDivForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  বিভাগ কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: RAJ, DHA..."
                  value={divForm.code}
                  onChange={(e) => setDivForm(p => ({ ...p, code: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  বিবরণ বা নোট
                </label>
                <textarea
                  placeholder="প্রশাসনিক নোট..."
                  rows="2"
                  value={divForm.description}
                  onChange={(e) => setDivForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> বিভাগ সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Divisions */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                তৈরিকৃত বিভাগসমূহের তালিকা ({divisions.length})
              </h3>
              <button
                onClick={() => setActiveStep('step2')}
                disabled={divisions.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#2563eb',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: divisions.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                পরবর্তী ধাপ (জেলা তৈরি) <ArrowRight size={13} />
              </button>
            </div>

            {divisions.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <Building2 size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>কোনো বিভাগ তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে ফর্ম পূরণ করে প্রথম বিভাগ তৈরি করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {divisions.map((d) => (
                  <div
                    key={d._id}
                    style={{
                      padding: '12px 16px',
                      background: selectedDivId === d._id ? '#eff6ff' : '#f8fafc',
                      border: selectedDivId === d._id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        {d.name} {d.code && <span style={{ fontSize: '11px', color: '#64748b' }}>({d.code})</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        আইডি: <span style={{ fontFamily: 'monospace' }}>{d._id}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setSelectedDivId(d._id); setActiveStep('step2'); }}
                        title="এই বিভাগের অধীনে জেলা তৈরি করুন"
                        style={{ padding: '5px 10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        জেলা যুক্ত করুন
                      </button>
                      <button
                        onClick={() => handleDelete('divisions', d._id, fetchDivisions)}
                        title="মুছে ফেলুন"
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: DISTRICT CREATE & MANAGE (Parent: Division)
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step2' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#059669" /> ধাপ ২: নতুন জেলা যুক্ত করুন (Create District)
            </h3>

            <form onSubmit={handleCreateDistrict} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                  ১. বিভাগ নির্বাচন করুন (Division Selection Dropdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={distForm.division_id || selectedDivId}
                  onChange={(e) => {
                    setSelectedDivId(e.target.value);
                    setDistForm(p => ({ ...p, division_id: e.target.value }));
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}
                >
                  <option value="">-- বিভাগ বেছে নিন --</option>
                  {divisions.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ২. জেলার নাম (বাংলায়) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বগুড়া, রাজশাহী, ঢাকা..."
                  value={distForm.name}
                  onChange={(e) => setDistForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  জেলা কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: BOG, RAJ..."
                  value={distForm.code}
                  onChange={(e) => setDistForm(p => ({ ...p, code: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> জেলা সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Districts */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  নির্বাচিত বিভাগের জেলাসমূহ ({districts.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  বিভাগ: <strong>{divisions.find(d => d._id === selectedDivId)?.name || 'নির্বাচন করুন'}</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('step3')}
                disabled={districts.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#059669',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: districts.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                পরবর্তী ধাপ (উপজেলা তৈরি) <ArrowRight size={13} />
              </button>
            </div>

            {districts.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>এই বিভাগে কোনো জেলা তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে নির্দিষ্ট বিভাগের অধীনে জেলা যুক্ত করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {districts.map((dst) => (
                  <div
                    key={dst._id}
                    style={{
                      padding: '12px 16px',
                      background: selectedDistId === dst._id ? '#ecfdf5' : '#f8fafc',
                      border: selectedDistId === dst._id ? '1.5px solid #059669' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        {dst.name} {dst.code && <span style={{ fontSize: '11px', color: '#64748b' }}>({dst.code})</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        বিভাগ: {dst.division_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setSelectedDistId(dst._id); setActiveStep('step3'); }}
                        style={{ padding: '5px 10px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        উপজেলা যুক্ত করুন
                      </button>
                      <button
                        onClick={() => handleDelete('districts', dst._id, () => fetchDistricts(selectedDivId))}
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: UPAZILA CREATE & MANAGE (Parent: District)
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step3' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#d97706" /> ধাপ ৩: নতুন উপজেলা তৈরি করুন (Create Upazila)
            </h3>

            <form onSubmit={handleCreateUpazila} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                  ১. জেলা নির্বাচন করুন (District Selection Dropdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={upzForm.district_id || selectedDistId}
                  onChange={(e) => {
                    setSelectedDistId(e.target.value);
                    setUpzForm(p => ({ ...p, district_id: e.target.value }));
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}
                >
                  <option value="">-- জেলা বেছে নিন --</option>
                  {districts.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.division_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ২. উপজেলার নাম (বাংলায়) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: শিবগঞ্জ, বগুড়া সদর, শেরপুর..."
                  value={upzForm.name}
                  onChange={(e) => setUpzForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  উপজেলা কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: SHIB, SADAR..."
                  value={upzForm.code}
                  onChange={(e) => setUpzForm(p => ({ ...p, code: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> উপজেলা সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Upazilas */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  উপজেলা তালিকা ({upazilas.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  জেলা: <strong>{districts.find(d => d._id === selectedDistId)?.name || 'নির্বাচন করুন'}</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('step4')}
                disabled={upazilas.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#d97706',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: upazilas.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                পরবর্তী ধাপ (মৌজা তৈরি) <ArrowRight size={13} />
              </button>
            </div>

            {upazilas.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>এই জেলায় কোনো উপজেলা তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে নির্দিষ্ট জেলার অধীনে উপজেলা যুক্ত করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {upazilas.map((u) => (
                  <div
                    key={u._id}
                    style={{
                      padding: '12px 16px',
                      background: selectedUpzId === u._id ? '#fffbeb' : '#f8fafc',
                      border: selectedUpzId === u._id ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        {u.name} {u.code && <span style={{ fontSize: '11px', color: '#64748b' }}>({u.code})</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        জেলা: {u.district_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setSelectedUpzId(u._id); setActiveStep('step4'); }}
                        style={{ padding: '5px 10px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        মৌজা যুক্ত করুন
                      </button>
                      <button
                        onClick={() => handleDelete('upazilas', u._id, () => fetchUpazilas(selectedDistId))}
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 4: MOUZA CREATE & MANAGE (Parent: Upazila)
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step4' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#7c3aed" /> ধাপ ৪: নতুন মৌজা তৈরি করুন (Create Mouza & JL)
            </h3>

            <form onSubmit={handleCreateMouza} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                  ১. উপজেলা নির্বাচন করুন (Upazila Selection Dropdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={mouzaForm.upazila_id || selectedUpzId}
                  onChange={(e) => {
                    setSelectedUpzId(e.target.value);
                    setMouzaForm(p => ({ ...p, upazila_id: e.target.value }));
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}
                >
                  <option value="">-- উপজেলা বেছে নিন --</option>
                  {upazilas.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.district_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ২. মৌজার নাম (বাংলায়) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: গুজিয়া, অনন্তবালা, চক হরিপুর..."
                  value={mouzaForm.name}
                  onChange={(e) => setMouzaForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ৩. জে.এল (J.L) নম্বর <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 1, 2, 54, ১২..."
                  value={mouzaForm.jl_no}
                  onChange={(e) => setMouzaForm(p => ({ ...p, jl_no: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> মৌজা সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Mouzas */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  মৌজা তালিকা ({mouzas.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  উপজেলা: <strong>{upazilas.find(u => u._id === selectedUpzId)?.name || 'নির্বাচন করুন'}</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('step5')}
                disabled={mouzas.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#7c3aed',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: mouzas.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                পরবর্তী ধাপ (দাগ তৈরি) <ArrowRight size={13} />
              </button>
            </div>

            {mouzas.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>এই উপজেলায় কোনো মৌজা তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে মৌজা ও জে.এল নম্বর যুক্ত করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {mouzas.map((m) => (
                  <div
                    key={m._id}
                    style={{
                      padding: '12px 16px',
                      background: selectedMouzaId === m._id ? '#f5f3ff' : '#f8fafc',
                      border: selectedMouzaId === m._id ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        মৌজা: {m.name} <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: '#ede9fe', color: '#6d28d9', fontWeight: '800' }}>জে.এল নং {m.jl_no}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        উপজেলা: {m.upazila_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setSelectedMouzaId(m._id); setActiveStep('step5'); }}
                        style={{ padding: '5px 10px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        দাগ যুক্ত করুন
                      </button>
                      <button
                        onClick={() => handleDelete('mouzas', m._id, () => fetchMouzas(selectedUpzId))}
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 5: DAG NUMBER CREATE & MANAGE (Parent: Mouza)
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step5' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#dc2626" /> ধাপ ৫: নতুন দাগ নম্বর তৈরি করুন (Create Dag Number)
            </h3>

            <form onSubmit={handleCreateDag} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                  ১. মৌজা নির্বাচন করুন (Mouza Selection Dropdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={dagForm.mouza_id || selectedMouzaId}
                  onChange={(e) => {
                    setSelectedMouzaId(e.target.value);
                    setDagForm(p => ({ ...p, mouza_id: e.target.value }));
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}
                >
                  <option value="">-- মৌজা বেছে নিন --</option>
                  {mouzas.map(m => (
                    <option key={m._id} value={m._id}>{m.name} (জে.এল: {m.jl_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ২. দাগ নম্বর <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ৪৫, ১২০, ৯৯২..."
                  value={dagForm.dag_no}
                  onChange={(e) => setDagForm(p => ({ ...p, dag_no: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ৩. জমির ধরন / শ্রেণী
                </label>
                <select
                  value={dagForm.land_type}
                  onChange={(e) => setDagForm(p => ({ ...p, land_type: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                >
                  <option value="নাল / কৃষি জমি">নাল / কৃষি জমি</option>
                  <option value="ভিটি / আবাসিক">ভিটি / আবাসিক</option>
                  <option value="বাণিজ্যিক">বাণিজ্যিক</option>
                  <option value="পুকুর / জলাশয়">পুকুর / জলাশয়</option>
                  <option value="বাগান / পতিত">বাগান / পতিত</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ৪. দাগের মোট জমির পরিমাণ (শতক / Decimal)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={dagForm.total_area_decimal}
                  onChange={(e) => setDagForm(p => ({ ...p, total_area_decimal: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> দাগ নম্বর সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Dags */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  দাগ নম্বরের তালিকা ({dags.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  মৌজা: <strong>{mouzas.find(m => m._id === selectedMouzaId)?.name || 'নির্বাচন করুন'}</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('step6')}
                disabled={dags.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#dc2626',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: dags.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                পরবর্তী ধাপ (খতিয়ান তৈরি) <ArrowRight size={13} />
              </button>
            </div>

            {dags.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>এই মৌজায় কোনো দাগ নম্বর তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে নির্দিষ্ট মৌজার অধীনে দাগ নম্বর যুক্ত করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {dags.map((dg) => (
                  <div
                    key={dg._id}
                    style={{
                      padding: '12px 16px',
                      background: selectedDagId === dg._id ? '#fef2f2' : '#f8fafc',
                      border: selectedDagId === dg._id ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        দাগ নং: {dg.dag_no} <span style={{ fontSize: '11px', color: '#047857', fontWeight: '800' }}>({dg.total_area_decimal} শতক)</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        ধরন: {dg.land_type} | মৌজা: {dg.mouza_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => { setSelectedDagId(dg._id); setActiveStep('step6'); }}
                        style={{ padding: '5px 10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        খতিয়ান যুক্ত করুন
                      </button>
                      <button
                        onClick={() => handleDelete('dags', dg._id, () => fetchDags(selectedMouzaId))}
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 6: KHATIAN NUMBER CREATE & MANAGE (Parent: Dag)
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'step6' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '24px' }}>
          {/* Creation Form */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="#0d9488" /> ধাপ ৬: নতুন খতিয়ান তৈরি করুন (Create Khatian Number)
            </h3>

            <form onSubmit={handleCreateKhatian} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                  ১. দাগ নম্বর নির্বাচন করুন (Dag Selection Dropdown) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={khatianForm.dag_id || selectedDagId}
                  onChange={(e) => {
                    setSelectedDagId(e.target.value);
                    setKhatianForm(p => ({ ...p, dag_id: e.target.value }));
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: '700' }}
                >
                  <option value="">-- দাগ নম্বর বেছে নিন --</option>
                  {dags.map(d => (
                    <option key={d._id} value={d._id}>দাগ নং: {d.dag_no} (মৌজা: {d.mouza_name}, {d.total_area_decimal} শতক)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    ২. খতিয়ান নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ১, ১২, ১০৫..."
                    value={khatianForm.khatian_no}
                    onChange={(e) => setKhatianForm(p => ({ ...p, khatian_no: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    খতিয়ানের ধরন
                  </label>
                  <select
                    value={khatianForm.khatian_type}
                    onChange={(e) => setKhatianForm(p => ({ ...p, khatian_type: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                  >
                    <option value="বিএস (BS)">বিএস (BS)</option>
                    <option value="সিএস (CS)">সিএস (CS)</option>
                    <option value="এসএ (SA)">এসএ (SA)</option>
                    <option value="আরএস (RS)">আরএস (RS)</option>
                    <option value="ই-নামজারি">ই-নামজারি (Mutation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                  ৩. অতিরিক্ত বিবরণ / মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: হাল রেকর্ডীয় খতিয়ান, সরকারি রেকর্ড ইত্যাদি"
                  value={khatianForm.remarks}
                  onChange={(e) => setKhatianForm(p => ({ ...p, remarks: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              {/* Informative Note regarding Sub-Registry Office Land Assignment */}
              <div style={{
                padding: '12px 14px',
                background: '#f0fdfa',
                border: '1.5px dashed #0d9488',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <Sparkles size={20} color="#0d9488" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: '#134e4a', lineHeight: '1.5' }}>
                  <strong>খতিয়ানে জমি বরাদ্দ নীতি:</strong> সুপার এডমিন শুধুমাত্র দাগের অধীনে খতিয়ান নম্বর ও এর ধরন প্রস্তুত করবেন। এই খতিয়ানের জমি নির্দিষ্ট কোনো নাগরিকের নামে বরাদ্দ (Assign), রেজিস্ট্রেশন এবং দলিল সম্পাদন কার্যক্রম <strong>সাব-রেজিস্ট্রি অফিস (Register Office)</strong> থেকে সম্পন্ন হবে।
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> খতিয়ান নম্বর সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List of Khatians */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  খতিয়ান নম্বরের তালিকা ({khatians.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  দাগ নং: <strong>{dags.find(d => d._id === selectedDagId)?.dag_no || 'নির্বাচন করুন'}</strong>
                </div>
              </div>
            </div>

            {khatians.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                <div style={{ fontWeight: '700' }}>এই দাগে কোনো খতিয়ান নম্বর তৈরি করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>বামে নির্দিষ্ট দাগের অধীনে খতিয়ান নম্বর যুক্ত করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {khatians.map((k) => (
                  <div
                    key={k._id}
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                        খতিয়ান নং: {k.khatian_no} <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: '800' }}>({k.khatian_type})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        মৌজা: {k.mouza_name} | দাগ: {k.dag_no} {k.area_decimal ? `| দাগের মোট পরিমাণ: ${k.area_decimal} শতক` : ''}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                          🏛️ রেজিস্ট্রি অফিসে বরাদ্দযোগ্য
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleDelete('khatians', k._id, () => fetchKhatians(selectedDagId))}
                        style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

