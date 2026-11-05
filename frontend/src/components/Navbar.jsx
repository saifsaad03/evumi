import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Home,
  LogIn,
  LogOut,
  UserPlus,
  LayoutDashboard,
  Menu,
  X,
  ShieldCheck,
  MapPin,
  FileText,
  PhoneCall,
  Layers,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Clock,
  AlertTriangle,
  FileCheck,
  User,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { useDashboardNav } from '../context/DashboardNavContext';

export default function Navbar() {
  const location = useLocation();

  // Hide the global public navbar on admin dashboard to allow the dedicated admin top bar
  if (location.pathname === '/admin/dashboard' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const navigate = useNavigate();
  const { user, logout, getDashboardRoute } = useAuth();
  const { dashboardNav } = useDashboardNav();

  // Listen for custom trigger to open off-canvas sidebar from any mobile button
  useEffect(() => {
    const handleCustomOpen = () => openSidebar();
    window.addEventListener('open-evumi-sidebar', handleCustomOpen);
    return () => window.removeEventListener('open-evumi-sidebar', handleCustomOpen);
  }, []);

  // Right-to-Left IN and Left-to-Right OUT Off-Canvas Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const openSidebar = () => {
    setSidebarVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSidebarOpen(true);
      });
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => {
      setSidebarVisible(false);
    }, 320);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Lock body and html scroll when sidebar drawer is open to prevent background scrolling
  useEffect(() => {
    if (sidebarVisible) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [sidebarVisible]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  const handleNavigate = (path) => {
    closeSidebar();
    navigate(path);
  };

  const handleSectionScroll = (sectionId) => {
    closeSidebar();
    if (location.pathname === '/') {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 330);
    } else {
      navigate('/#' + sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 450);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return { label: 'মন্ত্রণালয় এডমিন', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' };
      case 'Register Office':
        return { label: 'সাব-রেজিস্ট্রি', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
      case 'AC Land Office':
        return { label: 'এসি ল্যান্ড', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
      case 'User':
      default:
        return { label: 'নাগরিক', color: '#92400e', bg: '#fef3c7', border: '#fde68a' };
    }
  };

  const roleBadge = user ? getRoleBadge(user.role) : null;

  // Helper to determine active dashboard items for mobile menu
  const isCurrentOnDashboard = location.pathname.startsWith('/user') ||
    location.pathname.startsWith('/register-office') ||
    location.pathname.startsWith('/ac-land') ||
    location.pathname.startsWith('/admin');

  const getRoleDefaultNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'User':
        return [
          { id: 'lands', label: 'আমার অনুমোদিত জমি', icon: FileText },
          { id: 'claim_ownership', label: 'মালিকানা দাবি করুন', icon: FileCheck },
          { id: 'pending', label: 'পর্যালোচনাধীন আবেদন', icon: Clock },
          { id: 'sold', label: 'বিক্রিত জমির ইতিহাস', icon: AlertTriangle },
          { id: 'verify', label: 'জমি ও খতিয়ান যাচাই', icon: Search },
          { id: 'profile', label: 'নাগরিক প্রোফাইল', icon: User },
        ];
      case 'Register Office':
        return [
          { id: 'assign', label: 'সরকারি জমি বরাদ্দ ও বন্দোবস্ত', icon: Layers },
          { id: 'deed_registry', label: 'দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং', icon: FileText },
          { id: 'bonton_nama', label: 'যৌথ ওয়ারিশান বণ্টননামা', icon: Users },
          { id: 'requests', label: 'প্রেরিত আবেদনের হালনাগাদ', icon: Clock },
          { id: 'claims', label: 'নাগরিক মালিকানা দাবি ও আপত্তি', icon: ShieldAlert },
          { id: 'profile', label: 'রেজিস্ট্রার কার্যালয় প্রোফাইল', icon: Building2 },
        ];
      case 'AC Land Office':
        return [
          { id: 'mutations', label: 'ই-নামজারি ও মিউটেশন আবেদন', icon: FileText },
          { id: 'bontonnama_abedon', label: 'BONTONNAMA ABEDON (বণ্টননামা)', icon: Users },
          { id: 'assign_requests', label: 'সরকারি জমি বরাদ্দ আবেদন', icon: Layers },
          { id: 'profile', label: 'এসি ল্যান্ড অফিস প্রোফাইল', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const displayNavItems = (dashboardNav?.navItems && dashboardNav.navItems.length > 0)
    ? dashboardNav.navItems
    : getRoleDefaultNavItems();

  const handleDashboardTabClick = (item) => {
    closeSidebar();
    const currentRoleDashboard = getDashboardRoute(user?.role);
    if (location.pathname === currentRoleDashboard && dashboardNav?.onTabChange) {
      dashboardNav.onTabChange(item.id);
    } else {
      navigate(`${currentRoleDashboard}?tab=${item.id}`);
    }
  };


  return (
    <nav style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
    }}>

      {/* Main Navigation Bar */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px',
        boxSizing: 'border-box'
      }}>
        {/* Logo with Bangladesh Land Seal */}
        <NavLink 
          to="/" 
          onClick={closeSidebar}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <img 
            src="/images/logo.png" 
            alt="e-ভূমি লোগো" 
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#065f46', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                e-ভূমি
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.2, fontWeight: '500' }}>
              ডিজিটাল ভূমি সেবা ও ই-নামজারি
            </div>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user?.role !== 'Super Admin' && (
            <>
              <NavLink
                to="/"
                className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
              >
                <Home size={15} /> <span>হোম</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={location.pathname === '/verify' ? 'nav-link active' : 'nav-link'}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
              >
                <Search size={15} /> <span>জমি যাচাই ও অ্যান্টি-ডাবল সেলিং</span>
              </NavLink>
            </>
          )}

          {user?.role === 'Register Office' && (
            <NavLink
              to="/register-office/dashboard"
              className={location.pathname === '/register-office/dashboard' ? 'nav-link active' : 'nav-link'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#1d4ed8' }}
            >
              <FileText size={15} /> <span>দলিল নিবন্ধন ও অ্যান্টি-ডাবল সেলিং</span>
            </NavLink>
          )}

          {user?.role === 'AC Land Office' && (
            <NavLink
              to="/ac-land/dashboard"
              className={location.pathname === '/ac-land/dashboard' ? 'nav-link active' : 'nav-link'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#047857' }}
            >
              <FileText size={15} /> <span>ই-নামজারি ও মিউটেশন</span>
            </NavLink>
          )}
        </div>

        {/* Auth Section & Right-to-Left Sliding Sidebar Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Dashboard Link */}
              <NavLink
                to={getDashboardRoute(user.role)}
                onClick={closeSidebar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  boxShadow: '0 1px 3px rgba(6,95,70,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                <LayoutDashboard size={15} /> <span>ড্যাশবোর্ড</span>
              </NavLink>

              {/* User Role Badge (Desktop) */}
              <div className="hide-on-mobile" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: roleBadge.color,
                    background: roleBadge.bg,
                    border: `1px solid ${roleBadge.border}`,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '1px',
                  }}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              {/* Quick Logout Button */}
              <button
                onClick={handleLogout}
                title="লগআউট করুন"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavLink
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #065f46, #047857)',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(6,95,70,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                <LogIn size={14} /> <span>লগইন</span>
              </NavLink>

              <NavLink
                to="/register"
                className="hide-on-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#334155',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserPlus size={14} /> <span>নিবন্ধন</span>
              </NavLink>
            </div>
          )}

          {/* ── 3-Line Hamburger Menu: Strictly hidden on Desktop (>= 1024px), Visible ONLY on Mobile (< 1024px) ── */}
          <button
            onClick={openSidebar}
            title="সাইডবার মেনু খুলুন"
            aria-label="সাইডবার মেনু"
            className="show-on-mobile-hamburger"
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#0f172a',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: '700',
              transition: 'all 0.18s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <Menu size={17} color="#047857" />
            <span style={{ fontSize: '13px' }}>মেনু</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          OFF-CANVAS RIGHT SIDEBAR (Rendered via React Portal directly into body)
          This guarantees top layer z-index on mobile without stacking context issues!
          Animation:
          • Opening: Right-to-Left IN (translateX(100%) -> translateX(0))
          • Closing: Left-to-Right OUT (translateX(0) -> translateX(100%))
          ══════════════════════════════════════════════════════════════════ */}
      {sidebarVisible && typeof document !== 'undefined' && createPortal(
        <div
          id="evumi-public-sidebar-portal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 2147483647, // Maximum integer z-index to stay on top of all mobile layers
            display: 'flex',
            justifyContent: 'flex-end',
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            isolation: 'isolate'
          }}
        >
          {/* Backdrop (Dark blur overlay) */}
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              opacity: sidebarOpen ? 1 : 0,
              transition: 'opacity 0.28s ease',
              cursor: 'pointer'
            }}
          />

          {/* Sliding Sidebar Panel */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            height: '100%',
            maxHeight: '100dvh',
            background: '#ffffff',
            boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 1,
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            {/* Header: Logo, Title & Close Button */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/images/logo.png" 
                  alt="e-ভূমি লোগো" 
                  style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
                />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#065f46', lineHeight: 1.1 }}>
                    e-ভূমি বাংলাদেশ
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>
                    সাইডবার মেনু ও সেকশন তালিকা
                  </div>
                </div>
              </div>

              {/* Close Button (X) */}
              <button
                onClick={closeSidebar}
                title="মেনু বন্ধ করুন (Close)"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Profile Card if Logged In */}
              {user && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ede9fe 100%)',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: '#ffffff',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      {user.name ? user.name.charAt(0) : 'ম'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: roleBadge.color,
                    background: roleBadge.bg,
                    border: `1px solid ${roleBadge.border}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap'
                  }}>
                    {roleBadge.label}
                  </span>
                </div>
              )}

              {/* ── Category 1: Active Dashboard Menus (Prominently shown on Mobile) ── */}
              {user && displayNavItems.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                    paddingRight: '4px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#065f46',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <LayoutDashboard size={13} color="#059669" />
                      <span>{dashboardNav?.title || 'ড্যাশবোর্ড মেনু ও সেকশন তালিকা'}</span>
                    </div>
                    {displayNavItems.length > 0 && (
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                        {displayNavItems.length} টি বিভাগ
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {displayNavItems.map((item) => {
                      const ItemIcon = item.icon || Layers;
                      const isActive = isCurrentOnDashboard && (
                        dashboardNav?.activeTab ? dashboardNav.activeTab === item.id : false
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleDashboardTabClick(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 12px',
                            borderRadius: '10px',
                            background: isActive ? 'linear-gradient(135deg, #065f46, #059669)' : '#ffffff',
                            border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                            color: isActive ? '#ffffff' : '#0f172a',
                            fontSize: '13px',
                            fontWeight: isActive ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: isActive ? '0 4px 12px rgba(6, 95, 70, 0.25)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.16s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <ItemIcon size={16} color={isActive ? '#ffffff' : '#047857'} style={{ flexShrink: 0 }} />
                            <span style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {item.badge !== undefined && item.badge !== null && (
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: '800',
                                padding: '1px 7px',
                                borderRadius: '999px',
                                background: isActive ? 'rgba(255,255,255,0.25)' : (item.badgeBg || '#ecfdf5'),
                                color: isActive ? '#ffffff' : (item.badgeColor || '#065f46'),
                                border: isActive ? '1px solid rgba(255,255,255,0.4)' : '1px solid #a7f3d0'
                              }}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight size={14} color={isActive ? '#ffffff' : '#94a3b8'} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Category 2: Public Navigation Links ── */}
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  paddingLeft: '4px'
                }}>
                  {user ? 'অন্যান্য পাবলিক পেজসমূহ (Pages)' : 'প্রধান পেজসমূহ (Pages)'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Home */}
                  <button
                    onClick={() => handleNavigate('/')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: location.pathname === '/' ? '#f0fdf4' : '#f8fafc',
                      border: location.pathname === '/' ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                      color: location.pathname === '/' ? '#065f46' : '#0f172a',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Home size={16} color={location.pathname === '/' ? '#047857' : '#64748b'} />
                      <span>হোম ও ল্যান্ডিং পেজ</span>
                    </div>
                    <ChevronRight size={15} color="#94a3b8" />
                  </button>

                  {/* Verify Land */}
                  <button
                    onClick={() => handleNavigate('/verify')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: location.pathname === '/verify' ? '#f0fdf4' : '#f8fafc',
                      border: location.pathname === '/verify' ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                      color: location.pathname === '/verify' ? '#065f46' : '#0f172a',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Search size={16} color={location.pathname === '/verify' ? '#047857' : '#64748b'} />
                      <span>জমি যাচাই ও অ্যান্টি-ডাবল সেলিং</span>
                    </div>
                    <ChevronRight size={15} color="#94a3b8" />
                  </button>

                  {/* Dashboard (if user logged in) */}
                  {user ? (
                    <button
                      onClick={() => handleNavigate(getDashboardRoute(user.role))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#f5f3ff',
                        border: '1.5px solid #ddd6fe',
                        color: '#6d28d9',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LayoutDashboard size={16} color="#7c3aed" />
                        <span>আমার ড্যাশবোর্ড প্যানেল</span>
                      </div>
                      <ChevronRight size={15} color="#a78bfa" />
                    </button>
                  ) : (
                    <>
                      {/* Login Page */}
                      <button
                        onClick={() => handleNavigate('/login')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: location.pathname === '/login' ? '#eff6ff' : '#f8fafc',
                          border: location.pathname === '/login' ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                          color: location.pathname === '/login' ? '#1d4ed8' : '#0f172a',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <LogIn size={16} color={location.pathname === '/login' ? '#1d4ed8' : '#64748b'} />
                          <span>নাগরিক / কর্মকর্তা লগইন</span>
                        </div>
                        <ChevronRight size={15} color="#94a3b8" />
                      </button>

                      {/* Register Page */}
                      <button
                        onClick={() => handleNavigate('/register')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: location.pathname === '/register' ? '#eff6ff' : '#f8fafc',
                          border: location.pathname === '/register' ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                          color: location.pathname === '/register' ? '#0369a1' : '#0f172a',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserPlus size={16} color={location.pathname === '/register' ? '#0284c7' : '#64748b'} />
                          <span>নতুন নাগরিক অ্যাকাউন্ট নিবন্ধন</span>
                        </div>
                        <ChevronRight size={15} color="#94a3b8" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Category 2: Landing Page Sections ── */}
              {/* Only shown on Home/Landing page (location.pathname === '/'), NOT on login/register pages */}
              {location.pathname !== '/login' && location.pathname !== '/register' && (
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    paddingLeft: '4px'
                  }}>
                    ল্যান্ডিং পেজ সেকশনসমূহ (Sections)
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { id: 'features', label: 'ক্রিপ্টোগ্রাফিক ও সিস্টেম আপগ্রেড', icon: Sparkles, color: '#047857' },
                      { id: 'workflow', label: '৬-ধাপের স্বয়ংক্রিয় সেবা পাইপলাইন', icon: Layers, color: '#0284c7' },
                      { id: 'roles', label: '৪টি স্বতন্ত্র প্রশাসনিক ড্যাশবোর্ড', icon: ShieldCheck, color: '#7c3aed' },
                      { id: 'security', label: 'কেন e-ভূমি প্ল্যাটফর্ম অনন্য ও সুরক্ষিত', icon: Award, color: '#b45309' },
                      { id: 'guide', label: 'প্ল্যাটফর্ম ব্যবহারের ভিডিও নির্দেশিকা', icon: FileText, color: '#475569' },
                      { id: 'helpline', label: 'স্মার্ট ভূমি সেবা হেল্পলাইন (১৬১২২)', icon: PhoneCall, color: '#dc2626' }
                    ].map((sec) => {
                      const SecIcon = sec.icon;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => handleSectionScroll(sec.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#1e293b',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <SecIcon size={15} color={sec.color} />
                            <span>{sec.label}</span>
                          </div>
                          <ChevronRight size={14} color="#94a3b8" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions: Login/Logout & Hotline */}
            <div style={{
              padding: '14px 18px',
              borderTop: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexShrink: 0
            }}>
              {user ? (
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogOut size={15} /> <span>লগআউট করুন</span>
                </button>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleNavigate('/login')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #065f46, #047857)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(6,95,70,0.2)'
                    }}
                  >
                    <LogIn size={14} /> <span>লগইন</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('/register')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <UserPlus size={14} /> <span>নিবন্ধন</span>
                  </button>
                </div>
              )}

              {/* Official Hotline Strip */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: '700' }}>
                  <PhoneCall size={14} color="#059669" />
                  <span>ভূমি সেবা হটলাইন</span>
                </div>
                <span style={{ fontWeight: '900', color: '#047857', fontSize: '13px' }}>১৬১২২ (টোল ফ্রি)</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
