import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, MapPin, FileText, CheckCircle, Clock, 
  AlertTriangle, Search, Shield, Phone, Mail, Award,
  RefreshCw, Check, ArrowRight, Download, Printer, X, Eye, QrCode,
  FileCheck, Send, Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../components/DashboardLayout';
import P5CitizenVerify from './P5CitizenVerify';
import { SHIBGANJ_MOUZAS } from '../utils/geoData';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lands'); // 'lands' | 'claim_ownership' | 'pending' | 'sold' | 'profile' | 'verify'
  const [landData, setLandData] = useState({
    active_lands: [],
    sold_lands: [],
    approved_assignments: [],
    pending_assignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Land Ownership Claim States
  const [claimForm, setClaimForm] = useState({
    mouza: SHIBGANJ_MOUZAS[0]?.mouza || 'গুজিয়া',
    dag_no: '',
    khatian_no: '',
    previous_assignment_status: 'হ্যাঁ'
  });
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [myClaims, setMyClaims] = useState([]);
  const [loadingMyClaims, setLoadingMyClaims] = useState(false);

  // PDF Certificate Generation States
  const [selectedLandForPdf, setSelectedLandForPdf] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const certificateRef = useRef(null);

  const handleOpenCertificate = (land) => {
    setSelectedLandForPdf(land);
    setShowCertificateModal(true);
  };

  const handleDownloadPdf = async (landToPrint) => {
    const targetLand = landToPrint || selectedLandForPdf;
    if (!targetLand) return;

    if (!selectedLandForPdf || selectedLandForPdf._id !== targetLand._id) {
      setSelectedLandForPdf(targetLand);
    }
    setShowCertificateModal(true);

    setGeneratingPdf(true);
    try {
      // Allow modal DOM to render cleanly
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!certificateRef.current) return;

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save(`Khotiyan-Certificate-দাগ-${targetLand.dag_no}-খতিয়ান-${targetLand.khatian_no}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    fetchAssignedLands();
    fetchMyClaims();
  }, []);

  const fetchAssignedLands = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/assigned-lands');
      if (res.data.success) {
        setLandData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching user lands:', err);
      setError('জমির তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClaims = async () => {
    setLoadingMyClaims(true);
    try {
      const res = await axios.get('/api/claim/my-claims');
      if (res.data.success) {
        setMyClaims(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch user claims:', err);
    } finally {
      setLoadingMyClaims(false);
    }
  };

  const getDeclarationText = () => {
    const citizenName = user?.name || '[নাম]';
    const citizenNid = user?.nid || '[NID]';
    const selectedMouza = claimForm.mouza || '[মৌজা]';
    const dagInput = claimForm.dag_no.trim() || '[দাগ নম্বর]';
    const khotiyanInput = claimForm.khatian_no.trim() || '[খতিয়ান নম্বর]';

    return `আমি ${citizenName}, NID: ${citizenNid} দাবি করছি যে, বগুড়া জেলা, শিবগঞ্জ উপজেলার অন্তর্গত মৌজা: ${selectedMouza}, দাগ নম্বর: ${dagInput}, খতিয়ান নম্বর: ${khotiyanInput} এ থাকা জমির অনলাইন মালিকানা দাবি করছি। বর্তমানে আমি জমিটি ডিজিটাল ভাবে নিবন্ধন/বিক্রি করতে চাই। তাই সাব রেজিস্ট্রার মহোদয় এর কাছে আবেদন ভেরিফাই করে জমিটি আমার নামে অনলাইনে বরদ্দ দিন।`;
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimForm.mouza) {
      setClaimError('অনুগ্রহ করে মৌজা নির্বাচন করুন।');
      return;
    }
    if (!claimForm.dag_no.trim()) {
      setClaimError('অনুগ্রহ করে দাগ নম্বর লিখুন।');
      return;
    }
    if (!claimForm.khatian_no.trim()) {
      setClaimError('অনুগ্রহ করে খতিয়ান নম্বর লিখুন।');
      return;
    }

    setSubmittingClaim(true);
    setClaimSuccess(null);
    setClaimError(null);

    try {
      const res = await axios.post('/api/claim/submit', {
        mouza: claimForm.mouza,
        dag_no: claimForm.dag_no.trim(),
        khatian_no: claimForm.khatian_no.trim(),
        previous_assignment_status: claimForm.previous_assignment_status,
        declaration_text: getDeclarationText()
      });

      if (res.data.success) {
        setClaimSuccess(res.data.message || 'আপনার মালিকানা দাবির আবেদনটি সফলভাবে সাব-রেজিস্ট্রার কার্যালয়ে প্রেরিত হয়েছে।');
        setClaimForm(prev => ({
          ...prev,
          dag_no: '',
          khatian_no: '',
          previous_assignment_status: 'হ্যাঁ'
        }));
        fetchMyClaims();
      }
    } catch (err) {
      setClaimError(err.response?.data?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const navItems = [
    { 
      id: 'lands', 
      label: 'আমার অনুমোদিত জমি', 
      icon: FileText, 
      badge: landData.active_lands.length,
      badgeColor: '#065f46',
      badgeBg: '#dcfce7'
    },
    { 
      id: 'claim_ownership', 
      label: 'মালিকানা দাবি করুন', 
      icon: FileCheck,
      badge: myClaims.length > 0 ? myClaims.length : undefined,
      badgeColor: '#1d4ed8',
      badgeBg: '#dbeafe'
    },
    { 
      id: 'pending', 
      label: 'পর্যালোচনাধীন আবেদন', 
      icon: Clock, 
      badge: landData.pending_assignments.length,
      badgeColor: '#b45309',
      badgeBg: '#fef3c7'
    },
    { 
      id: 'sold', 
      label: 'বিক্রিত জমির ইতিহাস', 
      icon: AlertTriangle, 
      badge: landData.sold_lands.length,
      badgeColor: '#b91c1c',
      badgeBg: '#fee2e2'
    },
    { 
      id: 'verify', 
      label: 'জমি ও খতিয়ান যাচাই', 
      icon: Search 
    },
    { 
      id: 'profile', 
      label: 'নাগরিক প্রোফাইল', 
      icon: User 
    },
  ];

  const stats = [
    { label: 'অনুমোদিত জমি', value: landData.active_lands.length, color: '#047857' },
    { label: 'মালিকানা দাবি', value: myClaims.length, color: '#1d4ed8' },
    { label: 'পর্যালোচনাধীন', value: landData.pending_assignments.length, color: '#b45309' },
    { label: 'হস্তান্তরিত জমি', value: landData.sold_lands.length, color: '#dc2626' },
  ];

  return (
    <DashboardLayout
      title="নাগরিক ড্যাশবোর্ড"
      subtitle={`স্বাগতম, ${user?.name || 'নাগরিক'} | জাতীয় পরিচয়পত্র: ${user?.nid || 'N/A'} | ঠিকানা: ${user?.upazila || ''}, ${user?.district || ''}`}
      badge={{ label: 'নাগরিক পোর্টাল' }}
      icon={User}
      roleTheme="green"
      stats={stats}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <button
          onClick={fetchAssignedLands}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: '700',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            color: '#0f172a',
            borderRadius: '10px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>রিফ্রেশ</span>
        </button>
      }
    >
      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1.5px solid #fca5a5',
          color: '#991b1b',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── TAB 1: Approved Active Lands ──────────────────────── */}
      {activeTab === 'lands' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <CheckCircle size={20} color="#047857" />
                এসি ল্যান্ড কর্তৃক অনুমোদিত ও মিউটেটেড জমি ({landData.active_lands.length}টি)
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
                এই জমিগুলোর বৈধ খতিয়ান আপনার নামে নিবন্ধিত রয়েছে এবং আপনি বিক্রয় বা হস্তান্তর করতে পারবেন।
              </p>
            </div>
          </div>

          {loading ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#047857' }} />
              <div style={{ fontSize: '15px', fontWeight: '700' }}>জমির তথ্য লোড হচ্ছে...</div>
            </div>
          ) : landData.active_lands.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🌾</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                বর্তমানে কোনো অনুমোদিত জমি পাওয়া যায়নি
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
                সাব-রেজিস্ট্রি অফিস থেকে আপনার এনআইডি ({user?.nid}) দ্বারা জমি বরাদ্দ পাঠানো হলে এবং এসি ল্যান্ড অফিস কর্তৃক অনুমোদন সম্পন্ন হলে তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {landData.active_lands.map((land) => (
                <div
                  key={land._id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderTop: '4px solid #059669',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#047857',
                      border: '1px solid #86efac',
                      fontWeight: '800'
                    }}>
                      ✅ অনুমোদিত ও সক্রিয় (Active)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', fontWeight: '600' }}>
                      রেকর্ড ID: {land.record_id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                    দাগ নং: <span style={{ color: '#047857' }}>{land.dag_no}</span> | খতিয়ান নং: <span style={{ color: '#047857' }}>{land.khatian_no}</span>
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>মৌজা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.mouza}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>জে.এল নং:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.jl_no}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>জেলা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.district || 'বগুড়া'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>উপজেলা:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{land.upazila || 'শিবগঞ্জ'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>মোট পরিমাণ:</span>{' '}
                      <strong style={{ color: '#047857', fontSize: '13px' }}>{land.total_area_decimal} শতক</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>অবশিষ্ট ব্যবহার্য:</span>{' '}
                      <strong style={{ color: '#047857', fontSize: '13px' }}>{land.available_area_decimal} শতক</strong>
                    </div>
                  </div>

                  {/* Registry details */}
                  <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>ভলিউম ও পৃষ্ঠা:</span>
                      <strong style={{ color: '#0f172a' }}>
                        ভলিউম: {land.volume_book || 'VOL-2024'} | পৃষ্ঠা: {land.page_no || '১ম'}
                      </strong>
                    </div>
                    {land.deed_no && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>দলিল নম্বর:</span>
                        <strong style={{ color: '#047857' }}>{land.deed_no}</strong>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: PDF Download & Preview */}
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(land)}
                      disabled={generatingPdf && selectedLandForPdf?._id === land._id}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, #047857, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                        cursor: (generatingPdf && selectedLandForPdf?._id === land._id) ? 'wait' : 'pointer'
                      }}
                    >
                      <Download size={14} />
                      <span>{(generatingPdf && selectedLandForPdf?._id === land._id) ? 'PDF প্রস্তুত হচ্ছে...' : 'খতিয়ান সনদ PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCertificate(land)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        borderRadius: '9px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1.5px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      title="সনদের প্রিভিউ দেখুন"
                    >
                      <Eye size={14} />
                      <span>প্রিভিউ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Pending Assignments in Review ──────────────── */}
      {activeTab === 'pending' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={20} color="#b45309" />
              এসি ল্যান্ড অফিসে পর্যালোচনায় অপেক্ষমান জমি বরাদ্দ ({landData.pending_assignments.length}টি)
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
              সাব-রেজিস্ট্রি অফিস থেকে আপনার নামে জমি বরাদ্দের আবেদন পাঠানো হয়েছে। সহকারী কমিশনার (ভূমি) অনুমোদন করলেই জমিটি আপনার চূড়ান্ত মালিকানায় আসবে।
            </p>
          </div>

          {landData.pending_assignments.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>⏳</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                বর্তমানে কোনো অপেক্ষমান বরাদ্দ আবেদন নেই
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
                আপনার নামে নতুন কোনো জমির আবেদন সাব-রেজিস্ট্রি কর্তৃক সাবমিট করা হলে তা এখানে পেন্ডিং হিসেবে ট্র্যাক করতে পারবেন।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {landData.pending_assignments.map((req) => (
                <div
                  key={req._id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderTop: '4px solid #d97706',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      fontWeight: '800'
                    }}>
                      ⏳ এসি ল্যান্ড রিভিউ পেন্ডিং
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      {req.mouza}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                    দাগ নং: {req.dag_no} | খতিয়ান নং: {req.khatian_no}
                  </h3>

                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '12px',
                    color: '#92400e'
                  }}>
                    <div>পরিমাণ: <strong>{req.area_decimal} শতক</strong></div>
                    <div style={{ marginTop: '4px' }}>ভলিউম: <strong>{req.volume_book}</strong> | পৃষ্ঠা: <strong>{req.page_no}</strong></div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    আবেদন দাখিলের সময়: {req.created_at ? new Date(req.created_at).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Sold Lands History ─────────────────────────── */}
      {activeTab === 'sold' && (
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <AlertTriangle size={20} color="#dc2626" />
              আপনার ইতিপূর্বে বিক্রিত ও হস্তান্তরিত জমির ইতিহাস ({landData.sold_lands.length}টি)
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
              নিরাপত্তা ও অ্যান্টি-ডাবল সেলিং প্রটোকল অনুসারে এই জমিগুলো ইতিপূর্বে বিক্রয় সম্পন্ন হয়েছে। এগুলো পুনরায় বিক্রয়যোগ্য নয়।
            </p>
          </div>

          {landData.sold_lands.length === 0 ? (
            <div className="glass-card" style={{ padding: '54px 30px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📜</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                কোনো বিক্রিত জমির রেকর্ড নেই
              </h3>
              <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>
                আপনি ইতিপূর্বে কোনো জমি সাব-রেজিস্ট্রির মাধ্যমে হস্তান্তর বা বিক্রয় করেননি।
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {landData.sold_lands.map((land) => (
                <div
                  key={land._id}
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderTop: '4px solid #ef4444',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      fontWeight: '800'
                    }}>
                      🚫 হস্তান্তরিত / বিক্রিত (Sold)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      মৌজা: <strong style={{ color: '#0f172a' }}>{land.mouza}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    দাগ নং: {land.dag_no} | খতিয়ান নং: {land.khatian_no}
                  </h3>

                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '10px',
                    color: '#991b1b'
                  }}>
                    <div>বিক্রিত পরিমাণ: <strong>{land.sold_area || land.total_area_decimal} শতক</strong></div>
                    <div style={{ marginTop: '4px' }}>নতুন ক্রেতা: <strong>{land.buyer_name || 'নতুন স্বত্বাধিকারী'}</strong></div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                    🔒 এই জমিটি হস্তান্তর সম্পন্ন হয়েছে। পুরোনো মালিক হিসেবে আর বিক্রয়যোগ্য নয়।
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Public & Citizen Land Verification ─────────── */}
      {activeTab === 'verify' && (
        <div className="glass-card" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px' }}>
          <P5CitizenVerify />
        </div>
      )}

      {/* ── TAB 5: Read-Only Citizen Profile ──────────────────── */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: '32px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #065f46, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(6, 95, 70, 0.25)'
            }}>
              <Award size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                জাতীয় নাগরিক প্রোফাইল (দর্শনযোগ্য)
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>
                জাতীয় কেন্দ্রীয় ডাটাবেজে সংরক্ষিত আপনার স্থায়ী নাগরিক পরিচিতি
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>পুরো নাম</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{user?.name || 'নাগরিক নাম'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>জাতীয় পরিচয়পত্র (NID)</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#047857', fontFamily: 'monospace' }}>{user?.nid}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>পিতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.father_name || 'জালাল উদ্দিন'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>মাতার নাম</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.mother_name || 'আমেনা খাতুন'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>বিভাগ ও জেলা</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.division || 'রাজশাহী'}, {user?.district || 'বগুড়া'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>উপজেলা / সার্কেল</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{user?.upazila || 'শিবগঞ্জ'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>মোবাইল নম্বর</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#047857" /> {user?.phone || '০১৭xxxxxxxx'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>ইমেইল ঠিকানা</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#0284c7" /> {user?.email}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '28px',
            padding: '16px 20px',
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            lineHeight: 1.5
          }}>
            <Shield size={20} style={{ flexShrink: 0 }} />
            <span>
              নাগরিকের প্রোফাইল তথ্য সিস্টেম নিরাপত্তার স্বার্থে শুধুমাত্র দর্শনযোগ্য (Read-only)। সংশোধনের জন্য সংশ্লিষ্ট উপজেলা ভূমি অফিস অথবা মন্ত্রণালয়ে যোগাযোগ করুন।
            </span>
          </div>
        </div>
      )}

      {/* ── TAB: Claim Land Ownership (মালিকানা দাবি করুন) ───────────────── */}
      {activeTab === 'claim_ownership' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            borderRadius: '16px',
            padding: '24px 28px',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  নাগরিক স্বত্বাধিকার সুরক্ষা
                </span>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                  বগুড়া জেলা | শিবগঞ্জ উপজেলা
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>
                মালিকানা দাবি আবেদন ফরম (Claim Ownership)
              </h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', opacity: 0.9, maxWidth: '720px', lineHeight: 1.5 }}>
                আপনার জমি যদি অনলাইনে ভুলবশত অন্য কারো নামে অ্যাসাইন বা রেকর্ড হয়ে থাকে, তবে সাব-রেজিস্ট্রার কার্যালয়ে অনলাইন মালিকানা বরাদ্দের জন্য আবেদন করুন।
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {claimSuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#065f46',
              padding: '16px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)'
            }}>
              <CheckCircle size={20} color="#059669" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {claimError && (
            <div style={{
              background: '#fee2e2',
              border: '1.5px solid #fca5a5',
              color: '#991b1b',
              padding: '16px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(153, 27, 27, 0.08)'
            }}>
              <AlertTriangle size={20} color="#dc2626" />
              <span>{claimError}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="glass-card" style={{
            padding: '28px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
          }}>
            <form onSubmit={handleSubmitClaim}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* 1. Name: Auto-filled */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ১. আবেদনকারীর নাম (স্বয়ংক্রিয় তথ্য) <span style={{ color: '#059669' }}>🔒</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || ''}
                    className="input-field"
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontWeight: '700',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'not-allowed'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    নাগরিক প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে সংগৃহীত
                  </span>
                </div>

                {/* 2. NID: Auto-filled */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ২. জাতীয় পরিচয়পত্র নম্বর (NID) <span style={{ color: '#059669' }}>🔒</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.nid || ''}
                    className="input-field"
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      color: '#047857',
                      fontWeight: '800',
                      fontFamily: 'monospace',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'not-allowed'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    সত্যায়িত নাগরিক জাতীয় পরিচয়পত্র
                  </span>
                </div>

                {/* 3. Mouza: Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ৩. মৌজা নির্বাচন (বগুড়া জেলা, শিবগঞ্জ উপজেলা) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={claimForm.mouza}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, mouza: e.target.value }))}
                    style={{ width: '100%', color: '#0f172a', fontWeight: '600', background: '#ffffff' }}
                    required
                  >
                    {SHIBGANJ_MOUZAS.map((m) => (
                      <option key={m.jl_no + m.mouza} value={m.mouza}>
                        {m.mouza} (জে.এল নং {m.jl_no})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    বগুড়া জেলার শিবগঞ্জ উপজেলার অন্তর্ভুক্ত মৌজা তালিকা
                  </span>
                </div>

                {/* 4. Dag Number: Manual input */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ৪. দাগ নম্বর (Dag Number) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="দাগ নম্বর লিখুন (যেমন: ১০১)"
                    value={claimForm.dag_no}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, dag_no: e.target.value }))}
                    style={{ width: '100%', color: '#0f172a', fontWeight: '600' }}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    যে দাগের জমি আপনি দাবি করছেন
                  </span>
                </div>

                {/* 5. Khotiyan Number: Manual input */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ৫. খতিয়ান নম্বর (Khotiyan Number) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="খতিয়ান নম্বর লিখুন (যেমন: ৫২)"
                    value={claimForm.khatian_no}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, khatian_no: e.target.value }))}
                    style={{ width: '100%', color: '#0f172a', fontWeight: '600' }}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    সিএস/এসএ/আরএস/বিএস খতিয়ান নম্বর
                  </span>
                </div>

                {/* 6. Previous Online Assignment Status: Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    ৬. বর্টমানে এই জমির অনলাইন নিবন্ধন অন্য কারো নামে ভুলভাবেASSIGN হয়ে আছে কি? <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={claimForm.previous_assignment_status}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, previous_assignment_status: e.target.value }))}
                    style={{ width: '100%', color: '#0f172a', fontWeight: '600', background: '#ffffff' }}
                    required
                  >
                    <option value="হ্যাঁ">হ্যাঁ (Yes - অন্য কারো নামে ভুলভাবেASSIGN হয়ে আছে)</option>
                    <option value="না">না (No - এখনও অনলাইনে কারও নামে ASSIGN হয়নি)</option>
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    বর্তমান অনলাইন স্ট্যাটাস চিহ্নিত করুন
                  </span>
                </div>
              </div>

              {/* 7. Application Declaration Text Box (Auto-generated context) */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '24px',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#1e40af'
                }}>
                  <FileCheck size={18} color="#2563eb" />
                  <span>আবেদনপত্র ও ঘোষণাপত্র (Application Declaration Text - স্বয়ংক্রিয় প্রস্তুতকৃত)</span>
                </div>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  fontSize: '14px',
                  color: '#0f172a',
                  lineHeight: 1.7
                }}>
                  &ldquo;{getDeclarationText()}&rdquo;
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                  <Info size={14} color="#64748b" />
                  <span>উপরে প্রদত্ত তথ্যের ভিত্তিতে এই ঘোষণাপত্রটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে এবং এটি সাব-রেজিস্ট্রার মহোদয়ের নোটিফিকেশনে প্রেরিত হবে।</span>
                </div>
              </div>

              {/* 8. Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: submittingClaim ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={16} />
                  <span>{submittingClaim ? 'আবেদন দাখিল হচ্ছে...' : 'মালিকানা দাবি আবেদন দাখিল করুন'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section: Citizen's submitted claims list */}
          <div className="glass-card" style={{
            padding: '24px 28px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  আমার দাখিলকৃত মালিকানা দাবির তালিকা ({myClaims.length}টি)
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  সাব-রেজিস্ট্রার কার্যালয়ে প্রেরিত আপনার পূর্ববর্তী দাবিসমূহের ট্র্যাকিং
                </p>
              </div>
              <button
                type="button"
                onClick={fetchMyClaims}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={loadingMyClaims ? 'animate-spin' : ''} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {myClaims.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}>
                <FileCheck size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#334155' }}>বর্তমানে আপনার কোনো মালিকানা দাবি দাখিল করা নেই</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>প্রয়োজনে উপরের ফরমটি পূরণ করে আবেদন দাখিল করুন।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myClaims.map((claim) => (
                  <div
                    key={claim._id || claim.claim_id}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: '800',
                          fontSize: '13px',
                          color: '#1d4ed8',
                          background: '#eff6ff',
                          padding: '3px 10px',
                          borderRadius: '6px'
                        }}>
                          {claim.claim_id}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          দাখিলের তারিখ: {new Date(claim.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {claim.status === 'অনুমোদিত' ? (
                        <span style={{
                          fontSize: '11.5px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #86efac',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <CheckCircle size={13} color="#166534" />
                          <span>অনুমোদিত (Approved)</span>
                        </span>
                      ) : claim.status === 'আবেদন খারিজ করা হলো' ? (
                        <span style={{
                          fontSize: '11.5px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #f87171',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <AlertTriangle size={13} color="#991b1b" />
                          <span>আবেদন খারিজ করা হলো (Rejected)</span>
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11.5px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <Clock size={13} color="#92400e" />
                          <span>অপেক্ষমান (Pending)</span>
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px',
                      fontSize: '13px',
                      background: '#f8fafc',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>মৌজা:</span> <strong>{claim.mouza}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>দাগ নম্বর:</span> <strong style={{ color: '#1d4ed8' }}>{claim.dag_no}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>খতিয়ান নম্বর:</span> <strong style={{ color: '#1d4ed8' }}>{claim.khatian_no}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>পূর্বে ভুল ASSIGN:</span>{' '}
                        <strong style={{ color: claim.previous_assignment_status === 'হ্যাঁ' ? '#dc2626' : '#166534' }}>
                          {claim.previous_assignment_status}
                        </strong>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: '#334155',
                      lineHeight: 1.6,
                      background: '#fafafa',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      borderLeft: '3px solid #2563eb'
                    }}>
                      <strong>ঘোষণাপত্র:</strong> {claim.declaration_text}
                    </div>

                    {claim.reviewed_by && (
                      <div style={{
                        fontSize: '11.5px',
                        color: claim.status === 'অনুমোদিত' ? '#166534' : claim.status === 'আবেদন খারিজ করা হলো' ? '#991b1b' : '#92400e',
                        background: claim.status === 'অনুমোদিত' ? '#f0fdf4' : claim.status === 'আবেদন খারিজ করা হলো' ? '#fef2f2' : '#fffbeb',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <span><strong>সাব-রেজিস্ট্রার পর্যালোচনা:</strong> {claim.reviewed_by} কর্তৃক আপডেটকৃত</span>
                        {claim.reviewed_at && (
                          <span>তারিখ: {new Date(claim.reviewed_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Official A4 Land Ownership & Khatian PDF Certificate Modal ── */}
      {showCertificateModal && selectedLandForPdf && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowY: 'auto',
          padding: '24px 16px'
        }}>
          {/* Modal Action Bar */}
          <div style={{
            width: '100%',
            maxWidth: '820px',
            background: '#ffffff',
            borderRadius: '12px 12px 0 0',
            border: '1.5px solid #000000',
            borderBottom: 'none',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#047857" />
              <strong style={{ fontSize: '15px', color: '#000000' }}>
                অফিসিয়াল খতিয়ান ও চূড়ান্ত মালিকানা সনদ (A4 ফরম্যাট)
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedLandForPdf)}
                disabled={generatingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: generatingPdf ? 'wait' : 'pointer'
                }}
              >
                <Download size={14} />
                <span>{generatingPdf ? 'PDF প্রস্তুত হচ্ছে...' : 'PDF ডাউনলোড করুন'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid #94a3b8',
                  cursor: 'pointer'
                }}
              >
                <Printer size={14} />
                <span>প্রিন্ট</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  border: '1px solid #f87171',
                  color: '#b91c1c',
                  cursor: 'pointer'
                }}
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable A4 Certificate Page */}
          <div
            ref={certificateRef}
            style={{
              width: '100%',
              maxWidth: '820px',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '36px 42px',
              border: '2px solid #000000',
              fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
              boxSizing: 'border-box',
              marginBottom: '40px'
            }}
          >
            {/* Inner Decorative Border */}
            <div style={{
              border: '1.5px solid #000000',
              padding: '24px 28px',
              background: '#ffffff'
            }}>

              {/* 1. Official Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#000000', marginBottom: '2px' }}>
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#000000', margin: '2px 0' }}>
                  ভূমি মন্ত্রণালয় · জাতীয় ডিজিটাল ভূমি রেকর্ড ও সেবা প্ল্যাটফর্ম (e-ভূমি)
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#000000' }}>
                  উপজেলা ভূমি অফিস ও সাব-রেজিস্ট্রার কার্যালয়, {selectedLandForPdf.upazila || 'শিবগঞ্জ'}, {selectedLandForPdf.district || 'বগুড়া'}
                </div>

                <div style={{
                  display: 'inline-block',
                  margin: '12px auto 6px',
                  padding: '4px 22px',
                  border: '2px solid #000000',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#000000',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  চূড়ান্ত স্বত্বাধিকারী নামজারি খতিয়ান ও ভূমি মালিকানা সনদ
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#000000', marginTop: '6px' }}>
                  <span>রেকর্ড ট্র্যাকিং নং: {selectedLandForPdf.record_id || selectedLandForPdf._id}</span>
                  <span>সনদ ইস্যু তারিখ: {new Date(selectedLandForPdf.updatedAt || Date.now()).toLocaleDateString('bn-BD')}</span>
                  <span>স্ট্যাটাস: সক্রিয় ও অনুমোদিত (Active Record)</span>
                </div>
              </div>

              {/* 2. Table 1: তফসিল ও প্রশাসনিক পরিচিতি */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginBottom: '4px', textTransform: 'uppercase' }}>
                  ১. তফসিল ও প্রশাসনিক পরিচিতি (Land Administrative Schedule)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #000000' }}>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>বিভাগ</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>জেলা</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>উপজেলা / সার্কেল</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>মৌজা</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>জে.এল নং</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>খতিয়ান নং</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>দাগ নং</th>
                      <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', color: '#000000', fontWeight: '700' }}>জমির শ্রেণি</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.division || 'রাজশাহী'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.district || 'বগুড়া'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.upazila || 'শিবগঞ্জ'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '700', color: '#000000' }}>{selectedLandForPdf.mouza}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.jl_no}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '800', color: '#000000', fontSize: '13px' }}>{selectedLandForPdf.khatian_no}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '800', color: '#000000', fontSize: '13px' }}>{selectedLandForPdf.dag_no}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#000000' }}>নাল / বাস্তু</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. Table 2: স্বত্বাধিকারী/মালিকের পূর্ণাঙ্গ তথ্য */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginBottom: '4px', textTransform: 'uppercase' }}>
                  ২. বৈধ স্বত্বাধিকারী / মালিকের পূর্ণাঙ্গ পরিচিতি (Owner & Citizen Information)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '25%', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>বর্তমান বৈধ মালিকের নাম</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '35%', fontWeight: '800', color: '#000000' }}>{selectedLandForPdf.owner_name || user?.name}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '20%', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>জাতীয় পরিচয়পত্র (NID)</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '20%', fontWeight: '800', color: '#000000', fontFamily: 'monospace' }}>{selectedLandForPdf.owner_nid || user?.nid}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>পিতা / স্বামীর নাম</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '600', color: '#000000' }}>{user?.father_name || 'রেকর্ডভুক্ত পিতা'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>মোবাইল নম্বর</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.owner_phone || user?.phone || '০১৭xxxxxxxx'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>স্থায়ী ঠিকানা</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '600', color: '#000000' }}>{selectedLandForPdf.upazila || user?.upazila || ''}, {selectedLandForPdf.district || user?.district || ''}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>মালিকানা অর্জনের উৎস</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#000000' }}>সাব-রেজিস্ট্রি দলিল ও ই-নামজারি</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Table 3: জমির পরিমাণ ও সাব-রেজিস্ট্রি দলিলের বিবরণ */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginBottom: '4px', textTransform: 'uppercase' }}>
                  ৩. খতিয়ানভুক্ত জমির পরিমাণ ও সাব-রেজিস্ট্রি বালাম বই সংক্রান্ত রেকর্ড
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '25%', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>মোট খতিয়ানভুক্ত পরিমাণ</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '25%', fontWeight: '800', color: '#000000', fontSize: '13px' }}>{selectedLandForPdf.total_area_decimal} শতক / শতাংশ</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '25%', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>অবশিষ্ট ব্যবহার্য/হস্তান্তরযোগ্য</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '25%', fontWeight: '800', color: '#000000', fontSize: '13px' }}>{selectedLandForPdf.available_area_decimal} শতক / শতাংশ</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>সাব-রেজিস্ট্রি বালাম ভলিউম</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#000000' }}>{selectedLandForPdf.volume_book || 'VOL-KHAS-2026'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>বালাম রেজিস্ট্রি পৃষ্ঠা নং</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#000000' }}>{selectedLandForPdf.page_no || '০১'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>রেজিস্ট্রিকৃত দলিল নম্বর</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#000000' }}>{selectedLandForPdf.deed_no || ('DEED-' + selectedLandForPdf.dag_no + '-2026')}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', background: '#f8fafc', fontWeight: '700', color: '#000000' }}>সাব-রেজিস্ট্রি অফিস কোড</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: '700', color: '#000000' }}>{selectedLandForPdf.sub_registry_code || 'SR-BD-2026'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 5. খতিয়ান সংক্রান্ত সরকারি আইনি ঘোষণা */}
              <div style={{
                border: '1.5px solid #000000',
                padding: '10px 14px',
                marginBottom: '16px',
                background: '#fafafa'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#000000', marginBottom: '4px', textTransform: 'uppercase' }}>
                  ⚖️ খতিয়ান ও মালিকানা সংক্রান্ত সরকারি আইনি ঘোষণা ও প্রত্যয়ন:
                </div>
                <p style={{ fontSize: '11px', color: '#000000', lineHeight: 1.6, margin: 0, textAlign: 'justify', fontWeight: '500' }}>
                  স্টেট একুইজিশন অ্যান্ড টেন্যান্সি অ্যাক্ট, ১৯৫০ এবং দ্য রেজিস্ট্রেশন অ্যাক্ট, ১৯০৮ অনুসারে অত্র খতিয়ানভুক্ত ভূমির মালিকানা ও রেকর্ড ডিজিটাল ডাটাবেজে চূড়ান্তভাবে অনুমোদিত। উক্ত দাগ ও খতিয়ানের ভূমিতে উল্লিখিত নাগরিকের বৈধ ও নিরঙ্কুশ স্বত্বাধিকার সরকারি ডিজিটাল বালাম বইয়ে যথাযথভাবে সংরক্ষণ করা হয়েছে। অত্র দলিলের তথ্য ভূমি মন্ত্রণালয়ের কেন্দ্রীয় ডাটাবেজের সাথে হুবহু সামঞ্জস্যপূর্ণ এবং জমিটি বিক্রয়, হস্তান্তর বা জামানত হিসেবে ব্যবহারের জন্য সম্পূর্ণ দায়মুক্ত ও আইনিভাবে বৈধ।
                </p>
              </div>

              {/* 6. Dual Official Signatures & Seal Section */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '16px',
                paddingTop: '6px'
              }}>
                {/* Left: Sub-Registrar Signature Block */}
                <div style={{
                  border: '1px dashed #000000',
                  padding: '12px',
                  textAlign: 'center',
                  background: '#ffffff'
                }}>
                  <div style={{ fontSize: '10px', color: '#000000', fontWeight: '600', marginBottom: '26px' }}>
                    [ডিজিটাল সিলমোহর ও স্বাক্ষরিত]
                  </div>
                  <div style={{ borderTop: '1px solid #000000', width: '80%', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000' }}>সাব-রেজিস্ট্রার</div>
                  <div style={{ fontSize: '10.5px', color: '#000000' }}>সাব-রেজিস্ট্রি কার্যালয়</div>
                  <div style={{ fontSize: '10px', color: '#000000' }}>নিবন্ধন অধিদপ্তর ও আইন মন্ত্রণালয়</div>
                  <div style={{ fontSize: '9.5px', color: '#000000', marginTop: '2px', fontWeight: '600' }}>বালাম ভলিউম বুক এন্ট্রি সম্পন্ন</div>
                </div>

                {/* Right: AC Land Signature Block */}
                <div style={{
                  border: '1px dashed #000000',
                  padding: '12px',
                  textAlign: 'center',
                  background: '#ffffff'
                }}>
                  <div style={{ fontSize: '10px', color: '#000000', fontWeight: '600', marginBottom: '26px' }}>
                    [অনুমোদিত ও ডিজিটাল সিলমোহরকৃত]
                  </div>
                  <div style={{ borderTop: '1px solid #000000', width: '80%', margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000' }}>সহকারী কমিশনার (ভূমি) / AC Land</div>
                  <div style={{ fontSize: '10.5px', color: '#000000' }}>উপজেলা ভূমি অফিস</div>
                  <div style={{ fontSize: '10px', color: '#000000' }}>ভূমি সংস্কার বোর্ড ও ভূমি মন্ত্রণালয়</div>
                  <div style={{ fontSize: '9.5px', color: '#000000', marginTop: '2px', fontWeight: '600' }}>ই-নামজারি খতিয়ান অনুমোদন সম্পন্ন</div>
                </div>
              </div>

              {/* 7. Live Online Verification QR Code & Hash Block */}
              {(() => {
                const qrId = selectedLandForPdf.qr_code_id || selectedLandForPdf.record_id || selectedLandForPdf._id;
                const verifyUrl = `${window.location.origin}/#/qr-verify/${qrId}`;
                return (
                  <div style={{
                    border: '1.5px solid #000000',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    background: '#ffffff'
                  }}>
                    <div style={{
                      padding: '4px',
                      background: '#ffffff',
                      border: '1px solid #000000',
                      flexShrink: 0
                    }}>
                      <QRCodeSVG
                        value={verifyUrl}
                        size={100}
                        fgColor="#000000"
                        bgColor="#ffffff"
                        level="H"
                      />
                    </div>

                    <div style={{ flex: 1, fontSize: '11px', color: '#000000' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', marginBottom: '3px' }}>
                        📱 অনলাইন সত্যতা যাচাই QR কোড (Live Online Verification)
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#000000', lineHeight: 1.5, marginBottom: '4px' }}>
                        যেকোনো স্মার্টফোনের ক্যামেরা দিয়ে এই QR কোডটি স্ক্যান করলে সরাসরি সরকারি ই-ভূমি পোর্টালে এই খতিয়ান, দলিল ও মালিকানার ডিজিটাল সত্যতা যাচাই করা যাবে।
                      </div>
                      <div style={{ fontSize: '10px', color: '#000000', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        যাচাই লিংক: <span style={{ fontWeight: '700' }}>{verifyUrl}</span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#000000', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '2px' }}>
                        SHA-256 ডিজিটাল ফিঙ্গারপ্রিন্ট: {selectedLandForPdf.deed_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', color: '#000000', fontWeight: '600' }}>
                এটি একটি কম্পিউটার জেনারেটেড ও ডিজিটালি ভেরিফাইড খতিয়ান সনদপত্র · e-ভূমি ডিজিটাল ভূমি সেবা · সর্বস্বত্ব সংরক্ষিত
              </div>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
