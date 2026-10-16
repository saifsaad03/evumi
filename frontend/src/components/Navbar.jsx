import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Home, LogIn, LogOut, UserPlus, LayoutDashboard, Menu, X, ShieldCheck, MapPin, FileText } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, getDashboardRoute } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
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
      }}>
        {/* Logo with Bangladesh Land Seal */}
        <NavLink 
          to="/" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <img 
            src="/images/logo.png" 
            alt="e-ভূমি লোগো" 
            style={{
              width: '44px',
              height: '44px',
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

        {/* Auth Section & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Dashboard Link */}
              <NavLink
                to={getDashboardRoute(user.role)}
                onClick={() => setMobileMenuOpen(false)}
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

              {/* Logout Button */}
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
                <LogIn size={14} /> লগইন
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

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="মোবাইল মেনু"
            style={{
              display: 'none',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '7px',
              cursor: 'pointer',
              color: '#0f172a'
            }}
            className="show-on-mobile-flex"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#0f172a',
              fontWeight: '600',
              background: location.pathname === '/' ? '#f0fdf4' : 'transparent',
              border: location.pathname === '/' ? '1px solid #bbf7d0' : 'none'
            }}
          >
            <Home size={16} color="#047857" /> <span>হোম পেজ</span>
          </NavLink>

          <NavLink
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#0f172a',
              fontWeight: '600',
              background: location.pathname === '/verify' ? '#f0fdf4' : 'transparent',
              border: location.pathname === '/verify' ? '1px solid #bbf7d0' : 'none'
            }}
          >
            <Search size={16} color="#047857" /> <span>জমি যাচাই ও অ্যান্টি-ডাবল সেলিং</span>
          </NavLink>

          {!user && (
            <NavLink
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#0f172a',
                fontWeight: '600',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <UserPlus size={16} color="#0284c7" /> <span>নতুন নাগরিক অ্যাকাউন্ট তৈরি</span>
            </NavLink>
          )}

          {user && (
            <div style={{
              marginTop: '4px',
              padding: '10px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: roleBadge.color,
                background: roleBadge.bg,
                border: `1px solid ${roleBadge.border}`,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {roleBadge.label}
              </span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
