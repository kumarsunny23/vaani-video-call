import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ══════════════════════════════════════════════════
   THEME DEFINITIONS
   Ocean  (A) = switch OFF (default)
   Emerald(C) = switch ON
══════════════════════════════════════════════════ */
const OCEAN = {
  bg: `
    radial-gradient(ellipse 65% 55% at 0%   100%, rgba(0,200,180,0.32) 0%, transparent 55%),
    radial-gradient(ellipse 50% 45% at 100% 0%,   rgba(0,136,220,0.26) 0%, transparent 52%),
    radial-gradient(ellipse 45% 55% at 75%  55%,  rgba(0,160,200,0.14) 0%, transparent 58%),
    radial-gradient(ellipse 35% 35% at 15%  15%,  rgba(0,180,200,0.12) 0%, transparent 50%),
    #030d12
  `,
  gridColor:   'rgba(0,200,180,0.06)',
  navBg:       'rgba(3,13,18,0.72)',
  navBorder:   'rgba(0,200,180,0.14)',
  text:        '#e0f8f5',
  muted:       'rgba(180,240,234,0.45)',
  accent:      '#00c8b4',
  accent2:     '#0088dc',
  accentGlow:  'rgba(0,200,180,0.32)',
  accentGlow2: 'rgba(0,136,220,0.28)',
  cardBg:      'rgba(0,200,180,0.07)',
  cardBorder:  'rgba(0,200,180,0.14)',
  imgGlow:     'drop-shadow(0 24px 60px rgba(0,200,180,0.28))',
  switchGlow:  '0 0 10px rgba(0,200,180,0.9), 0 0 22px rgba(0,200,180,0.45)',
  pillBg:      'rgba(0,200,180,0.08)',
  pillBorder:  'rgba(0,200,180,0.18)',
}

const EMERALD = {
  bg: `
    radial-gradient(ellipse 60% 55% at 5%   5%,   rgba(20,200,100,0.30) 0%, transparent 55%),
    radial-gradient(ellipse 55% 50% at 100% 100%,  rgba(0,160,80,0.24)  0%, transparent 52%),
    radial-gradient(ellipse 40% 50% at 70%  40%,   rgba(40,220,120,0.12) 0%, transparent 55%),
    radial-gradient(ellipse 30% 30% at 45%  80%,   rgba(20,180,90,0.08)  0%, transparent 50%),
    #030b08
  `,
  gridColor:   'rgba(20,200,100,0.06)',
  navBg:       'rgba(3,11,8,0.75)',
  navBorder:   'rgba(20,200,100,0.15)',
  text:        '#dff5eb',
  muted:       'rgba(180,240,210,0.45)',
  accent:      '#14c864',
  accent2:     '#0a9048',
  accentGlow:  'rgba(20,200,100,0.35)',
  accentGlow2: 'rgba(10,144,72,0.28)',
  cardBg:      'rgba(20,200,100,0.07)',
  cardBorder:  'rgba(20,200,100,0.15)',
  imgGlow:     'drop-shadow(0 24px 60px rgba(20,200,100,0.28))',
  switchGlow:  '0 0 10px rgba(20,200,100,0.9), 0 0 22px rgba(20,200,100,0.45)',
  pillBg:      'rgba(20,200,100,0.08)',
  pillBorder:  'rgba(20,200,100,0.18)',
}

/* ══════════════════════════════════════════════════
   CUSTOM GLOW SWITCH
══════════════════════════════════════════════════ */
function GlowSwitch({ checked, onChange, t }) {
  return (
    <div
      onClick={onChange}
      style={{
        position: 'relative',
        width: '52px',
        height: '28px',
        borderRadius: '99px',
        background: checked
          ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})`
          : 'rgba(255,255,255,0.08)',
        border: `1.5px solid ${checked ? t.accent : 'rgba(255,255,255,0.12)'}`,
        cursor: 'pointer',
        transition: 'all 0.38s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: checked ? t.switchGlow : 'none',
        flexShrink: 0,
      }}
    >
      {/* Thumb */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          boxShadow: checked
            ? `0 0 8px ${t.accentGlow}, 0 2px 6px rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.45)',
          transition: 'left 0.34s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner glow dot */}
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: checked ? t.accent : 'rgba(0,0,0,0.12)',
            boxShadow: checked ? `0 0 5px ${t.accentGlow}` : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   FEATURE PILL
══════════════════════════════════════════════════ */
function Pill({ label, t }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '0.8rem',
      fontWeight: 500,
      color: t.muted,
      background: t.pillBg,
      border: `1px solid ${t.pillBorder}`,
      padding: '0.35rem 0.88rem',
      borderRadius: '99px',
      transition: 'all 0.35s ease',
    }}>
      {label}
    </span>
  )
}

