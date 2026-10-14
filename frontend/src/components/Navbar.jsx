import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Home, LogIn, LogOut, UserPlus, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, getDashboardRoute } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 2px 8px rgba(26,107,60,0.3)',
            flexShrink: 0,
          }}>🏛️</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>e-ভূমি</div>
            <div className="hide-on-mobile" style={{ fontSize: '10px', color: '#64748b', lineHeight: 1, fontWeight: '500' }}>ডিজিটাল ভূমি প্রশাসন</div>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <NavLink
            to="/"
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Home size={14} /> <span className="hide-on-mobile">হোম</span>
          </NavLink>

          <NavLink
            to="/verify"
            className={location.pathname === '/verify' ? 'nav-link active' : 'nav-link'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Search size={14} /> <span>যাচাই</span>
          </NavLink>
        </div>

        {/* Auth Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Dashboard Link */}
              <NavLink
                to={getDashboardRoute(user.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#15803d',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <LayoutDashboard size={14} /> <span>ড্যাশবোর্ড</span>
              </NavLink>

              {/* User Role Badge */}
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
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: roleBadge.color,
                    background: roleBadge.bg,
                    border: `1px solid ${roleBadge.border}`,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '1px',
                  }}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="লগআউট করুন"
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '7px 9px',
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
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <NavLink
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1a6b3c, #16a34a)',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 2px 6px rgba(26,107,60,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                <LogIn size={13} /> লগইন
              </NavLink>

              <NavLink
                to="/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  color: '#334155',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserPlus size={13} /> <span className="hide-on-mobile">নিবন্ধন</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
