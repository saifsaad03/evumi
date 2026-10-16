import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LogOut, ShieldCheck, ChevronRight,
  Headphones, Building2, UserCheck, Layers
} from 'lucide-react';

export default function DashboardLayout({
  title,
  subtitle,
  badge,
  icon: Icon,
  roleTheme = 'green', // 'green' | 'blue' | 'amber' | 'purple'
  stats = [],
  navItems = [],
  activeTab,
  onTabChange,
  headerActions,
  children
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getThemeStyles = () => {
    switch (roleTheme) {
      case 'blue':
        return {
          bannerGradient: 'linear-gradient(135deg, #1e40af, #2563eb)',
          bannerBorder: '#3b82f6',
          activeNavBg: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          activeNavColor: '#ffffff',
          activeNavShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
          badgeBg: '#eff6ff',
          badgeColor: '#1d4ed8',
          badgeBorder: '#bfdbfe',
          avatarBg: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        };
      case 'amber':
        return {
          bannerGradient: 'linear-gradient(135deg, #b45309, #d97706)',
          bannerBorder: '#f59e0b',
          activeNavBg: 'linear-gradient(135deg, #b45309, #d97706)',
          activeNavColor: '#ffffff',
          activeNavShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
          badgeBg: '#fffbeb',
          badgeColor: '#b45309',
          badgeBorder: '#fde68a',
          avatarBg: 'linear-gradient(135deg, #b45309, #f59e0b)',
        };
      case 'purple':
        return {
          bannerGradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
          bannerBorder: '#a78bfa',
          activeNavBg: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
          activeNavColor: '#ffffff',
          activeNavShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
          badgeBg: '#f5f3ff',
          badgeColor: '#6d28d9',
          badgeBorder: '#ddd6fe',
          avatarBg: 'linear-gradient(135deg, #6d28d9, #a855f7)',
        };
      case 'green':
      default:
        return {
          bannerGradient: 'linear-gradient(135deg, #065f46, #059669)',
          bannerBorder: '#10b981',
          activeNavBg: 'linear-gradient(135deg, #065f46, #059669)',
          activeNavColor: '#ffffff',
          activeNavShadow: '0 4px 14px rgba(6, 95, 70, 0.35)',
          badgeBg: '#ecfdf5',
          badgeColor: '#065f46',
          badgeBorder: '#a7f3d0',
          avatarBg: 'linear-gradient(135deg, #065f46, #10b981)',
        };
    }
  };

  const theme = getThemeStyles();
  const currentNav = navItems.find((item) => item.id === activeTab);

  // Sidebar content component (rendered both in desktop sticky and mobile drawer)
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* User Mini Profile Card */}
      <div style={{
        padding: '18px 16px',
        borderRadius: '14px',
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: theme.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '900',
          fontSize: '18px',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}>
          {user?.name ? user.name.charAt(0) : 'U'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#0f172a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2
          }}>
            {user?.name || 'ব্যবহারকারী'}
          </div>
          <div style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: '800',
            background: theme.badgeBg,
            color: theme.badgeColor,
            border: `1px solid ${theme.badgeBorder}`,
            padding: '2px 8px',
            borderRadius: '999px',
            marginTop: '4px'
          }}>
            {badge?.label || user?.role || 'নাগরিক'}
          </div>
          {user?.nid && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
              NID: {user.nid}
            </div>
          )}
          {user?.office_details?.office_name && (
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              marginTop: '2px',
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.office_details.office_name}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#475569',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          padding: '0 8px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>ড্যাশবোর্ড মেনু</span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>
            {navItems.length} টি বিভাগ
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const ItemIcon = item.icon || Layers;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid transparent' : '1px solid #e2e8f0',
                  background: isActive ? theme.activeNavBg : '#ffffff',
                  color: isActive ? theme.activeNavColor : '#0f172a',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? theme.activeNavShadow : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <ItemIcon size={17} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.85 }} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.badge !== undefined && item.badge !== null && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: isActive ? 'rgba(255,255,255,0.25)' : (item.badgeBg || '#e2e8f0'),
                      color: isActive ? '#ffffff' : (item.badgeColor || '#0f172a'),
                      minWidth: '22px',
                      textAlign: 'center'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.8 }} />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div style={{
        marginTop: 'auto',
        padding: '14px',
        borderRadius: '12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
          <ShieldCheck size={15} color="#059669" />
          <span>সুরক্ষিত সরকারি নেটওয়ার্ক</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
          <Headphones size={15} color="#0284c7" />
          <span>ভূমি সেবা হেল্পলাইন: <strong>১৬১২২</strong></span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: '4px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: '#fee2e2',
            border: '1.5px solid #fecaca',
            color: '#b91c1c',
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fecaca';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fee2e2';
          }}
        >
          <LogOut size={14} />
          <span>লগআউট করুন</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#e8edf2', color: '#0f172a', paddingBottom: '50px' }}>
      
      {/* ── Top Role Banner ─────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1.5px solid #cbd5e1',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          {/* Title & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {Icon && (
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: theme.bannerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                flexShrink: 0
              }}>
                <Icon size={24} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {title}
                </h1>
                {badge && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    background: theme.badgeBg,
                    color: theme.badgeColor,
                    border: `1px solid ${theme.badgeBorder}`,
                  }}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '3px 0 0 0', fontWeight: '500' }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Quick Header Stats / Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  textAlign: 'center',
                  minWidth: '95px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: '900', color: stat.color || '#0f172a' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                  {stat.label}
                </div>
              </div>
            ))}

            {headerActions}
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Toggle Bar (< 1024px) ──────────── */}
      <div className="show-on-mobile-flex" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        borderBottom: '1.5px solid #cbd5e1',
        padding: '10px 20px',
        position: 'sticky',
        top: '62px',
        zIndex: 90,
      }}>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme.badgeBg,
            border: `1.5px solid ${theme.badgeBorder}`,
            color: theme.badgeColor,
            fontWeight: '700',
            fontSize: '13px',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Menu size={16} />
          <span>ড্যাশবোর্ড মেনু ({currentNav?.label || 'মেনু'})</span>
        </button>

        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
          {currentNav?.label}
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer (< 1024px) ─────────────────── */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Drawer Card */}
          <div style={{
            position: 'relative',
            width: '310px',
            maxWidth: '85vw',
            height: '100%',
            background: '#ffffff',
            boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 10000,
            animation: 'slideInLeft 0.25s ease-out',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '12px'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                মেনু প্যানেল
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#0f172a'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Main Layout (Desktop: Side by Side) ──────────────── */}
      <div style={{
        maxWidth: '1440px',
        margin: '24px auto 0',
        padding: '0 20px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
      }}>
        {/* Desktop Sticky Sidebar (Hidden on mobile) */}
        <aside className="hide-on-mobile" style={{
          width: '280px',
          flexShrink: 0,
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #cbd5e1',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
          position: 'sticky',
          top: '80px',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
        }}>
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

    </div>
  );
}