/* ══════════════════════════════════════════════════
   NAV LINK BUTTON
══════════════════════════════════════════════════ */
function NavBtn({ children, onClick, t }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? t.cardBg : 'none',
        border: 'none',
        color: hover ? t.text : t.muted,
        fontSize: '0.9rem',
        fontWeight: 500,
        padding: '0.42rem 0.9rem',
        borderRadius: '99px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.22s ease',
      }}
    >
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useNavigate()
  const [isEmerald, setIsEmerald] = useState(false)
  const [ctaHover, setCtaHover] = useState(false)
  const [loginHover, setLoginHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth < 1024)
      if (window.innerWidth >= 768) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const t = isEmerald ? EMERALD : OCEAN

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
      color: t.text,
      background: t.bg,
      transition: 'background 0.6s ease, color 0.4s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Grid overlay ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(${t.gridColor} 1px, transparent 1px),
          linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)',
        transition: 'background-image 0.6s ease',
      }} />

      {/* ══ NAVBAR ══════════════════════════════════ */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.75rem 1.25rem' : '0.85rem 3rem',
        background: t.navBg,
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderBottom: `1px solid ${t.navBorder}`,
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}>

        {/* Logo */}
        <div
          onClick={() => router('/')}
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: isMobile ? '1.35rem' : '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            cursor: 'pointer',
            color: '#ffffff',
            display: 'inline-block',
          }}
        >
         <span onClick={() => router('/')}>Video Vaani</span> 
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <NavBtn onClick={() => router('/aljk23')} t={t}>Join as Guest</NavBtn>
            <NavBtn onClick={() => router('/auth')} t={t}>Register</NavBtn>

            {/* Theme Switch pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 12px 5px 10px',
              background: t.cardBg, border: `1px solid ${t.cardBorder}`,
              borderRadius: '99px', transition: 'all 0.4s ease', margin: '0 4px',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 5-4 7 0"
                  stroke={!isEmerald ? OCEAN.accent : 'rgba(255,255,255,0.22)'}
                  strokeWidth="2.2" strokeLinecap="round"
                  style={{ transition: 'stroke 0.35s ease' }} />
              </svg>
              <GlowSwitch checked={isEmerald} onChange={() => setIsEmerald(p => !p)} t={t} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                  stroke={isEmerald ? EMERALD.accent : 'rgba(255,255,255,0.22)'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.35s ease' }} />
                <path d="M12 22V12"
                  stroke={isEmerald ? EMERALD.accent : 'rgba(255,255,255,0.22)'}
                  strokeWidth="2" strokeLinecap="round"
                  style={{ transition: 'stroke 0.35s ease' }} />
              </svg>
            </div>

            <button
              onClick={() => router('/auth')}
              onMouseEnter={() => setLoginHover(true)}
              onMouseLeave={() => setLoginHover(false)}
              style={{
                background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
                border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                padding: '0.5rem 1.4rem', borderRadius: '99px', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                boxShadow: `0 4px 20px ${t.accentGlow}`,
                transform: loginHover ? 'translateY(-2px)' : 'none',
                opacity: loginHover ? 0.9 : 1, transition: 'all 0.25s ease',
              }}
            >Login</button>
          </div>
        )}

        {/* Mobile nav right: switch + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Compact switch */}
            <GlowSwitch checked={isEmerald} onChange={() => setIsEmerald(p => !p)} t={t} />

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(p => !p)}
              style={{
                background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                borderRadius: '10px', padding: '7px 9px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block', width: '18px', height: '2px',
                  background: t.text, borderRadius: '99px',
                  transition: 'all 0.3s ease',
                  transform: menuOpen
                    ? i === 0 ? 'rotate(45deg) translate(4px, 4px)'
                    : i === 2 ? 'rotate(-45deg) translate(4px, -4px)'
                    : 'scaleX(0)'
                    : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'sticky',
          top: '56px',
          zIndex: 99,
          background: t.navBg,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: `1px solid ${t.navBorder}`,
          padding: '1rem 1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          animation: 'slideDown 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {[
            { label: 'Join as Guest', path: '/aljk23' },
            { label: 'Register', path: '/auth' },
          ].map(item => (
            <button key={item.label} onClick={() => { router(item.path); setMenuOpen(false) }}
              style={{
                background: 'none', border: 'none', color: t.muted,
                fontSize: '0.95rem', fontWeight: 500, padding: '0.6rem 0.5rem',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', transition: 'all 0.2s ease',
                borderBottom: `1px solid ${t.navBorder}`,
              }}
            >{item.label}</button>
          ))}
          <button onClick={() => { router('/auth'); setMenuOpen(false) }}
            style={{
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
              border: 'none', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
              padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'inherit', marginTop: '0.25rem',
              boxShadow: `0 4px 16px ${t.accentGlow}`,
            }}
          >Login</button>
        </div>
      )}

      {/* ══ HERO ════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : isTablet ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile
          ? '2.5rem 1.5rem 3rem'
          : isTablet
          ? '3rem 2.5rem 3.5rem'
          : 'clamp(3rem,6vw,5rem) clamp(2rem,8vw,6rem) 4rem',
        height: isMobile ? 'auto' : 'calc(100vh - 66px)',
        maxHeight: isMobile ? 'none' : 'calc(100vh - 66px)',
        gap: isMobile ? '2.5rem' : '3rem',
        textAlign: (isMobile || isTablet) ? 'center' : 'left',
      }}>

        {/* ── Left: copy ── */}
        <div style={{
          flex: '1 1 300px',
          maxWidth: (isMobile || isTablet) ? '100%' : '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: (isMobile || isTablet) ? 'center' : 'flex-start',
        }}>

          {/* Eyebrow */}
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: t.accent,
            marginBottom: '1rem',
            opacity: 0.92,
            transition: 'color 0.5s ease',
          }}>
            ✦ Video Meetings Reimagined
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: isMobile ? '2.2rem' : 'clamp(2.4rem,4.5vw,4rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.04em',
            color: t.text,
            margin: '0 0 1.1rem',
            transition: 'color 0.4s ease',
          }}>
            <span style={{
              display: 'inline-block',
              color: t.accent,
              transition: 'color 0.5s ease',
            }}>Connect</span>
            {' '}with your{isMobile ? ' ' : <br />}loved Ones
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: t.muted,
            lineHeight: 1.65,
            margin: '0 0 2rem',
            maxWidth: isMobile ? '320px' : 'none',
            transition: 'color 0.4s ease',
          }}>
            Cover a distance by Apna Video Call — crystal-clear,
            zero friction, anytime anywhere.
          </p>

          {/* CTA */}
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <button
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
                border: 'none', color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: 700,
                padding: isMobile ? '0.8rem 2rem' : '0.9rem 2.4rem',
                borderRadius: '99px', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                boxShadow: ctaHover
                  ? `0 14px 44px ${t.accentGlow}, 0 6px 24px ${t.accentGlow2}`
                  : `0 8px 32px ${t.accentGlow}, 0 4px 16px ${t.accentGlow2}`,
                transform: ctaHover ? 'translateY(-3px)' : 'none',
                transition: 'all 0.28s ease',
              }}
            >
              Get Started →
            </button>
          </Link>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '1.75rem',
            justifyContent: (isMobile || isTablet) ? 'center' : 'flex-start',
          }}>
            {['🎥 HD Video', '🔒 Encrypted', '💬 Live Chat', '🖥️ Screen Share'].map(f => (
              <Pill key={f} label={f} t={t} />
            ))}
          </div>
        </div>

        {/* ── Right: image ── */}
        <div style={{
          flex: '1 1 260px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '260px' : isTablet ? '320px' : 'none',
          margin: (isMobile || isTablet) ? '0 auto' : '0',
        }}>
          <div style={{
            position: 'absolute',
            inset: '-32px',
            background: `radial-gradient(ellipse 70% 65% at center, ${t.accentGlow} 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            transition: 'background 0.6s ease',
            opacity: 0.5,
          }} />
          <img
            src="/mobile.png"
            alt="App preview"
            style={{
              maxWidth: isMobile ? '220px' : isTablet ? '300px' : '340px',
              width: '100%',
              position: 'relative',
              zIndex: 1,
              filter: t.imgGlow,
              transition: 'filter 0.5s ease, transform 0.3s ease',
              borderRadius: '20px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04) translateY(-6px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)' }}
          />
        </div>

      </div>
    </div>
  )
}