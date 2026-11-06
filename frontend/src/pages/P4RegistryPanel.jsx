import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Search, CheckCircle, FileText, Download, Hash, Fingerprint, Smartphone, 
  ShieldAlert, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, 
  Check, Sparkles, Send, Lock, Clock, Info, UserX, Loader2, Users, Plus, Trash2, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function P4RegistryPanel() {
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
  const [panelTab, setPanelTab] = useState('register'); // 'register' | 'tracking'
  const [pendingMutations, setPendingMutations] = useState([]);
  const [loadingMutations, setLoadingMutations] = useState(false);

  const fetchPendingMutations = async () => {
    setLoadingMutations(true);
    try {
      const res = await axios.get('/api/p4/pending-mutations');
      if (res.data?.success) {
        setPendingMutations(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending mutations:', err);
    } finally {
      setLoadingMutations(false);
    }
  };

  useEffect(() => {
    fetchPendingMutations();
  }, []);

  const [searchLoading, setSearchLoading] = useState(false);
  const [landRecord, setLandRecord] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [doubleSellAlert, setDoubleSellAlert] = useState(null);

  // Cascading Location States from Database (Admin-created real data only)
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

  // Buyer verification states
  const [buyerVerifying, setBuyerVerifying] = useState(false);
  const [buyerVerified, setBuyerVerified] = useState(false);
  const [buyerVerifyMsg, setBuyerVerifyMsg] = useState(null);
  const [buyerVerifyError, setBuyerVerifyError] = useState(null);

  const [deedForm, setDeedForm] = useState({
    deed_no: `DEED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    deed_year: new Date().getFullYear().toString(),
    sub_registry_code: 'SR-BOG-SHIB-01',
    buyer_name: '',
    buyer_nid: '',
    buyer_phone: '',
    buyer_email: '',
    sold_area: '',
  });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState(null);
  const pdfRef = useRef(null);

  // Mandatory Deed Registration OTP states
  const [deedOtp, setDeedOtp] = useState('');
  const [otpTarget, setOtpTarget] = useState('seller'); // strictly 'seller' (current land owner)
  const [sendingDeedOtp, setSendingDeedOtp] = useState(false);
  const [deedOtpSentMsg, setDeedOtpSentMsg] = useState(null);
  const [deedOtpError, setDeedOtpError] = useState(null);

  // Biometric Fingerprint states (Display Only / Future Preparation)
  const [fpScanning, setFpScanning] = useState(false);
  const [fpVerified, setFpVerified] = useState(false);
  const [fpMessage, setFpMessage] = useState(null);

  const handleSimulateFingerprint = () => {
    setFpScanning(true);
    setFpMessage('বায়োমেট্রিক স্ক্যানার সক্রিয় হচ্ছে... আঙুলের ছাপ দিন');
    setTimeout(() => {
      setFpScanning(false);
      setFpVerified(true);
      setFpMessage('✅ বায়োমেট্রিক ফিঙ্গারপ্রিন্ট টেস্ট ভেরিফিকেশন সফল (UI Display Match: 99.4%)');
    }, 1600);
  };

  const handleSendDeedOtp = async () => {
    if (!landRecord || !deedForm.buyer_nid) {
      alert('অনুগ্রহ করে প্রথমে জমি ও ক্রেতার তথ্য নিশ্চিত করুন!');
      return;
    }
    setSendingDeedOtp(true);
    setDeedOtpSentMsg(null);
    setDeedOtpError(null);
    try {
      const res = await axios.post('/api/otp/send-deed-registration-otp', {
        record_id: landRecord._id,
        seller_nid: landRecord.owner_nid,
        seller_email: landRecord.owner_email,
        seller_name: landRecord.owner_name,
        buyer_nid: deedForm.buyer_nid,
        buyer_email: deedForm.buyer_email,
        buyer_name: deedForm.buyer_name,
        deed_no: deedForm.deed_no,
        mouza: landRecord.mouza,
        dag_no: landRecord.dag_no,
        khatian_no: landRecord.khatian_no,
        target_recipient: 'seller'
      });
      if (res.data.success) {
        setDeedOtpSentMsg(res.data.message || `ওটিপি সফলভাবে পাঠানো হয়েছে: ${res.data.recipient_email}`);
      }
    } catch (err) {
      setDeedOtpError(err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSendingDeedOtp(false);
    }
  };

  // Joint Deed co-buyers state
  const [coBuyers, setCoBuyers] = useState([]);

  const addCoBuyer = () => {
    setCoBuyers(prev => [
      ...prev,
      {
        id: Date.now(),
        nid: '',
        name: '',
        phone: '',
        email: '',
        share_decimal: '',
        verified: false,
        verifying: false,
        verifyMsg: null,
        verifyError: null
      }
    ]);
  };

  const removeCoBuyer = (index) => {
    setCoBuyers(prev => prev.filter((_, i) => i !== index));
  };

  const updateCoBuyer = (index, field, value) => {
    setCoBuyers(prev => prev.map((cb, i) => i === index ? { ...cb, [field]: value } : cb));
  };

  const handleVerifyCoBuyer = async (index) => {
    const target = coBuyers[index];
    if (!target || !target.nid?.trim()) {
      updateCoBuyer(index, 'verifyError', 'এনআইডি নম্বর লিখুন।');
      return;
    }
    updateCoBuyer(index, 'verifying', true);
    updateCoBuyer(index, 'verifyError', null);
    updateCoBuyer(index, 'verifyMsg', null);
    try {
      const res = await axios.get(`/api/verify-buyer/${encodeURIComponent(target.nid.trim())}`);
      if (res.data.success && res.data.buyer) {
        setCoBuyers(prev => prev.map((cb, i) => i === index ? {
          ...cb,
          name: res.data.buyer.name,
          phone: res.data.buyer.phone || cb.phone,
          email: res.data.buyer.email || cb.email,
          verified: true,
          verifying: false,
          verifyMsg: `✅ যাচাই সম্পন্ন: ${res.data.buyer.name}`
        } : cb));
      }
    } catch (err) {
      updateCoBuyer(index, 'verified', false);
      updateCoBuyer(index, 'verifying', false);
      updateCoBuyer(index, 'verifyError', err.response?.data?.message || 'এনআইডি ডাটাবেজে পাওয়া যায়নি।');
    }
  };

  // ── Cascading Fetch Functions (Admin-created dynamic hierarchy from DB) ──
  const loadInitialHierarchy = async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get('/api/locations/divisions');
      const divs = res.data?.data || [];
      setDivisionsList(divs);
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
      setSearchForm(prev => ({
        ...prev,
        division: '',
        district: '',
        upazila: '',
        mouza: '',
        khatian_no: '',
        dag_no: ''
      }));
    } catch (err) {
      console.error('Failed to load initial hierarchy:', err);
      setDivisionsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    loadInitialHierarchy();
  }, []);

  // Dropdown selection change handlers (No auto-fill, user selects manually)
  const handleDivisionChange = async (divId) => {
    setSelectedDivId(divId);
    setSelectedDistId('');
    setUpazilasList([]);
    setSelectedUpzId('');
    setMouzasList([]);
    setSelectedMouzaId('');
    setKhatiansList([]);
    setSelectedKhatianId('');
    setDagsList([]);
    setSelectedDagId('');

    if (!divId) {
      setDistrictsList([]);
      setSearchForm(prev => ({
        ...prev,
        division: '',
        district: '',
        upazila: '',
        mouza: '',
        khatian_no: '',
        dag_no: ''
      }));
      return;
    }

    const div = divisionsList.find(d => d._id === divId);
    const divName = div ? div.name : '';
    setSearchForm(prev => ({
      ...prev,
      division: divName,
      district: '',
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    try {
      setLoadingLocations(true);
      const res = await axios.get(`/api/locations/districts?division_id=${divId}`);
      setDistrictsList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistrictsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDistrictChange = async (distId) => {
    setSelectedDistId(distId);
    setSelectedUpzId('');
    setMouzasList([]);
    setSelectedMouzaId('');
    setKhatiansList([]);
    setSelectedKhatianId('');
    setDagsList([]);
    setSelectedDagId('');

    if (!distId) {
      setUpazilasList([]);
      setSearchForm(prev => ({
        ...prev,
        district: '',
        upazila: '',
        mouza: '',
        khatian_no: '',
        dag_no: ''
      }));
      return;
    }

    const dist = districtsList.find(d => d._id === distId);
    const distName = dist ? dist.name : '';
    setSearchForm(prev => ({
      ...prev,
      district: distName,
      upazila: '',
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    try {
      setLoadingLocations(true);
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}`);
      setUpazilasList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching upazilas:', err);
      setUpazilasList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleUpazilaChange = async (upzId) => {
    setSelectedUpzId(upzId);
    setSelectedMouzaId('');
    setKhatiansList([]);
    setSelectedKhatianId('');
    setDagsList([]);
    setSelectedDagId('');

    if (!upzId) {
      setMouzasList([]);
      setSearchForm(prev => ({
        ...prev,
        upazila: '',
        mouza: '',
        khatian_no: '',
        dag_no: ''
      }));
      return;
    }

    const upz = upazilasList.find(u => u._id === upzId);
    const upzName = upz ? upz.name : '';
    setSearchForm(prev => ({
      ...prev,
      upazila: upzName,
      mouza: '',
      khatian_no: '',
      dag_no: ''
    }));

    try {
      setLoadingLocations(true);
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}`);
      setMouzasList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching mouzas:', err);
      setMouzasList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleMouzaChange = async (mouzaId) => {
    setSelectedMouzaId(mouzaId);
    setSelectedKhatianId('');
    setDagsList([]);
    setSelectedDagId('');

    if (!mouzaId) {
      setKhatiansList([]);
      setSearchForm(prev => ({
        ...prev,
        mouza: '',
        khatian_no: '',
        dag_no: ''
      }));
      return;
    }

    const mouza = mouzasList.find(m => m._id === mouzaId);
    const mouzaName = mouza ? mouza.name : '';
    setSearchForm(prev => ({
      ...prev,
      mouza: mouzaName,
      khatian_no: '',
      dag_no: ''
    }));

    try {
      setLoadingLocations(true);
      const res = await axios.get(`/api/locations/khatians?mouza_id=${mouzaId}`);
      setKhatiansList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching khatians:', err);
      setKhatiansList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleKhatianChange = async (khatianId) => {
    setSelectedKhatianId(khatianId);
    setSelectedDagId('');

    if (!khatianId) {
      setDagsList([]);
      setSearchForm(prev => ({
        ...prev,
        khatian_no: '',
        dag_no: ''
      }));
      return;
    }

    const kh = khatiansList.find(k => k._id === khatianId);
    const khNo = kh ? kh.khatian_no : '';
    setSearchForm(prev => ({
      ...prev,
      khatian_no: khNo,
      dag_no: ''
    }));

    try {
      setLoadingLocations(true);
      const res = await axios.get(`/api/locations/dags?khatian_id=${khatianId}`);
      setDagsList(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching dags:', err);
      setDagsList([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDagChange = (dagId) => {
    setSelectedDagId(dagId);
    if (!dagId) {
      setSearchForm(prev => ({
        ...prev,
        dag_no: ''
      }));
      return;
    }
    const dag = dagsList.find(d => d._id === dagId);
    const dagNo = dag ? dag.dag_no : '';
    setSearchForm(prev => ({
      ...prev,
      dag_no: dagNo
    }));
  };

  // Buyer NID live verification in database
  const handleVerifyBuyer = async (customNid) => {
    const targetNid = (customNid || deedForm.buyer_nid || '').toString().trim();
    if (!targetNid) {
      setBuyerVerifyError('অনুগ্রহ করে ক্রেতার NID নম্বর লিখুন।');
      return;
    }

    setBuyerVerifying(true);
    setBuyerVerifyError(null);
    setBuyerVerifyMsg(null);

    try {
      const res = await axios.get(`/api/verify-buyer/${encodeURIComponent(targetNid)}`);
      if (res.data.success && res.data.buyer) {
        setDeedForm(prev => ({
          ...prev,
          buyer_nid: res.data.buyer.nid,
          buyer_name: res.data.buyer.name,
          buyer_phone: res.data.buyer.phone || prev.buyer_phone,
          buyer_email: res.data.buyer.email || prev.buyer_email
        }));
        setBuyerVerified(true);
        setBuyerVerifyMsg(`✅ ক্রেতার অ্যাকাউন্ট যাচাই সম্পন্ন: ${res.data.buyer.name} (ইমেইল: ${res.data.buyer.email || 'N/A'})`);
      }
    } catch (err) {
      setBuyerVerified(false);
      setBuyerVerifyError(err.response?.data?.message || 'ক্রেতার অ্যাকাউন্ট ডাটাবেজে পাওয়া যায়নি। ক্রেতাকে প্রথমে নাগরিক হিসেবে নিবন্ধন করতে হবে।');
    } finally {
      setBuyerVerifying(false);
    }
  };

  // Step 1: Search Land & Run Anti-Double Selling Engine
  // Requires ALL THREE: Seller NID + Mouza + Dag Number
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchForm.seller_nid?.trim() || !searchForm.dag_no?.trim() || !searchForm.mouza?.trim() || !searchForm.khatian_no?.trim()) {
      setSearchError('অনুগ্রহ করে বিক্রেতার NID নম্বর, বিভাগ, জেলা, উপজেলা, মৌজা, খতিয়ান ও দাগ নম্বর নির্বাচন করুন।');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setLandRecord(null);
    setGrantResult(null);
    setDoubleSellAlert(null);
    setBuyerVerified(false);
    setBuyerVerifyMsg(null);
    setBuyerVerifyError(null);

    try {
      // Live Anti-Double Selling & Ownership check via verify-deed
      const verifyRes = await axios.post('/api/verify-deed', {
        seller_nid: searchForm.seller_nid?.trim(),
        division: searchForm.division?.trim(),
        district: searchForm.district?.trim(),
        upazila: searchForm.upazila?.trim(),
        mouza: searchForm.mouza?.trim(),
        khatian_no: searchForm.khatian_no?.trim(),
        dag_no: searchForm.dag_no?.trim(),
        requested_area: searchForm.requested_area || '1'
      });

      if (verifyRes.data) {
        if (!verifyRes.data.success) {
          // Double selling, fake owner, unassigned land, or not found alert
          setDoubleSellAlert(verifyRes.data);
          setLandRecord(null);
        } else {
          // Successfully verified against existing assigned land record
          setLandRecord(verifyRes.data.record);
          setDoubleSellAlert(null);
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'অনুসন্ধান ব্যর্থ হয়েছে। সার্ভার চালু আছে কি?');
    } finally {
      setSearchLoading(false);
    }
  };

  // Step 3: Grant Deed & Send to AC Land Dashboard
  const handleGrantDeed = async () => {
    if (!landRecord) {
      alert('অনুগ্রহ করে প্রথমে জমি নির্বাচন করুন!');
      return;
    }

    if (landRecord.status !== 'Active') {
      alert(`এই জমিটি বর্তমানে '${landRecord.status}' অবস্থায় থাকায় দলিল সম্পাদন করা সম্ভব নয়!`);
      return;
    }

    if (!buyerVerified) {
      alert('দলিল অনুমোদন করার পূর্বে অবশ্যই ক্রেতার NID সিস্টেমে যাচাই সম্পন্ন হতে হবে!');
      return;
    }

    if (!deedForm.buyer_name || !deedForm.buyer_nid || !deedForm.deed_no) {
      alert('ক্রেতার নাম, NID এবং দলিল নম্বর প্রদান আবশ্যক!');
      return;
    }

    if (!deedOtp || deedOtp.trim().length !== 6) {
      alert('🔒 সাব-রেজিস্ট্রি অফিসে সকল ধরনের দলিল নিবন্ধনের ক্ষেত্রে ৬ ডিজিটের ওটিপি (OTP) ভেরিফিকেশন বাধ্যতামূলক। অনুগ্রহ করে ওটিপি প্রদান করুন!');
      return;
    }

    let buyersPayload = [];
    let calculatedSoldArea = parseFloat(deedForm.sold_area || 0);

    if (coBuyers.length > 0) {
      for (let i = 0; i < coBuyers.length; i++) {
        const cb = coBuyers[i];
        if (!cb.verified) {
          alert(`যৌথ ক্রেতা ${i + 2}-এর NID যাচাই সম্পন্ন করতে হবে!`);
          return;
        }
        if (!cb.share_decimal || parseFloat(cb.share_decimal) <= 0) {
          alert(`যৌথ ক্রেতা ${i + 2}-এর জমির পরিমাণ (শতক) সঠিকভাবে প্রদান করুন!`);
          return;
        }
      }

      const primaryShare = parseFloat(deedForm.primary_share || deedForm.sold_area || 0);
      if (primaryShare <= 0) {
        alert('মূল ক্রেতার জমির পরিমাণ (শতক) প্রদান করুন!');
        return;
      }

      buyersPayload = [
        {
          nid: deedForm.buyer_nid,
          name: deedForm.buyer_name,
          phone: deedForm.buyer_phone,
          email: deedForm.buyer_email,
          share_decimal: primaryShare
        },
        ...coBuyers.map(cb => ({
          nid: cb.nid,
          name: cb.name,
          phone: cb.phone,
          email: cb.email,
          share_decimal: parseFloat(cb.share_decimal)
        }))
      ];

      calculatedSoldArea = buyersPayload.reduce((sum, b) => sum + b.share_decimal, 0);
    }

    setGrantLoading(true);
    try {
      const finalSoldArea = calculatedSoldArea || deedForm.sold_area || searchForm.requested_area || landRecord.available_area_decimal;
      const res = await axios.post('/api/grant-deed', {
        record_id: landRecord._id,
        ...deedForm,
        sold_area: finalSoldArea,
        buyers: buyersPayload.length > 0 ? buyersPayload : undefined,
        otp: deedOtp.trim()
      });

      setGrantResult(res.data);
      if (res.data.record) {
        setLandRecord(prev => ({
          ...prev,
          available_area_decimal: Math.max(0, (prev.available_area_decimal || prev.total_area_decimal) - (res.data.record.sold_area || finalSoldArea)),
          status: 'Active',
          last_deed_no: res.data.record.deed_no
        }));
      }
    } catch (err) {
      setGrantResult({
        success: false,
        message: err.response?.data?.message || 'দলিল অনুমোদন ব্যর্থ হয়েছে।'
      });
    } finally {
      setGrantLoading(false);
    }
  };

  // Step 4: Download PDF
  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#0b1329' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`e-Namjari-Application-${grantResult?.record?.deed_no || deedForm.deed_no}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF ডাউনলোড ব্যর্থ হয়েছে।');
    }
  };

  const steps = [
    { num: 1, title: 'জমি সার্চ', desc: 'মালিকানা ও অ্যান্টি-ডাবল সেলিং চেক' },
    { num: 2, title: 'ক্রেতার তথ্য', desc: 'ক্রেতার এনআইডি ও দলিলের বিবরণ' },
    { num: 3, title: 'Grant Deed', desc: 'SHA-256 হ্যাশ ও এসি ল্যান্ডে প্রেরণ' },
    { num: 4, title: 'PDF ডাউনলোড', desc: 'ই-নামজারি আবেদনপত্র প্রিন্ট' }
  ];

  const currentStep = grantResult?.success ? 4 : landRecord ? 2 : 1;

  return (
    <div style={{ color: '#0f172a' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderLeft: '5px solid #2563eb',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}>
              <Building2 size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং প্যানেল
                </h2>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #86efac',
                  fontWeight: '700'
                }}>
                  🛡️ Anti-Double Selling Active
                </span>
              </div>
              <p style={{ color: '#334155', fontSize: '13px', margin: '4px 0 0 0' }}>
                সাব-রেজিস্ট্রি কর্মকর্তা কর্তৃক দলিল সম্পাদন ➔ স্বয়ংক্রিয় লক ➔ এসি ল্যান্ড অফিসে নামজারি অনুমোদন প্রেরণ
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#1e40af',
            background: '#eff6ff',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1.5px solid #bfdbfe',
            fontWeight: '600'
          }}>
            🏛️ সাব-রেজিস্ট্রি কোড: <strong style={{ color: '#1d4ed8' }}>SR-BOG-SHIB-01</strong>
          </div>
        </div>
      </div>

      {/* Sub-tab Switcher: New Deed Registration vs Tracking (Dedicated Separate Space) */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        background: '#ffffff',
        padding: '8px 12px',
        borderRadius: '12px',
        border: '1.5px solid #cbd5e1',
        width: 'fit-content',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <button
          type="button"
          onClick={() => setPanelTab('register')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            background: panelTab === 'register' ? '#2563eb' : '#f1f5f9',
            color: panelTab === 'register' ? '#ffffff' : '#334155'
          }}
        >
          <FileText size={15} />
          <span>নতুন সাফ-কবলা দলিল সম্পাদন</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelTab('tracking');
            fetchPendingMutations();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            background: panelTab === 'tracking' ? '#2563eb' : '#f1f5f9',
            color: panelTab === 'tracking' ? '#ffffff' : '#334155'
          }}
        >
          <Clock size={15} />
          <span>প্রেরিত সাফ-কবলা দলিলের স্থিতি ও ট্র্যাকিং ({pendingMutations.length}টি)</span>
        </button>
      </div>

      {panelTab === 'register' && (
      <div>
        {/* 4 Step Process Tracker Banner Box */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
        }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {steps.map((st) => {
            const isCompleted = currentStep > st.num || (st.num === 4 && grantResult?.success);
            const isCurrent = currentStep === st.num && !(st.num === 4 && grantResult?.success);
            return (
              <div
                key={st.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${isCurrent ? '#2563eb' : isCompleted ? '#86efac' : '#cbd5e1'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800',
                  background: isCurrent ? '#2563eb' : isCompleted ? '#16a34a' : '#94a3b8',
                  color: 'white'
                }}>
                  {isCompleted ? <Check size={14} /> : st.num}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isCurrent ? '#1e40af' : isCompleted ? '#166534' : '#1e293b' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '10px', color: isCurrent ? '#1d4ed8' : isCompleted ? '#15803d' : '#64748b' }}>
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Steps (1, 2, 3) | Right Step 4 & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.25fr) minmax(340px, 1fr)', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: Land Search & Anti-Double Selling Check */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                <Search size={18} color="#2563eb" />
                ১. জমি সার্চ ও অ্যান্টি-ডাবল সেলিং চেক
              </h3>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>ধাপ ১ / ৪</span>
            </div>


            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  বিক্রেতার জাতীয় পরিচয়পত্র (NID) নম্বর <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="যেমন: 1998567890123"
                  value={searchForm.seller_nid}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, seller_nid: e.target.value }))}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              {/* ১. বিভাগ (Division) */}
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
                  {divisionsList.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              {/* ২. জেলা (District) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  ২. জেলা (District) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedDistId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                  disabled={loadingLocations || !selectedDivId || districtsList.length === 0}
                >
                  <option value="">{selectedDivId ? '-- জেলা নির্বাচন করুন --' : '-- প্রথমে বিভাগ নির্বাচন করুন --'}</option>
                  {districtsList.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              {/* ৩. উপজেলা (Upazila) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  ৩. উপজেলা (Upazila) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedUpzId}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                  disabled={loadingLocations || !selectedDistId || upazilasList.length === 0}
                >
                  <option value="">{selectedDistId ? '-- উপজেলা নির্বাচন করুন --' : '-- প্রথমে জেলা নির্বাচন করুন --'}</option>
                  {upazilasList.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>

              {/* ৪. মৌজা (Mouza) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  ৪. মৌজা (Mouza) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedMouzaId}
                  onChange={(e) => handleMouzaChange(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                  disabled={loadingLocations || !selectedUpzId || mouzasList.length === 0}
                >
                  <option value="">{selectedUpzId ? '-- মৌজা নির্বাচন করুন --' : '-- প্রথমে উপজেলা নির্বাচন করুন --'}</option>
                  {mouzasList.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} {m.jl_no ? `(জে.এল ${m.jl_no})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ৫. খতিয়ান নং (Khatian No) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  ৫. খতিয়ান নম্বর (Khatian No) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedKhatianId}
                  onChange={(e) => handleKhatianChange(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
                  disabled={loadingLocations || !selectedMouzaId || khatiansList.length === 0}
                >
                  <option value="">{selectedMouzaId ? '-- খতিয়ান নম্বর নির্বাচন করুন --' : '-- প্রথমে মৌজা নির্বাচন করুন --'}</option>
                  {khatiansList.map(k => (
                    <option key={k._id} value={k._id}>
                      {k.khatian_no} {k.khatian_type ? `(${k.khatian_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ৬. দাগ নম্বর (Plot No) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                  ৬. দাগ নম্বর (Plot No) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedDagId}
                  onChange={(e) => handleDagChange(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', height: '42px', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}
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

              <div style={{
                gridColumn: 'span 2',
                background: '#eff6ff',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
                fontSize: '11px',
                color: '#1e40af',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>📌 জমি অনুসন্ধান ও শনাক্তকরণের স্ট্যান্ডার্ড: <strong>বিভাগ ➔ জেলা ➔ উপজেলা ➔ মৌজা ➔ খতিয়ান ➔ দাগ নম্বর</strong></span>
                <button
                  type="button"
                  onClick={loadInitialHierarchy}
                  disabled={loadingLocations}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="অ্যাডমিন প্যানেলের নতুন তথ্য রিফ্রেশ করুন"
                >
                  <RefreshCw size={12} className={loadingLocations ? 'animate-spin' : ''} />
                  রিফ্রেশ
                </button>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    color: '#ffffff'
                  }}
                >
                  {searchLoading ? 'যাচাই করা হচ্ছে...' : '🔍 জমি খুঁজুন ও অ্যান্টি-ডাবল সেলিং চেক করুন'}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {searchError && (
              <div style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '12px',
                marginTop: '10px',
                fontWeight: '600'
              }}>
                ⚠️ {searchError}
              </div>
            )}

            {/* Anti-Double Selling Alert Box */}
            {doubleSellAlert && (
              <div style={{
                marginTop: '14px',
                padding: '16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '2px solid #ef4444',
                color: '#991b1b',
                fontSize: '13px',
                lineHeight: 1.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#b91c1c', marginBottom: '6px' }}>
                  <ShieldAlert size={18} />
                  {doubleSellAlert.alert_type === 'DOUBLE_SELL' ? '🚨 ডাবল-সেলিং সতর্কতা (Double-Selling Alert)' :
                   doubleSellAlert.alert_type === 'COURT_CASE_STAY_ORDER' ? '⛔ আদালতীয় মামলা ও স্থগিতাদেশ সতর্কতা (Court Case / Stay Order Alert)' :
                   doubleSellAlert.alert_type === 'FAKE_OWNER' ? '🚨 জালিয়াতি সতর্কতা (Fake Owner Detected)' :
                   doubleSellAlert.alert_type === 'UNASSIGNED_LAND' ? '⚠️ সরকারি খাস জমি সতর্কতা (Unassigned Land)' :
                   doubleSellAlert.alert_type === 'ALREADY_SOLD' ? '🚫 পূর্বেই বিক্রিত জমি (Already Sold)' :
                   doubleSellAlert.alert_type === 'DECEASED_LOCKED' ? '🔒 লককৃত জমি সতর্কতা (মালিকের মৃত্যুজনিত কারণে স্থগিত)' :
                   doubleSellAlert.alert_type === 'DECEASED_TRANSFERRED' ? '📜 ওয়ারিশদের বণ্টনকৃত জমি (Transferred To Heirs)' :
                   doubleSellAlert.alert_type === 'NOT_FOUND' ? '🔍 রেকর্ড পাওয়া যায়নি (Record Not Found)' :
                   '⚠️ ভূমি রেকর্ড যাচাইকরণ সতর্কতা'}
                </div>
                <div style={{ fontWeight: '500' }}>{doubleSellAlert.message}</div>
              </div>
            )}

            {/* Verified Land Record Preview */}
            {landRecord && !doubleSellAlert && (
              <div style={{
                marginTop: '14px',
                padding: '18px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#16a34a" />
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#166534' }}>
                      জমির তথ্য ও বৈধতা যাচাইকৃত
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: landRecord.status === 'Active' ? '#dcfce7' : '#fef3c7',
                    color: landRecord.status === 'Active' ? '#166534' : '#92400e',
                    fontWeight: '700',
                    border: `1px solid ${landRecord.status === 'Active' ? '#86efac' : '#fde68a'}`
                  }}>
                    স্ট্যাটাস: {landRecord.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মৌজা: <strong style={{ color: '#0f172a' }}>{landRecord.mouza}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>দাগ নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.dag_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>খতিয়ান নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.khatian_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>জে.এল নম্বর: <strong style={{ color: '#0f172a' }}>{landRecord.jl_no}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>বর্তমান মালিক: <strong style={{ color: '#1d4ed8' }}>{landRecord.owner_name}</strong></div>
                  <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>মালিকের NID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{landRecord.owner_nid}</strong></div>
                  <div style={{ gridColumn: 'span 2', background: '#dcfce7', padding: '10px 14px', borderRadius: '8px', color: '#166534', border: '1px solid #86efac' }}>
                    মোট বিক্রয়যোগ্য পরিমাণ: <strong style={{ fontSize: '15px', color: '#15803d' }}>{landRecord.available_area_decimal || landRecord.total_area_decimal} শতক</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Buyer Details & Deed Preparation */}
          {landRecord && !doubleSellAlert && (
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#2563eb" />
                  ২. ক্রেতার তথ্য ও দলিলের বিবরণ
                </h3>
                <span style={{ fontSize: '11px', color: '#1e40af', background: '#dbeafe', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>ধাপ ২ / ৪</span>
              </div>

              {/* Buyer NID Verification Box */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '6px', fontWeight: '800' }}>
                  ক্রেতার জাতীয় পরিচয়পত্র (NID) যাচাই <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ক্রেতার ১৩/১৭ বা ১০ ডিজিটের NID লিখুন"
                    value={deedForm.buyer_nid}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeedForm(prev => ({ ...prev, buyer_nid: val }));
                      setBuyerVerified(false);
                      setBuyerVerifyMsg(null);
                      setBuyerVerifyError(null);
                    }}
                    style={{ flex: 1, fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyBuyer()}
                    disabled={buyerVerifying || !deedForm.buyer_nid?.trim()}
                    className="btn-primary"
                    style={{
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {buyerVerifying ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                    {buyerVerifying ? 'যাচাই হচ্ছে...' : 'ক্রেতা যাচাই করুন'}
                  </button>
                </div>

                {buyerVerifyMsg && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>{buyerVerifyMsg}</span>
                  </div>
                )}

                {buyerVerifyError && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserX size={16} color="#dc2626" />
                    <span>{buyerVerifyError}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    দলিল নম্বর <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="যেমন: DEED-2026-101"
                    value={deedForm.deed_no}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_no: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    নিবন্ধনের সাল
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={deedForm.deed_year}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, deed_year: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার নাম (স্বয়ংক্রিয় তথ্য) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="ক্রেতা যাচাইয়ের পর নাম প্রদর্শিত হবে"
                    value={deedForm.buyer_name}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_name: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: buyerVerified ? '#f0fdf4' : '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="যেমন: ০১৭১১xxxxxx"
                    value={deedForm.buyer_phone}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_phone: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    ক্রেতার ইমেইল (পেমেন্ট নোটিফিকেশনের জন্য) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="ক্রেতার ইমেইল এড্রেস"
                    value={deedForm.buyer_email}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, buyer_email: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: buyerVerified ? '#f0fdf4' : '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginBottom: '4px', fontWeight: '700' }}>
                    বিক্রীত জমির পরিমাণ (শতক)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={deedForm.sold_area}
                    onChange={(e) => setDeedForm(prev => ({ ...prev, sold_area: e.target.value }))}
                    style={{ width: '100%', fontSize: '13px', color: '#0f172a', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>
              </div>

              {/* Joint Deed Co-Buyers Section */}
              <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: coBuyers.length > 0 ? '12px' : '0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={16} color="#2563eb" /> যৌথ ক্রেতা / অংশীদার ব্যবস্থাপনা
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      একই দলিলে একাধিক ক্রেতা থাকলে নিচের বাটনে ক্লিক করে যুক্ত করুন
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCoBuyer}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} /> যৌথ ক্রেতা যোগ করুন
                  </button>
                </div>

                {coBuyers.length > 0 && (
                  <div>
                    <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '12px', color: '#166534', border: '1px solid #bbf7d0' }}>
                      💡 <strong>যৌথ দলিল সক্রিয়:</strong> মূল ক্রেতা সহ মোট {coBuyers.length + 1} জন ক্রেতা। প্রত্যেকের নামের পাশে তাদের নির্দিষ্ট হিস্যা/শতক উল্লেখ করুন।
                    </div>
                    <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                        ১. মূল ক্রেতা ({deedForm.buyer_name || 'যাচাইকৃত'})-এর অংশ:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="শতক"
                          value={deedForm.primary_share || ''}
                          onChange={(e) => setDeedForm(prev => ({ ...prev, primary_share: e.target.value }))}
                          style={{ width: '100px', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>শতক</span>
                      </div>
                    </div>

                    {coBuyers.map((cb, idx) => (
                      <div key={cb.id} style={{ marginBottom: '12px', padding: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#1d4ed8' }}>
                            👤 যৌথ ক্রেতা {idx + 2}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCoBuyer(idx)}
                            style={{ padding: '3px 8px', fontSize: '11px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Trash2 size={12} /> মুছুন
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '2px' }}>NID নম্বর *</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="text"
                                placeholder="১০/১৩/১৭ ডিজিট NID"
                                value={cb.nid}
                                onChange={(e) => updateCoBuyer(idx, 'nid', e.target.value)}
                                style={{ flex: 1, padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyCoBuyer(idx)}
                                disabled={cb.verifying}
                                style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                {cb.verifying ? '...' : 'যাচাই'}
                              </button>
                            </div>
                            {cb.verifyMsg && <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '2px', fontWeight: '600' }}>{cb.verifyMsg}</div>}
                            {cb.verifyError && <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>{cb.verifyError}</div>}
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '2px' }}>নাম *</label>
                            <input
                              type="text"
                              placeholder="যাচাইয়ের পর আসবে"
                              value={cb.name}
                              onChange={(e) => updateCoBuyer(idx, 'name', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: cb.verified ? '#f0fdf4' : '#ffffff' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '2px' }}>ফোন</label>
                            <input
                              type="text"
                              placeholder="০১৭১১xxxxxx"
                              value={cb.phone}
                              onChange={(e) => updateCoBuyer(idx, 'phone', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '2px' }}>হিস্যা / অংশ (শতক) *</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="যেমন: ১৫"
                              value={cb.share_decimal}
                              onChange={(e) => updateCoBuyer(idx, 'share_decimal', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MANDATORY OTP VERIFICATION FOR DEED REGISTRATION */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderLeft: '5px solid #2563eb',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="#2563eb" />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      দলিল নিবন্ধন ওটিপি (OTP) ভেরিফিকেশন <span style={{ color: '#dc2626' }}>*বাধ্যতামূলক</span>
                    </h4>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#dbeafe', color: '#1e40af', fontWeight: '700', border: '1px solid #bfdbfe' }}>
                    🔒 Security Gate
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px 0' }}>
                  সাব-রেজিস্ট্রি অফিসে সকল ধরনের দলিল নিবন্ধনের ক্ষেত্রে ওটিপি ভেরিফিকেশন বাধ্যতামূলক। জমির বর্তমান মালিক/বিক্রেতার ইমেইলে কোড পাঠাতে নিচের বাটনে ক্লিক করুন।
                </p>

                {/* Recipient Selection (Seller/Owner Only) */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', color: '#0f172a' }}>
                    <input
                      type="radio"
                      name="otpTarget"
                      value="seller"
                      checked={otpTarget === 'seller'}
                      onChange={() => setOtpTarget('seller')}
                    />
                    মালিক/বিক্রেতার ইমেইলে পাঠান ({landRecord.owner_name})
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="৬ ডিজিটের ওটিপি কোড লিখুন *"
                      value={deedOtp}
                      onChange={(e) => setDeedOtp(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        border: '1.5px solid #94a3b8',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendDeedOtp}
                    disabled={sendingDeedOtp}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: sendingDeedOtp ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Send size={14} />
                    {sendingDeedOtp ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান (Send OTP)'}
                  </button>
                </div>

                {deedOtpSentMsg && (
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '700' }}>
                    ✅ {deedOtpSentMsg}
                  </div>
                )}
                {deedOtpError && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', fontWeight: '700' }}>
                    ⚠️ {deedOtpError}
                  </div>
                )}
              </div>

              {/* FINGERPRINT VERIFICATION OPTION (DISPLAY ONLY / FUTURE READINESS) */}
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderLeft: '5px solid #059669',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Fingerprint size={20} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#065f46' }}>
                      বায়োমেট্রিক ফিঙ্গারপ্রিন্ট ভেরিফিকেশন (প্রস্তুতিমূলক অপশন)
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: '700', border: '1px solid #86efac' }}>
                    Display Only (ভবিষ্যত বাস্তবায়ন প্রস্তুতি)
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                  ভবিষ্যতে সাব-রেজিস্ট্রি অফিসে সকল ধরনের দলিল নিবন্ধনের সময় জাতীয় পরিচয়পত্র ডেটাবেজের সাথে সরাসরি বায়োমেট্রিক ফিঙ্গারপ্রিন্ট ম্যাচিং চালুর প্রস্তুতিমূলক ইন্টারফেস।
                </p>

                <div style={{
                  background: '#ffffff',
                  border: '1px dashed #059669',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: fpVerified ? '#dcfce7' : fpScanning ? '#fef3c7' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #cbd5e1'
                    }}>
                      <Fingerprint size={24} color={fpVerified ? '#16a34a' : fpScanning ? '#d97706' : '#64748b'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                        {fpVerified ? 'বায়োমেট্রিক স্ক্যান সম্পন্ন (UI Display)' : fpScanning ? 'স্ক্যানিং চলছে...' : 'ডিভাইস সেন্সর: স্ট্যান্ডবাই (UI Mode)'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        অপটিক্যাল/ক্যাপাসিটিভ ফিঙ্গারপ্রিন্ট সেন্সর প্রস্তুত
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateFingerprint}
                    disabled={fpScanning}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: fpVerified ? '#16a34a' : '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Fingerprint size={14} />
                    {fpScanning ? 'স্ক্যান হচ্ছে...' : fpVerified ? 'পুনরায় টেস্ট করুন' : 'ফিঙ্গারপ্রিন্ট টেস্ট (UI Simulation)'}
                  </button>
                </div>

                {fpMessage && (
                  <div style={{ fontSize: '11px', color: fpVerified ? '#166534' : '#b45309', marginTop: '6px', fontWeight: '700' }}>
                    {fpMessage}
                  </div>
                )}
              </div>

              {/* STEP 3 BUTTON: Grant Deed */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleGrantDeed}
                  disabled={grantLoading || landRecord.status !== 'Active' || !buyerVerified}
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
                    background: buyerVerified ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#94a3b8',
                    cursor: buyerVerified ? 'pointer' : 'not-allowed',
                    color: '#ffffff',
                    boxShadow: buyerVerified ? '0 4px 16px rgba(22, 163, 74, 0.35)' : 'none'
                  }}
                >
                  <CheckCircle size={18} />
                  {grantLoading ? 'দলিল সম্পাদন হচ্ছে...' : '৩. Grant Deed অনুমোদন করুন ➔ এসি ল্যান্ডে পাঠান'}
                </button>
                <div style={{ fontSize: '11px', color: buyerVerified ? '#475569' : '#dc2626', textAlign: 'center', marginTop: '8px', fontWeight: '600' }}>
                  {buyerVerified 
                    ? '🔒 Grant Deed করার সাথে সাথে SHA-256 হ্যাশ তৈরি হবে এবং ক্রেতার ইমেইলে নোটিফিকেশন যাবে।'
                    : '⚠️ দলিল সম্পন্ন করতে প্রথমে ওপরের "ক্রেতা যাচাই করুন" বাটনে ক্লিক করে ক্রেতার NID যাচাই করুন।'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Grant Result & PDF Preview */}
        <div>
          {!grantResult && (
            <div className="glass-card" style={{
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              border: '2px dashed #94a3b8'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FileText size={36} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                ই-নামজারি আবেদন ফর্ম প্রিভিউ
              </h4>
              <p style={{ color: '#475569', fontSize: '13px', maxWidth: '320px', lineHeight: 1.6, fontWeight: '500' }}>
                বাম পাশের প্যানেলে জমি সার্চ করে ক্রেতার তথ্য প্রদান করে <strong>Grant Deed</strong> সম্পন্ন করলে এখানে লাইভ আবেদনপত্র এবং কিউআর কোড দৃশ্যমান হবে।
              </p>
            </div>
          )}

          {grantResult && (
            <div>
              {/* Grant Result Banner */}
              <div style={{
                padding: '16px 20px',
                background: grantResult.success ? '#dcfce7' : '#fef2f2',
                border: `1.5px solid ${grantResult.success ? '#86efac' : '#f87171'}`,
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle size={24} color={grantResult.success ? '#16a34a' : '#dc2626'} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: grantResult.success ? '#166534' : '#991b1b' }}>
                    {grantResult.success ? 'আবেদন পাঠানো সম্পন্ন হলো ।' : (grantResult.message || 'দলিল অনুমোদন ব্যর্থ হয়েছে।')}
                  </div>
                  <div style={{ fontSize: '12px', color: grantResult.success ? '#15803d' : '#b91c1c', marginTop: '2px', fontWeight: '600' }}>
                    দলিল সম্পাদন সম্পন্ন · জমি Pending_Mutation লক · এসি ল্যান্ড কার্যালয়ে আবেদন সফলভাবে পৌঁছেছে
                  </div>
                </div>
              </div>

              {/* SHA-256 Hash Card */}
              {grantResult.deed_hash && (
                <div style={{
                  padding: '12px 16px',
                  background: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <Hash size={13} color="#2563eb" /> ক্রিপ্টোগ্রাফিক SHA-256 দলিল হ্যাশ (Anti-Tamper Deed Hash)
                  </div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: '700' }}>
                    {grantResult.deed_hash}
                  </div>
                </div>
              )}

              {/* Printable PDF Preview Container */}
              <div
                ref={pdfRef}
                style={{
                  background: '#ffffff',
                  border: '2px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
                }}
              >
                {/* Government Header */}
                <div style={{ textAlign: 'center', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px' }}>
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '700', marginTop: '2px' }}>
                    ভূমি মন্ত্রণালয় · সাব-রেজিস্ট্রি ও রাজস্ব নেটওয়ার্ক
                  </div>
                  <div style={{ fontSize: '13px', color: '#166534', fontWeight: '800', marginTop: '4px' }}>
                    ই-নামজারি আবেদন ফর্ম (দলিল নিবন্ধন রেকর্ড)
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', fontWeight: '600' }}>
                    e-Namjari Application & Deed Grant Record
                  </div>
                </div>

                {/* Details Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px', fontSize: '12px' }}>
                  {[
                    ['দলিল নম্বর', grantResult.record?.deed_no || deedForm.deed_no],
                    ['নিবন্ধনের সাল', grantResult.record?.deed_year || deedForm.deed_year],
                    ['সাব-রেজিস্ট্রি কোড', deedForm.sub_registry_code],
                    ['তারিখ', new Date().toLocaleDateString('bn-BD')],
                    ['মৌজা', landRecord.mouza],
                    ['দাগ নম্বর', landRecord.dag_no],
                    ['খতিয়ান নম্বর', landRecord.khatian_no],
                    ['বিক্রীত জমি', `${deedForm.sold_area} শতক`],
                    ['বিক্রেতার নাম', landRecord.owner_name],
                    ['বিক্রেতার NID', landRecord.owner_nid],
                    ['ক্রেতার নাম', deedForm.buyer_name],
                    ['ক্রেতার NID', deedForm.buyer_nid],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>{k}</div>
                      <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* QR Code & Digital Verification */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px',
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1'
                }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/#/qr-verify/${grantResult.qr_code_id || 'QR-' + deedForm.deed_no}`}
                    size={80}
                    fgColor="#0f172a"
                    bgColor="transparent"
                    level="H"
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>
                      QR কোড আইডি: {grantResult.qr_code_id || 'QR-' + deedForm.deed_no}
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px', lineHeight: 1.5, fontWeight: '500' }}>
                      এই QR কোড স্ক্যান করে লাইভ দলিলের বৈধতা ও এসি ল্যান্ডের স্ট্যাটাস যাচাই করা যাবে।
                    </div>
                    <div style={{ fontSize: '9px', color: '#334155', marginTop: '4px', fontFamily: 'monospace', fontWeight: '600' }}>
                      ডিজিটাল স্বাক্ষর: {grantResult.deed_hash?.substring(0, 24)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 4 BUTTON: Download PDF */}
              <button
                type="button"
                onClick={downloadPDF}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff'
                }}
              >
                <Download size={16} /> ৪. ই-নামজারি ফর্ম PDF ডাউনলোড করুন
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Dedicated Tracking Space for Sent Sale Mutation Deeds */}
      {panelTab === 'tracking' && (
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" />
              প্রেরিত সাফ-কবলা দলিলের স্থিতি ও নামজারি ট্র্যাকিং ({pendingMutations.length}টি)
            </h3>
            <button
              onClick={fetchPendingMutations}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loadingMutations ? 'animate-spin' : ''} />
              রিফ্রেশ
            </button>
          </div>

          {loadingMutations ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>তথ্য লোড হচ্ছে...</div>
          ) : pendingMutations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
              বর্তমানে পর্যালোচনায় অপেক্ষমান কোনো সাফ-কবলা দলিল নেই।
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#0f172a', background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px' }}>দলিল নং</th>
                    <th style={{ padding: '10px 12px' }}>বিক্রেতার তথ্য</th>
                    <th style={{ padding: '10px 12px' }}>ক্রেতার তথ্য</th>
                    <th style={{ padding: '10px 12px' }}>জমির বিবরণ</th>
                    <th style={{ padding: '10px 12px' }}>পরিমাণ (শতক)</th>
                    <th style={{ padding: '10px 12px' }}>বর্তমান স্থিতি</th>
                    <th style={{ padding: '10px 12px' }}>সম্পাদনের তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMutations.map((item) => {
                    const primaryBuyer = Array.isArray(item.buyers) && item.buyers.length > 0 ? item.buyers[0] : null;
                    const buyerName = primaryBuyer ? primaryBuyer.name : (item.buyer_name || 'N/A');
                    const buyerNid = primaryBuyer ? primaryBuyer.nid : (item.buyer_nid || '');

                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#1d4ed8', fontWeight: '800' }}>
                          {item.deed_no || item.record_id}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f172a' }}>{item.owner_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {item.owner_nid}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#0f172a' }}>{buyerName}</strong>
                          {buyerNid && <div style={{ fontSize: '11px', color: '#64748b' }}>NID: {buyerNid}</div>}
                          {Array.isArray(item.buyers) && item.buyers.length > 1 && (
                            <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700' }}>
                              +{item.buyers.length - 1} জন যৌথ ক্রেতা
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#0f172a' }}>দাগ: <strong>{item.dag_no}</strong> | খতিয়ান: {item.khatian_no}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>মৌজা: {item.mouza}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#15803d' }}>
                          {item.sold_area_decimal || item.available_area_decimal || item.total_area_decimal} শতক
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={12} color="#d97706" />
                            <span>এসি ল্যান্ডে নামজারি অপেক্ষমান</span>
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
