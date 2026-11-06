import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Search, UserCheck, Send, CheckCircle, Clock, AlertTriangle, FileText, Layers, Hash, MapPin, Sparkles, RefreshCw, Bell, Plus } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import P4RegistryPanel from './P4RegistryPanel';
import BontonNamaRegistrySection from '../components/BontonNamaRegistrySection';
import DynamicLocationManager from '../components/DynamicLocationManager';
import HebaGiftDeedPanel from '../components/OtherDeeds/HebaGiftDeedPanel';
import ExchangeDeedPanel from '../components/OtherDeeds/ExchangeDeedPanel';
import MortgageDeedPanel from '../components/OtherDeeds/MortgageDeedPanel';
import BaynaDeedPanel from '../components/OtherDeeds/BaynaDeedPanel';


export default function RegisterOfficeDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'assign');
  const [selectedOtherDeedSub, setSelectedOtherDeedSub] = useState('heba');

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  };

  // Dynamic Location Lists (exclusively from Admin Panel /api/locations/*)
  const [divisionsList, setDivisionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [upazilasList, setUpazilasList] = useState([]);
  const [mouzasList, setMouzasList] = useState([]);
  const [khatiansList, setKhatiansList] = useState([]);
  const [dagsList, setDagsList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Selected Location IDs (for cascading dropdown selection)
  const [selectedDivId, setSelectedDivId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');
  const [selectedUpzId, setSelectedUpzId] = useState('');
  const [selectedMouzaId, setSelectedMouzaId] = useState('');
  const [selectedKhatianId, setSelectedKhatianId] = useState('');
  const [selectedDagId, setSelectedDagId] = useState('');

  // Cascade Filter State (Matches selected location names/numbers)
  const [filter, setFilter] = useState({
    division: '',
    district: '',
    upazila: '',
    mouza: '',
    jl_no: '',
    khatian_no: '',
    dag_no: ''
  });

  // ── Cascading Fetch Functions (Admin-created dynamic hierarchy) ──
  const fetchDagsForKhatian = async (khatianId, khatianNo, currentFilter) => {
    try {
      const res = await axios.get(`/api/locations/dags?khatian_id=${khatianId}`);
      const dags = res.data?.data || [];
      setDagsList(dags);
      if (dags.length > 0) {
        const firstDag = dags[0];
        setSelectedDagId(firstDag._id);
        const updatedFilter = {
          ...currentFilter,
          khatian_no: khatianNo,
          dag_no: firstDag.dag_no
        };
        setFilter(updatedFilter);
        handleSearchLandWithParams(updatedFilter);
      } else {
        setSelectedDagId('');
        const updatedFilter = {
          ...currentFilter,
          khatian_no: khatianNo,
          dag_no: ''
        };
        setFilter(updatedFilter);
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Error fetching dags:', err);
      setDagsList([]);
      setSelectedDagId('');
      setSelectedLand(null);
    }
  };

  const fetchKhatiansForMouza = async (mouzaId, mouzaName, jlNo, currentFilter) => {
    try {
      const res = await axios.get(`/api/locations/khatians?mouza_id=${mouzaId}`);
      const khatians = res.data?.data || [];
      setKhatiansList(khatians);
      if (khatians.length > 0) {
        const firstKh = khatians[0];
        setSelectedKhatianId(firstKh._id);
        const updatedFilter = {
          ...currentFilter,
          mouza: mouzaName,
          jl_no: jlNo || '',
          khatian_no: firstKh.khatian_no
        };
        setFilter(updatedFilter);
        await fetchDagsForKhatian(firstKh._id, firstKh.khatian_no, updatedFilter);
      } else {
        setSelectedKhatianId('');
        setDagsList([]);
        setSelectedDagId('');
        const updatedFilter = {
          ...currentFilter,
          mouza: mouzaName,
          jl_no: jlNo || '',
          khatian_no: '',
          dag_no: ''
        };
        setFilter(updatedFilter);
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Error fetching khatians:', err);
      setKhatiansList([]);
      setSelectedKhatianId('');
      setDagsList([]);
      setSelectedDagId('');
      setSelectedLand(null);
    }
  };

  const fetchMouzasForUpazila = async (upzId, upzName, currentFilter) => {
    try {
      const res = await axios.get(`/api/locations/mouzas?upazila_id=${upzId}`);
      const mouzas = res.data?.data || [];
      setMouzasList(mouzas);
      if (mouzas.length > 0) {
        const firstMouza = mouzas[0];
        setSelectedMouzaId(firstMouza._id);
        const updatedFilter = {
          ...currentFilter,
          upazila: upzName,
          mouza: firstMouza.name,
          jl_no: firstMouza.jl_no || ''
        };
        setFilter(updatedFilter);
        await fetchKhatiansForMouza(firstMouza._id, firstMouza.name, firstMouza.jl_no, updatedFilter);
      } else {
        setSelectedMouzaId('');
        setKhatiansList([]);
        setSelectedKhatianId('');
        setDagsList([]);
        setSelectedDagId('');
        const updatedFilter = {
          ...currentFilter,
          upazila: upzName,
          mouza: '',
          jl_no: '',
          khatian_no: '',
          dag_no: ''
        };
        setFilter(updatedFilter);
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Error fetching mouzas:', err);
      setMouzasList([]);
      setSelectedMouzaId('');
      setKhatiansList([]);
      setSelectedKhatianId('');
      setDagsList([]);
      setSelectedDagId('');
      setSelectedLand(null);
    }
  };

  const fetchUpazilasForDistrict = async (distId, distName, currentFilter) => {
    try {
      const res = await axios.get(`/api/locations/upazilas?district_id=${distId}`);
      const upazilas = res.data?.data || [];
      setUpazilasList(upazilas);
      if (upazilas.length > 0) {
        const firstUpz = upazilas[0];
        setSelectedUpzId(firstUpz._id);
        const updatedFilter = {
          ...currentFilter,
          district: distName,
          upazila: firstUpz.name
        };
        setFilter(updatedFilter);
        await fetchMouzasForUpazila(firstUpz._id, firstUpz.name, updatedFilter);
      } else {
        setSelectedUpzId('');
        setMouzasList([]);
        setSelectedMouzaId('');
        setKhatiansList([]);
        setSelectedKhatianId('');
        setDagsList([]);
        setSelectedDagId('');
        const updatedFilter = {
          ...currentFilter,
          district: distName,
          upazila: '',
          mouza: '',
          jl_no: '',
          khatian_no: '',
          dag_no: ''
        };
        setFilter(updatedFilter);
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Error fetching upazilas:', err);
      setUpazilasList([]);
      setSelectedUpzId('');
      setMouzasList([]);
      setSelectedMouzaId('');
      setKhatiansList([]);
      setSelectedKhatianId('');
      setDagsList([]);
      setSelectedDagId('');
      setSelectedLand(null);
    }
  };

  const fetchDistrictsForDivision = async (divId, divName, currentFilter) => {
    try {
      const res = await axios.get(`/api/locations/districts?division_id=${divId}`);
      const districts = res.data?.data || [];
      setDistrictsList(districts);
      if (districts.length > 0) {
        const firstDist = districts[0];
        setSelectedDistId(firstDist._id);
        const updatedFilter = {
          ...currentFilter,
          division: divName,
          district: firstDist.name
        };
        setFilter(updatedFilter);
        await fetchUpazilasForDistrict(firstDist._id, firstDist.name, updatedFilter);
      } else {
        setSelectedDistId('');
        setUpazilasList([]);
        setSelectedUpzId('');
        setMouzasList([]);
        setSelectedMouzaId('');
        setKhatiansList([]);
        setSelectedKhatianId('');
        setDagsList([]);
        setSelectedDagId('');
        const updatedFilter = {
          ...currentFilter,
          division: divName,
          district: '',
          upazila: '',
          mouza: '',
          jl_no: '',
          khatian_no: '',
          dag_no: ''
        };
        setFilter(updatedFilter);
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
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
      setSelectedLand(null);
    }
  };

  const loadInitialHierarchy = async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get('/api/locations/divisions');
      const divisions = res.data?.data || [];
      setDivisionsList(divisions);
      if (divisions.length > 0) {
        const firstDiv = divisions[0];
        setSelectedDivId(firstDiv._id);
        const initialFilter = {
          division: firstDiv.name,
          district: '',
          upazila: '',
          mouza: '',
          jl_no: '',
          khatian_no: '',
          dag_no: ''
        };
        setFilter(initialFilter);
        await fetchDistrictsForDivision(firstDiv._id, firstDiv.name, initialFilter);
      } else {
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
        setSelectedLand(null);
      }
    } catch (err) {
      console.error('Failed to load initial hierarchy:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Cascade selection change handlers
  const handleDivisionChange = async (divId) => {
    const div = divisionsList.find(d => d._id === divId);
    if (!div) return;
    setSelectedDivId(div._id);
    const updatedFilter = {
      ...filter,
      division: div.name,
      district: '',
      upazila: '',
      mouza: '',
      jl_no: '',
      khatian_no: '',
      dag_no: ''
    };
    setFilter(updatedFilter);
    await fetchDistrictsForDivision(div._id, div.name, updatedFilter);
  };

  const handleDistrictChange = async (distId) => {
    const dist = districtsList.find(d => d._id === distId);
    if (!dist) return;
    setSelectedDistId(dist._id);
    const updatedFilter = {
      ...filter,
      district: dist.name,
      upazila: '',
      mouza: '',
      jl_no: '',
      khatian_no: '',
      dag_no: ''
    };
    setFilter(updatedFilter);
    await fetchUpazilasForDistrict(dist._id, dist.name, updatedFilter);
  };

  const handleUpazilaChange = async (upzId) => {
    const upz = upazilasList.find(u => u._id === upzId);
    if (!upz) return;
    setSelectedUpzId(upz._id);
    const updatedFilter = {
      ...filter,
      upazila: upz.name,
      mouza: '',
      jl_no: '',
      khatian_no: '',
      dag_no: ''
    };
    setFilter(updatedFilter);
    await fetchMouzasForUpazila(upz._id, upz.name, updatedFilter);
  };

  const handleMouzaChange = async (mouzaId) => {
    const mouza = mouzasList.find(m => m._id === mouzaId);
    if (!mouza) return;
    setSelectedMouzaId(mouza._id);
    const updatedFilter = {
      ...filter,
      mouza: mouza.name,
      jl_no: mouza.jl_no || '',
      khatian_no: '',
      dag_no: ''
    };
    setFilter(updatedFilter);
    await fetchKhatiansForMouza(mouza._id, mouza.name, mouza.jl_no, updatedFilter);
  };

  const handleKhatianChange = async (khatianId) => {
    const kh = khatiansList.find(k => k._id === khatianId);
    if (!kh) return;
    setSelectedKhatianId(kh._id);
    const updatedFilter = {
      ...filter,
      khatian_no: kh.khatian_no,
      dag_no: ''
    };
    setFilter(updatedFilter);
    await fetchDagsForKhatian(kh._id, kh.khatian_no, updatedFilter);
  };

  const handleDagChange = (dagId) => {
    const dag = dagsList.find(d => d._id === dagId);
    if (!dag) return;
    setSelectedDagId(dag._id);
    const updatedFilter = {
      ...filter,
      dag_no: dag.dag_no
    };
    setFilter(updatedFilter);
    handleSearchLandWithParams(updatedFilter);
  };

  // Selected land, meta & partial assignment state
  const [selectedLand, setSelectedLand] = useState(null);
  const [plotMeta, setPlotMeta] = useState(null);
  const [assignArea, setAssignArea] = useState('');
  const [searchingLand, setSearchingLand] = useState(false);
  const [editingKhatian, setEditingKhatian] = useState(false);
  const [customKhatianInput, setCustomKhatianInput] = useState('');
  const [savingKhatian, setSavingKhatian] = useState(false);
  const [khatianSaveMsg, setKhatianSaveMsg] = useState(null);

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

  // Land Ownership Claim Notifications (Citizen submissions)
  const [claimNotifications, setClaimNotifications] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState(null);
  const [statusSelections, setStatusSelections] = useState({});
  const [statusUpdateMessage, setStatusUpdateMessage] = useState(null);

  // Check if land in this Dag is completely allocated (available <= 0)
  const checkIsAllocated = (land) => {
    if (!land) return false;
    const avail = plotMeta?.available_area ?? land.available_area_decimal ?? 0;
    return avail <= 0;
  };

  useEffect(() => {
    fetchSentRequests();
    fetchClaimNotifications();
    loadInitialHierarchy();
    handleSearchUser();
  }, []);

  const fetchClaimNotifications = async () => {
    setLoadingClaims(true);
    try {
      const res = await axios.get('/api/claim/all');
      if (res.data.success) {
        setClaimNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch claim notifications:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId) => {
    const targetStatus = statusSelections[claimId] || 'অপেক্ষমান';
    setUpdatingClaimId(claimId);
    setStatusUpdateMessage(null);
    try {
      const res = await axios.put(`/api/claim/status/${claimId}`, {
        status: targetStatus
      });
      if (res.data.success) {
        setStatusUpdateMessage({ claimId, text: `আবেদন স্ট্যাটাস সফলভাবে '${targetStatus}' এ পরিবর্তন করা হয়েছে।` });
        fetchClaimNotifications();
        setTimeout(() => {
          setStatusUpdateMessage(null);
        }, 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingClaimId(null);
    }
  };

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

  const handleSearchLandWithParams = async (searchFilter = null) => {
    const current = searchFilter && typeof searchFilter === 'object' && searchFilter.mouza ? searchFilter : filter;
    if (!current?.division || !current?.district || !current?.upazila || !current?.mouza || !current?.dag_no) {
      setSelectedLand(null);
      setPlotMeta(null);
      setAssignArea('');
      return;
    }
    setSearchingLand(true);
    setAssignSuccess(null);
    try {
      const res = await axios.get('/api/assign/search-land', {
        params: {
          division: current.division,
          district: current.district,
          upazila: current.upazila,
          mouza: current.mouza,
          jl_no: current.jl_no,
          dag_no: current.dag_no,
          khatian_no: current.khatian_no
        }
      });
      if (res.data.success && res.data.data?.length > 0) {
        const land = res.data.data[0];
        const meta = res.data.meta || null;
        setSelectedLand(land);
        setPlotMeta(meta);
        const avail = meta?.available_area ?? land.available_area_decimal ?? 0;
        setAssignArea(avail > 0 ? String(avail) : '');
        setCustomKhatianInput(land.khatian_no || current.khatian_no || '');
        if (land.khatian_no && land.khatian_no !== current.khatian_no) {
          setFilter(prev => ({ ...prev, khatian_no: land.khatian_no }));
        }
      } else {
        setSelectedLand(null);
        setPlotMeta(null);
        setAssignArea('');
      }
    } catch (err) {
      console.error('Land search error:', err);
      setSelectedLand(null);
      setPlotMeta(null);
      setAssignArea('');
    } finally {
      setSearchingLand(false);
    }
  };

  const handleSearchLand = () => {
    handleSearchLandWithParams(filter);
  };

  const handleSaveKhatianToDb = async () => {
    if (!selectedLand?._id) return;
    const cleanKhatian = (customKhatianInput || '').trim();
    if (!cleanKhatian) {
      alert('অনুগ্রহ করে বৈধ খতিয়ান নম্বর লিখুন।');
      return;
    }
    setSavingKhatian(true);
    setKhatianSaveMsg(null);
    try {
      const res = await axios.put('/api/assign/update-khatian', {
        land_record_id: selectedLand._id,
        khatian_no: cleanKhatian
      });
      if (res.data.success) {
        setSelectedLand(prev => ({ ...prev, khatian_no: cleanKhatian }));
        setFilter(prev => ({ ...prev, khatian_no: cleanKhatian }));
        setEditingKhatian(false);
        setKhatianSaveMsg(`✅ খতিয়ান নম্বর সফলভাবে ডাটাবেজে আপডেট হয়েছে: ${cleanKhatian}`);
        setTimeout(() => setKhatianSaveMsg(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'খতিয়ান নম্বর আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSavingKhatian(false);
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
    if (!foundUser.email) {
      alert('নাগরিকের কোনো নিবন্ধিত ইমেইল ঠিকানা নেই!');
      return;
    }
    if (!selectedLand) {
      alert('অনুগ্রহ করে জমি নির্বাচন করুন!');
      return;
    }

    const currentAvailable = plotMeta?.available_area ?? selectedLand.available_area_decimal ?? 0;
    const requestedArea = parseFloat(assignArea || currentAvailable);
    if (isNaN(requestedArea) || requestedArea <= 0) {
      alert('অনুগ্রহ করে বৈধ বরাদ্দকৃত জমির পরিমাণ (শতক) প্রদান করুন!');
      return;
    }
    if (requestedArea > currentAvailable) {
      alert(`⚠️ অপর্যাপ্ত জমি! এই দাগে অবশিষ্ট বরাদ্দযোগ্য জমি রয়েছে ${currentAvailable} শতক, কিন্তু আপনি বরাদ্দ দিতে চেয়েছেন ${requestedArea} শতক।`);
      return;
    }

    setSendingCitizenOtp(true);
    setOtpSentMessage(null);
    setOtpError(null);
    try {
      const res = await axios.post('/api/otp/send-land-assign-otp', {
        citizen_nid: foundUser.nid,
        citizen_email: foundUser.email,
        dag_no: selectedLand.dag_no,
        mouza: selectedLand.mouza,
        land_record_id: selectedLand._id,
        area_decimal: requestedArea
      });
      if (res.data.success) {
        setOtpSentMessage(res.data.message || `নাগরিকের ইমেইল (${foundUser.email}) এ ৬ ডিজিটের ওটিপি সফলভাবে পাঠানো হয়েছে।`);
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

    const currentAvailable = plotMeta?.available_area ?? selectedLand.available_area_decimal ?? 0;
    const requestedArea = parseFloat(assignArea || currentAvailable);
    if (isNaN(requestedArea) || requestedArea <= 0) {
      alert('অনুগ্রহ করে বৈধ বরাদ্দকৃত জমির পরিমাণ (শতক) প্রদান করুন!');
      return;
    }
    if (requestedArea > currentAvailable) {
      alert(`⚠️ অপর্যাপ্ত জমি! এই দাগে অবশিষ্ট জমি ${currentAvailable} শতকের চেয়ে বেশি বরাদ্দ দেওয়া সম্ভব নয়।`);
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
        assign_area: requestedArea,
        otp: citizenOtp.trim(),
        khatian_no: selectedLand.khatian_no || filter.khatian_no
      });

      if (res.data.success) {
        setAssignSuccess(res.data.message);
        setCitizenOtp('');
        setOtpSentMessage(null);
        fetchSentRequests();
        handleSearchLand(); // refresh land status and update available area
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
      id: 'bonton_nama',
      label: 'মৃত মালিকের ওয়ারিশ বণ্টননামা ও মৃত্যু সনদ',
      icon: Users,
    },
    {
      id: 'other_deeds',
      label: 'অন্যান্য হস্তান্তর/বিনিময় দলিল',
      icon: Sparkles,
    },
    {
      id: 'requests',
      label: 'প্রেরিত বরাদ্দের ট্র্যাকিং',
      icon: Clock,
      badge: sentRequests.length,
      badgeColor: '#1d4ed8',
      badgeBg: '#dbeafe'
    },
    {
      id: 'claims',
      label: 'মালিকানা দাবি বিজ্ঞপ্তি',
      icon: Bell,
      badge: claimNotifications.length > 0 ? claimNotifications.length : undefined,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7'
    },
    {
      id: 'create_land',
      label: 'নতুন জমি ও লোকেশন এন্ট্রি (দাগ/খতিয়ান তৈরি)',
      icon: Plus,
    }
  ];

  const stats = [
    { label: 'মোট প্রেরিত', value: sentRequests.length, color: '#1d4ed8' },
    { label: 'অনুমোদিত', value: sentRequests.filter(r => r.status === 'Approved').length, color: '#047857' },
    { label: 'অপেক্ষমান', value: sentRequests.filter(r => r.status === 'Pending').length, color: '#b45309' },
    { label: 'দাবি বিজ্ঞপ্তি', value: claimNotifications.length, color: '#d97706' },
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
      onTabChange={handleTabChange}
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
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <span>বিভাগ ➔ জেলা ➔ উপজেলা/সার্কেল ➔ মৌজা ➔ জেল নম্বর ➔ খতিয়ান ➔ দাগ নম্বর</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                    <button
                      type="button"
                      onClick={loadInitialHierarchy}
                      disabled={loadingLocations}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                      title="অ্যাডমিন প্যানেলের নতুন তথ্য রিফ্রেশ করুন"
                    >
                      <RefreshCw size={12} className={loadingLocations ? 'animate-spin' : ''} />
                      রিফ্রেশ
                    </button>
                  </div>
                </div>

                {divisionsList.length === 0 && !loadingLocations && (
                  <div style={{
                    padding: '12px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#991b1b',
                    marginBottom: '16px'
                  }}>
                    ⚠️ অ্যাডমিন প্যানেল থেকে কোনো লোকেশন এখনো যোগ করা হয়নি। সুপার অ্যাডমিন প্যানেল থেকে লোকেশন ও খতিয়ান/দাগ যোগ করুন।
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>১. বিভাগ (Division)</label>
                    <select
                      className="input-field"
                      value={selectedDivId}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || divisionsList.length === 0}
                    >
                      {divisionsList.length === 0 && <option value="">বিভাগ নেই</option>}
                      {divisionsList.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>২. জেলা (District)</label>
                    <select
                      className="input-field"
                      value={selectedDistId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || districtsList.length === 0}
                    >
                      {districtsList.length === 0 && <option value="">জেলা নেই</option>}
                      {districtsList.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৩. উপজেলা (Upazila)</label>
                    <select
                      className="input-field"
                      value={selectedUpzId}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || upazilasList.length === 0}
                    >
                      {upazilasList.length === 0 && <option value="">উপজেলা নেই</option>}
                      {upazilasList.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৪. মৌজা (Mouza)</label>
                    <select
                      className="input-field"
                      value={selectedMouzaId}
                      onChange={(e) => handleMouzaChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || mouzasList.length === 0}
                    >
                      {mouzasList.length === 0 && <option value="">মৌজা নেই</option>}
                      {mouzasList.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} {m.jl_no ? `(জে.এল ${m.jl_no})` : ''}
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
                      value={filter.jl_no || '-'}
                      placeholder="জে.এল নং"
                      style={{ width: '100%', fontSize: '12px', background: '#f8fafc', color: '#166534', fontWeight: '700', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৬. খতিয়ান নং</label>
                    <select
                      className="input-field"
                      value={selectedKhatianId}
                      onChange={(e) => handleKhatianChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || khatiansList.length === 0}
                    >
                      {khatiansList.length === 0 && <option value="">খতিয়ান নেই</option>}
                      {khatiansList.map(k => (
                        <option key={k._id} value={k._id}>
                          {k.khatian_no} {k.khatian_type ? `(${k.khatian_type})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>৭. দাগ নং (প্লট)</label>
                    <select
                      className="input-field"
                      value={selectedDagId}
                      onChange={(e) => handleDagChange(e.target.value)}
                      style={{ width: '100%', fontSize: '12px', color: '#0f172a', background: '#ffffff' }}
                      disabled={loadingLocations || dagsList.length === 0}
                    >
                      {dagsList.length === 0 && <option value="">দাগ নেই</option>}
                      {dagsList.map(d => (
                        <option key={d._id} value={d._id}>
                          দাগ {d.dag_no} {d.total_area_decimal ? `(${d.total_area_decimal} শতক)` : ''}
                        </option>
                      ))}
                    </select>
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
                const totalDagArea = plotMeta?.total_dag_area ?? selectedLand.total_area_decimal ?? 0;
                const availableArea = plotMeta?.available_area ?? selectedLand.available_area_decimal ?? 0;
                const assignedArea = plotMeta?.assigned_area ?? 0;
                const pendingArea = plotMeta?.pending_area ?? 0;
                const isFullyAllocated = availableArea <= 0;

                return (
                  <div className="glass-card" style={{ padding: '20px', borderLeft: `5px solid ${isFullyAllocated ? '#ef4444' : '#16a34a'}`, background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        দাগের তথ্য: দাগ নং {selectedLand.dag_no} (মৌজা: {selectedLand.mouza})
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: isFullyAllocated ? '#fee2e2' : '#dcfce7',
                        color: isFullyAllocated ? '#991b1b' : '#166534',
                        border: `1px solid ${isFullyAllocated ? '#f87171' : '#86efac'}`,
                        fontWeight: '700'
                      }}>
                        {isFullyAllocated ? '🔒 সম্পূর্ণ দাগ বরাদ্দ সম্পন্ন (অবশিষ্ট ০)' : `🟢 বরাদ্দযোগ্য (অবশিষ্ট ${availableArea} শতক)`}
                      </span>
                    </div>

                    {/* Breakdown metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>দাগের মোট জমি:</span>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>{totalDagArea} শতক</strong>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #86efac' }}>
                        <span style={{ color: '#166534', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '700' }}>অবশিষ্ট বরাদ্দযোগ্য:</span>
                        <strong style={{ color: '#15803d', fontSize: '15px', fontWeight: '800' }}>{availableArea} শতক</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>অনুমোদিত মালিকানা:</span>
                        <strong style={{ color: '#0369a1', fontSize: '14px' }}>{assignedArea} শতক</strong>
                      </div>
                      <div style={{ background: '#fffbeb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <span style={{ color: '#b45309', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>রিভিউ অপেক্ষমান:</span>
                        <strong style={{ color: '#d97706', fontSize: '14px' }}>{pendingArea} শতক</strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '12px' }}>
                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ color: '#475569', fontSize: '11px', fontWeight: '600' }}>খতিয়ান নং:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKhatian(!editingKhatian);
                              if (!editingKhatian) {
                                setCustomKhatianInput(selectedLand.khatian_no || filter.khatian_no || '');
                              }
                            }}
                            style={{
                              fontSize: '11px',
                              color: '#2563eb',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {editingKhatian ? 'বাতিল' : '✏️ পরিবর্তন'}
                          </button>
                        </div>
                        {editingKhatian ? (
                          <div style={{ marginTop: '4px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="text"
                                value={customKhatianInput}
                                onChange={(e) => setCustomKhatianInput(e.target.value)}
                                placeholder="খতিয়ান নং"
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  fontSize: '12px',
                                  border: '1px solid #94a3b8',
                                  borderRadius: '4px',
                                  color: '#0f172a',
                                  background: '#ffffff'
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleSaveKhatianToDb}
                                disabled={savingKhatian}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {savingKhatian ? '...' : 'সংরক্ষণ'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                            {selectedLand.khatian_no || filter.khatian_no || 'অনির্ধারিত'}
                          </strong>
                        )}
                        {khatianSaveMsg && (
                          <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '4px', fontWeight: '700' }}>
                            {khatianSaveMsg}
                          </div>
                        )}
                      </div>

                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>জে.এল নং:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedLand.jl_no || filter.jl_no}</strong>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <span style={{ color: '#475569', display: 'block', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}>উপজেলা ও জেলা:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedLand.upazila}, {selectedLand.district}</strong>
                      </div>
                    </div>

                    {/* Existing co-owners in this Dag */}
                    {plotMeta?.existing_owners && plotMeta.existing_owners.length > 0 && (
                      <div style={{ marginTop: '12px', background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #86efac' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={14} color="#16a34a" /> এই দাগের অনুমোদিত বরাদ্দপ্রাপ্ত মালিকগণ ({plotMeta.existing_owners.length} জন):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {plotMeta.existing_owners.map((owner, idx) => (
                            <div key={owner._id || idx} style={{ fontSize: '11.5px', color: '#14532d', display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: idx < plotMeta.existing_owners.length - 1 ? '1px dashed #bbf7d0' : 'none' }}>
                              <span>
                                <strong>{idx + 1}. {owner.name}</strong> (NID: <span style={{ fontFamily: 'monospace' }}>{owner.nid}</span>)
                                {owner.deed_no ? ` [দলিল: ${owner.deed_no}]` : ''}
                              </span>
                              <span style={{ fontWeight: '800', color: '#15803d' }}>
                                {owner.area_decimal} শতক
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending requests in this Dag */}
                    {plotMeta?.pending_requests && plotMeta.pending_requests.length > 0 && (
                      <div style={{ marginTop: '10px', background: '#fffbeb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#b45309', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#d97706" /> এসি ল্যান্ডে রিভিউ অপেক্ষমান বরাদ্দ ({plotMeta.pending_requests.length} টি):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {plotMeta.pending_requests.map((r, idx) => (
                            <div key={r._id || idx} style={{ fontSize: '11.5px', color: '#78350f', display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: idx < plotMeta.pending_requests.length - 1 ? '1px dashed #fde68a' : 'none' }}>
                              <span>
                                <strong>{idx + 1}. {r.name}</strong> (NID: <span style={{ fontFamily: 'monospace' }}>{r.nid}</span>)
                              </span>
                              <span style={{ fontWeight: '800', color: '#b45309' }}>
                                {r.area_decimal} শতক
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#166534', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} /> বরাদ্দকৃত জমির পরিমাণ (শতক) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    {selectedLand && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: (plotMeta?.available_area ?? selectedLand.available_area_decimal ?? 0) > 0 ? '#15803d' : '#dc2626'
                      }}>
                        অবশিষ্ট বরাদ্দযোগ্য: {plotMeta?.available_area ?? selectedLand.available_area_decimal ?? 0} শতক
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 100}
                      required
                      className="input-field"
                      placeholder="জমির পরিমাণ লিখুন (শতক)"
                      value={assignArea}
                      onChange={(e) => setAssignArea(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: parseFloat(assignArea || 0) > (plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0) ? '2px solid #ef4444' : '1px solid #86efac',
                        fontWeight: '700'
                      }}
                      disabled={!selectedLand || (plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0) <= 0}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>শতক</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px' }}>
                    <span style={{ color: '#475569' }}>
                      আংশিক বা পূর্ণ বরাদ্দ করতে পরিমাণ লিখুন (দাগের মোট জমি: {plotMeta?.total_dag_area ?? selectedLand?.total_area_decimal ?? 0} শতক)
                    </span>
                    {(plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setAssignArea(String(plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? ''))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontWeight: '700',
                          textDecoration: 'underline'
                        }}
                      >
                        সম্পূর্ণ অবশিষ্ট নিন ({plotMeta?.available_area ?? selectedLand?.available_area_decimal} শতক)
                      </button>
                    )}
                  </div>

                  {parseFloat(assignArea || 0) > (plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0) && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ বরাদ্দকৃত জমি অবশিষ্ট {plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0} শতকের চেয়ে বেশি হতে পারবে না!
                    </div>
                  )}

                  {selectedLand && (plotMeta?.available_area ?? selectedLand?.available_area_decimal ?? 0) <= 0 && (
                    <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px', fontWeight: '700' }}>
                      🔒 এই দাগের সম্পূর্ণ জমি ইতিমধ্যে বরাদ্দ হয়ে গেছে। নতুন বরাদ্দ করা যাবে না।
                    </div>
                  )}
                </div>

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

      {/* TAB 3: Bonton Nama & Death Certificate Section */}
      {activeTab === 'bonton_nama' && (
        <div>
          <BontonNamaRegistrySection />
        </div>
      )}

      {/* TAB: Other Transfer & Exchange Deeds */}
      {activeTab === 'other_deeds' && (
        <div>
          {/* Sub-menu bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1.5px solid #cbd5e1',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <button
              type="button"
              onClick={() => setSelectedOtherDeedSub('heba')}
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
                background: selectedOtherDeedSub === 'heba' ? '#065f46' : '#f1f5f9',
                color: selectedOtherDeedSub === 'heba' ? '#ffffff' : '#334155',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🎁 দানপত্র / হেবা দলিল</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOtherDeedSub('exchange')}
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
                background: selectedOtherDeedSub === 'exchange' ? '#1e3a8a' : '#f1f5f9',
                color: selectedOtherDeedSub === 'exchange' ? '#ffffff' : '#334155',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🔄 বিনিময় দলিল</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOtherDeedSub('mortgage')}
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
                background: selectedOtherDeedSub === 'mortgage' ? '#701a75' : '#f1f5f9',
                color: selectedOtherDeedSub === 'mortgage' ? '#ffffff' : '#334155',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🔒 বন্ধকি দলিল (Mortgage)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOtherDeedSub('bayna')}
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
                background: selectedOtherDeedSub === 'bayna' ? '#c2410c' : '#f1f5f9',
                color: selectedOtherDeedSub === 'bayna' ? '#ffffff' : '#334155',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📝 বায়নাপত্র দলিল (Bayna)</span>
            </button>
          </div>

          {/* Render selected sub-panel */}
          {selectedOtherDeedSub === 'heba' && <HebaGiftDeedPanel />}
          {selectedOtherDeedSub === 'exchange' && <ExchangeDeedPanel />}
          {selectedOtherDeedSub === 'mortgage' && <MortgageDeedPanel />}
          {selectedOtherDeedSub === 'bayna' && <BaynaDeedPanel />}
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

      {/* ── TAB: Land Ownership Claims Notifications (Read-Only) ── */}
      {activeTab === 'claims' && (
        <div>
          {/* Header instructions bar */}
          <div style={{
            background: '#fef3c7',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={24} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '14px', color: '#78350f', display: 'block' }}>
                  নাগরিকদের জমি মালিকানা দাবি বিজ্ঞপ্তি তালিকা (Read-Only Notification):
                </strong>
                <span>
                  কোনো জমি অনলাইনে ভুলবশত অন্য কারো নামে রেকর্ড হয়ে থাকলে নাগরিকরা এই দাবি দাখিল করেন। এটি সাব-রেজিস্ট্রারের জ্ঞাতার্থে ও অবগতির জন্য শুধুমাত্র দর্শনযোগ্য (Read-only, সিস্টেমে সরাসরি কোনো ডাটা পরিবর্তন ছাড়াই রেকর্ড সংরক্ষিত থাকে)।
                </span>
              </div>
            </div>

            <button
              onClick={fetchClaimNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '700',
                background: '#ffffff',
                border: '1px solid #d97706',
                color: '#92400e',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loadingClaims ? 'animate-spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {loadingClaims ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#d97706' }} />
              <div style={{ fontSize: '15px', fontWeight: '700' }}>বিজ্ঞপ্তিসমূহ লোড হচ্ছে...</div>
            </div>
          ) : claimNotifications.length === 0 ? (
            <div className="glass-card" style={{ padding: '50px 24px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📭</div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                বর্তমানে কোনো নতুন মালিকানা দাবি বিজ্ঞপ্তি নেই
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px' }}>
                নাগরিক ড্যাশবোর্ড থেকে মালিকানা দাবি দাখিল করা হলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {claimNotifications.map((claim) => (
                <div
                  key={claim._id || claim.claim_id}
                  className="glass-card"
                  style={{
                    padding: '22px 26px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        fontSize: '13px',
                        color: '#1d4ed8',
                        background: '#eff6ff',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe'
                      }}>
                        {claim.claim_id}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        দাখিলের সময়: {new Date(claim.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {claim.status === 'অনুমোদিত' ? (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #86efac',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <CheckCircle size={13} color="#166534" />
                          <span>অনুমোদিত (Approved)</span>
                        </span>
                      ) : claim.status === 'আবেদন খারিজ করা হলো' ? (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <AlertTriangle size={13} color="#991b1b" />
                          <span>আবেদন খারিজ করা হলো (Rejected)</span>
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <Clock size={13} color="#92400e" />
                          <span>অপেক্ষমান (Pending)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '14px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>দাবিকারী নাগরিক</div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>{claim.applicant_name}</div>
                      <div style={{ fontSize: '11.5px', color: '#475569', fontFamily: 'monospace' }}>NID: {claim.applicant_nid}</div>
                      {claim.applicant_phone && <div style={{ fontSize: '11px', color: '#64748b' }}>মোবাইল: {claim.applicant_phone}</div>}
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>তফসিল ও অবস্থান</div>
                      <div style={{ color: '#0f172a', fontWeight: '700', marginTop: '2px' }}>মৌজা: {claim.mouza}</div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        উপজেলা: {claim.upazila || 'শিবগঞ্জ'} | জেলা: {claim.district || 'বগুড়া'}{claim.division ? ` (${claim.division} বিভাগ)` : ''}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>দাগ ও খতিয়ান নম্বর</div>
                      <div style={{ marginTop: '2px' }}>
                        দাগ নং: <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>{claim.dag_no}</strong>
                      </div>
                      <div>
                        খতিয়ান নং: <strong style={{ color: '#1d4ed8' }}>{claim.khatian_no}</strong>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ভুল অ্যাসাইন স্ট্যাটাস</div>
                      <div style={{
                        marginTop: '4px',
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: claim.previous_assignment_status === 'হ্যাঁ' ? '#fee2e2' : '#f0fdf4',
                        color: claim.previous_assignment_status === 'হ্যাঁ' ? '#991b1b' : '#166534',
                        border: `1px solid ${claim.previous_assignment_status === 'হ্যাঁ' ? '#fca5a5' : '#86efac'}`
                      }}>
                        {claim.previous_assignment_status === 'হ্যাঁ' ? '⚠️ অন্য কারো নামে ভুল অ্যাসাইন রয়েছে' : 'ℹ️ অনলাইনে এখনও অ্যাসাইন হয়নি'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    fontSize: '13px',
                    color: '#1e3a8a',
                    lineHeight: 1.6,
                    marginBottom: '14px'
                  }}>
                    <strong style={{ color: '#1e40af', display: 'block', marginBottom: '4px' }}>নাগরিকের ঘোষণাপত্র (Declaration Text):</strong>
                    &ldquo;{claim.declaration_text}&rdquo;
                  </div>

                  {/* Status update action control for Sub-Registrar */}
                  <div style={{
                    padding: '12px 18px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                        আবেদন স্ট্যাটাস নির্ধারণ করুন:
                      </span>
                      <select
                        value={statusSelections[claim._id || claim.claim_id] || claim.status || 'অপেক্ষমান'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const key = claim._id || claim.claim_id;
                          setStatusSelections(prev => ({ ...prev, [key]: val }));
                        }}
                        style={{
                          padding: '7px 14px',
                          fontSize: '13px',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          color: (statusSelections[claim._id || claim.claim_id] || claim.status) === 'অনুমোদিত'
                            ? '#166534'
                            : (statusSelections[claim._id || claim.claim_id] || claim.status) === 'আবেদন খারিজ করা হলো'
                              ? '#991b1b'
                              : '#92400e',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="অপেক্ষমান">১. অপেক্ষমান (Pending)</option>
                        <option value="অনুমোদিত">২. অনুমোদিত (Approved)</option>
                        <option value="আবেদন খারিজ করা হলো">৩. আবেদন খারিজ করা হলো (Rejected)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={updatingClaimId === (claim._id || claim.claim_id)}
                      onClick={() => handleUpdateClaimStatus(claim._id || claim.claim_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: updatingClaimId === (claim._id || claim.claim_id) ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <Send size={14} className={updatingClaimId === (claim._id || claim.claim_id) ? 'animate-spin' : ''} />
                      <span>{updatingClaimId === (claim._id || claim.claim_id) ? 'আপডেট হচ্ছে...' : 'স্ট্যাটাস আপডেট পাঠান'}</span>
                    </button>
                  </div>

                  {statusUpdateMessage?.claimId === (claim._id || claim.claim_id) && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 14px',
                      background: '#ecfdf5',
                      border: '1px solid #86efac',
                      color: '#065f46',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle size={14} color="#059669" />
                      <span>{statusUpdateMessage.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create_land' && (
        <div style={{ marginTop: '10px' }}>
          <DynamicLocationManager />
        </div>
      )}
    </DashboardLayout>
  );
}
