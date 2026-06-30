import React from 'react';
import { ESTADO_CONFIG } from "../../utils/helpers";
import ReactDOM from 'react-dom';

/* ── EstadoBadge ─────────────────────────────────────────────── */
export function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, color: '#768999', bg: 'rgba(118,137,153,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg, letterSpacing: '0.04em',
      fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0, animation: estado === 'EN_PROCESO' ? 'pulse 1.5s infinite' : 'none' }} />
      {cfg.label}
    </span>
  );
}

/* ── Btn ─────────────────────────────────────────────────────── */
export function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style = {}, icon, loading }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.02em',
    borderRadius: 6, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.45 : 1, transition: 'all .15s',
    border: '1px solid transparent',
  };
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 11 },
    md: { padding: '7px 16px', fontSize: 12 },
    lg: { padding: '10px 22px', fontSize: 13 },
  };
  const variants = {
    primary: { background: 'var(--green)',    color: '#000',             borderColor: 'var(--green)' },
    ghost:   { background: 'transparent',     color: 'var(--txt-2)',     borderColor: 'var(--border-2)' },
    danger:  { background: 'var(--red-bg)',   color: 'var(--red)',       borderColor: 'rgba(248,81,73,0.3)' },
    yellow:  { background: 'var(--yellow-bg)',color: 'var(--yellow)',    borderColor: 'rgba(227,179,65,0.3)' },
    blue:    { background: 'var(--blue-bg)',  color: 'var(--blue)',      borderColor: 'rgba(88,166,255,0.3)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {loading ? <Spinner size={11} color="currentColor" /> : icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ── Input mono ──────────────────────────────────────────────── */
export function Input({ label, error, helper, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, color: 'var(--txt-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input {...props} style={{
        width: '100%', padding: '8px 12px',
        background: 'var(--bg-3)',
        border: `1px solid ${error ? 'var(--red)' : 'var(--border-2)'}`,
        borderRadius: 6, color: 'var(--txt)',
        fontSize: 13, fontFamily: 'var(--font-mono)',
        outline: 'none', transition: 'border-color .15s',
        ...props.style,
      }} />
      {helper && <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>{helper}</span>}
      {error  && <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{error}</span>}
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────── */
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, color: 'var(--txt-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>}
      <select {...props} style={{
        width: '100%', padding: '8px 12px',
        background: 'var(--bg-3)', border: '1px solid var(--border-2)',
        borderRadius: 6, color: 'var(--txt)', fontSize: 13,
        fontFamily: 'var(--font-mono)', outline: 'none', appearance: 'none',
        ...props.style,
      }}>{children}</select>
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────── */
export function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${accent ? accent + '40' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: 16,
      ...(accent && { borderLeft: `3px solid ${accent}` }),
      ...style,
    }}>{children}</div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────── */
export function Spinner({ size = 18, color = 'var(--green)' }) {
  return (
    <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${color}25`, borderTopColor: color, borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
  );
}

/* ── Modal ───────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480 }) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%',
        maxWidth: width,
        maxHeight: '88vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        animation: 'fadeIn .2s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--txt-3)', fontSize: 20, lineHeight: 1,
            transition: 'all .15s', background: 'transparent', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--txt)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-3)'; }}>
            ×
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Tag ─────────────────────────────────────────────────────── */
export function Tag({ children, color = 'green' }) {
  const map = {
    green:  ['var(--green)',  'var(--green-bg)'],
    yellow: ['var(--yellow)', 'var(--yellow-bg)'],
    red:    ['var(--red)',    'var(--red-bg)'],
    blue:   ['var(--blue)',   'var(--blue-bg)'],
    purple: ['var(--purple)', 'rgba(188,140,255,0.1)'],
  };
  const [c, bg] = map[color] || map.green;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, color: c, background: bg,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
    }}>{children}</span>
  );
}

/* ── LiveTimer ───────────────────────────────────────────────── */
export function LiveTimer({ desde, label = '' }) {
  const [mins, setMins] = React.useState(0);
  React.useEffect(() => {
    if (!desde) return;
    const calc = () => setMins(Math.round((Date.now() - new Date(desde)) / 60000));
    calc();
    const t = setInterval(calc, 15000);
    return () => clearInterval(t);
  }, [desde]);
  if (!desde) return null;
  const color = mins < 60 ? 'var(--green)' : mins < 120 ? 'var(--yellow)' : 'var(--red)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, fontWeight: 700 }}>
      ⏱ {label}{mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60}m`}
    </span>
  );
}

/* ── Empty ───────────────────────────────────────────────────── */
export function Empty({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--txt-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 14, color: 'var(--txt-2)', fontWeight: 600, marginBottom: 4 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12 }}>{subtitle}</p>}
    </div>
  );
}

/* ── Badge genérico ──────────────────────────────────────────── */
export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   ['#3b82f6', 'rgba(59,130,246,0.1)'],
    green:  ['#22c55e', 'rgba(34,197,94,0.1)'],
    yellow: ['#f59e0b', 'rgba(245,158,11,0.1)'],
    red:    ['#ef4444', 'rgba(239,68,68,0.1)'],
    purple: ['#a855f7', 'rgba(168,85,247,0.1)'],
    gray:   ['#8b91a8', 'rgba(139,145,168,0.1)'],
  };
  const [c, bg] = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, color: c, background: bg, letterSpacing: '0.04em',
    }}>{children}</span>
  );
}

/* ── TimerBadge ──────────────────────────────────────────────── */
export function TimerBadge({ fechaAceptacion, completada }) {
  const [mins, setMins] = React.useState(null);
  React.useEffect(() => {
    if (!fechaAceptacion || completada) return;
    const calc = () => setMins(Math.round((Date.now() - new Date(fechaAceptacion)) / 60000));
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [fechaAceptacion, completada]);
  if (!fechaAceptacion) return null;
  const minutos = completada ? null : mins;
  const color = !minutos ? '#22c55e' : minutos < 60 ? '#22c55e' : minutos < 120 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: color + '15' }}>
      ⏱ {minutos !== null ? (minutos < 60 ? `${minutos}m` : `${Math.floor(minutos/60)}h ${minutos%60}m`) : '...'}
    </span>
  );
}

/* ── Avatar ──────────────────────────────────────────────────── */
export function Avatar({ nombre, apellido, size = 32 }) {
  const txt = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
  const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#14b8a6'];
  const idx = (nombre?.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[idx] + '20', border: `1.5px solid ${colors[idx]}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: colors[idx],
    }}>{txt}</div>
  );
}

/* ── Card ────────────────────────────────────────────────────── */

/* ── Table / Tr / Td ─────────────────────────────────────────── */
export function Table({ headers, children, loading }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 14px', textAlign: 'left', color: 'var(--txt-3)',
                fontWeight: 600, fontSize: 11, letterSpacing: '0.06em',
                textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 40 }}><Spinner /></td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}
export function Tr({ children, onClick }) {
  return (
    <tr onClick={onClick}
      style={{ borderBottom: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default', transition: 'background .12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </tr>
  );
}
export function Td({ children, style = {} }) {
  return <td style={{ padding: '11px 14px', color: 'var(--txt)', verticalAlign: 'middle', ...style }}>{children}</td>;
}