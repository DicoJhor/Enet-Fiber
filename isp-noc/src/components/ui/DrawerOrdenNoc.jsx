import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────
// Hook detectar móvil
// ─────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = React.useState(
    () => window.innerWidth < breakpoint
  );

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('resize', handler);
    };
  }, [breakpoint]);

  return isMobile;
}

// ─────────────────────────────────────────────
// DRAWER
// ─────────────────────────────────────────────
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  accentColor = 'var(--accent)',
  width = 520,
  children,
}) {
  const isMobile = useIsMobile();

  // cerrar con ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', onKey);
    }

    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // bloquear scroll del body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return createPortal(
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,

          background: 'rgba(0,0,0,0.45)',

          opacity: open ? 1 : 0,

          pointerEvents: open ? 'auto' : 'none',

          transition: 'opacity .25s ease',

          backdropFilter: open ? 'blur(4px)' : 'none',
        }}
      />

      {/* DRAWER */}
      <aside
        style={{
          position: 'fixed',

          top: 0,
          right: 0,

          width: isMobile ? '100vw' : width,
          maxWidth: '100vw',

          height: '100dvh',

          zIndex: 9999,

          background: 'var(--bg-card)',

          borderLeft: '1px solid var(--border)',

          boxShadow: '-10px 0 40px rgba(0,0,0,.35)',

          display: 'flex',
          flexDirection: 'column',

          overflow: 'hidden',

          transform: open
            ? 'translateX(0)'
            : 'translateX(100%)',

          transition:
            'transform .32s cubic-bezier(.32,.72,0,1)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            flexShrink: 0,

            borderBottom: '1px solid var(--border)',

            background: 'var(--bg-3)',
          }}
        >
          {/* barra superior */}
          <div
            style={{
              height: 3,
              background: accentColor,
            }}
          />

          {/* contenido */}
          <div
            style={{
              padding: '18px 20px',

              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',

              gap: 12,
            }}
          >
            <div>
              {subtitle && (
                <div
                  style={{
                    fontSize: 11,

                    color: 'var(--txt-3)',

                    textTransform: 'uppercase',

                    letterSpacing: '.08em',

                    fontWeight: 700,

                    marginBottom: 4,
                  }}
                >
                  {subtitle}
                </div>
              )}

              <div
                style={{
                  fontSize: 17,

                  fontWeight: 800,

                  color: 'var(--txt)',
                }}
              >
                {title}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,

                borderRadius: 10,

                border: 'none',

                background: 'transparent',

                color: 'var(--txt-3)',

                cursor: 'pointer',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                flexShrink: 0,

                transition: 'all .15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--border)';

                e.currentTarget.style.color =
                  'var(--txt)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'transparent';

                e.currentTarget.style.color =
                  'var(--txt-3)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,

            overflowY: 'auto',

            overflowX: 'hidden',

            padding: '22px 20px',

            background: 'var(--bg-card)',

            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
}