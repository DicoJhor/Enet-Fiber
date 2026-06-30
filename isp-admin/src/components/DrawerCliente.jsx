import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  X, MapPin, Phone, Fingerprint, Building2, Wifi,
  Calendar, User, Clock, Copy, ExternalLink, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contratosApi } from '../services/api';
import { Spinner } from './ui';
import { fmtFecha } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';


const ESTADO_CONTRATO = {
  ACTIVO:         { label: 'Activo',         color: '#16a34a' },
  EN_INSTALACION: { label: 'En instalación', color: '#d97706' },
  CORTADO:        { label: 'Cortado',        color: '#dc2626' },
  BAJA:           { label: 'Baja',           color: '#64748b' },
  SIN_ACTIVIDAD:  { label: 'Sin actividad',  color: '#94a3b8' },
};
const ESTADO_ORDEN = {
  PENDIENTE_NOC:     { label: 'Esperando NOC', color: '#d97706' },
  PENDIENTE_TECNICO: { label: 'Para técnico',  color: '#3b9fd4' },
  ACEPTADA:          { label: 'Aceptada',      color: '#7c3aed' },
  EN_PROCESO:        { label: 'En proceso',    color: '#2563eb' },
  COMPLETADA:        { label: 'Completada',    color: '#16a34a' },
  CANCELADA:         { label: 'Cancelada',     color: '#94a3b8' },
  REPROGRAMADA:      { label: 'Reprogramada',  color: '#7c3aed' },
};

export default function DrawerCliente({ numero, sedeId, onCerrar }) {
  const navigate = useNavigate();
  const { tipoLabel } = useTiposOrden();
  const abierto  = !!numero;

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  const { data: c, isLoading, error } = useQuery({
    queryKey: ['contrato', numero, sedeId],
    queryFn:  () => contratosApi.obtener(numero, sedeId).then(r => r.data),
    enabled:  abierto,
    staleTime: 30000,
  });

  const copiar = (text, label = 'Copiado') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const cfg = c ? (ESTADO_CONTRATO[c.estado] || { label: c.estado, color: '#94a3b8' }) : null;

  // Inicial para el avatar
  const inicial = c?.abonado?.[0]?.toUpperCase() || '?';

  return createPortal(
    <>
      {/* Backdrop */}
      {abierto && (
        <div onClick={onCerrar} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998,
        }}/>
      )}

      {/* Panel */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480, maxWidth: '100vw',
        background: '#f8fafc',
        zIndex: 9999,
        boxShadow: '-2px 0 32px rgba(15,23,42,0.10)',
        transform: abierto ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {!abierto ? null : isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <Spinner size={26}/>
          </div>
        ) : error ? (
          <div style={{ padding: 24, background: '#fff' }}>
            <BotonCerrar onCerrar={onCerrar}/>
            <div style={{ color: '#dc2626', fontSize: 14, marginTop: 16 }}>
              Error: {error?.response?.data?.error || error.message}
            </div>
          </div>
        ) : c ? (
          <>
            {/* ── Cabecera ── */}
            <div style={{
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 20px',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: '#3b9fd4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff',
                }}>
                  {inicial}
                </div>

                {/* Nombre + DNI */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: '#0f172a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}>
                    {c.abonado}
                  </div>
                  {c.numero && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                    Contrato:&nbsp;{c.numero}
                  </div>
                )}
                </div>

                {/* Acciones rápidas + cerrar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <IconBtn title="Ver ficha" onClick={() => { onCerrar(); navigate(`/clientes/${c.numero}`); }}>
                    <ExternalLink size={15}/>
                  </IconBtn>

                  <IconBtn title="Cerrar" onClick={onCerrar}>
                    <X size={16}/>
                  </IconBtn>
                </div>
              </div>
            </div>

            {/* ── Cuerpo scrolleable ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

              {/* ── Sección datos personales ── */}
                <div style={{
                  background: '#ffffff',
                  margin: '12px 14px 0',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '11px 16px',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Datos personales
                    </span>
                  </div>

                  <div style={{ padding: '0 16px' }}>
                    <FilaDato label="Nombre"   value={c.abonado}/>
                    <FilaDato label="DNI"      value={c.dni || '—'} mono/>
                    <FilaDato label="Teléfono" value={c.celular || '—'} mono/>
                    {c.referencia && <FilaDato label="Referencia" value={c.referencia}/>}
                    {c.sector && <FilaDato label="Sector" value={c.sector}/>}
                    {c.precinto && <FilaDato label="Precinto" value={c.precinto} mono/>}
                    {c.contratoRef?.precinto && (
                      <FilaDato label="Precinto" value={c.contratoRef.precinto} mono/>
                    )}
                    {c.mbps && (
                      <FilaDato label="Plan" value={`${c.planNombre || ''}`}/>
                    )}
                    {c.sede && (
                      <FilaDato label="Sede" value={`${c.sede.nombre}${c.sede.ciudad ? ' · ' + c.sede.ciudad : ''}`} last/>
                    )}
                  </div>
                </div>

              {/* ── Sección equipo ── */}
              {c.equipoActual && (
                <div style={{
                  background: '#ffffff',
                  margin: '10px 14px 0',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Equipo actual</span>
                  </div>
                  <div style={{ padding: '0 16px' }}>
                    <FilaDato label="Instalado" value={fmtFecha(c.equipoActual.fechaInstalacion)}/>
                    <FilaDato label="Serial"    value={c.equipoActual.serieOnu || '—'} mono
                      onCopy={c.equipoActual.serieOnu ? () => copiar(c.equipoActual.serieOnu, 'SN copiado') : null}/>
                    <FilaDato label="OLT"       value={c.equipoActual.oltNombre || '—'}/>
                    {c.equipoActual.configOnu && (
                      <>
                        <FilaDato label="IP WAN"  value={c.equipoActual.configOnu.ipWan   || '—'} mono
                          onCopy={c.equipoActual.configOnu.ipWan ? () => copiar(c.equipoActual.configOnu.ipWan, 'IP copiada') : null}/>
                        <FilaDato label="Gateway" value={c.equipoActual.configOnu.gateway || '—'} mono
                          onCopy={c.equipoActual.configOnu.gateway ? () => copiar(c.equipoActual.configOnu.gateway, 'Gateway copiado') : null}/>
                        <FilaDato label="VLAN"    value={c.equipoActual.configOnu.vlan    || '—'} mono/>
                        <FilaDato label="RX / TX"
                          value={
                            c.equipoActual.configOnu.potenciaRx != null
                              ? `${c.equipoActual.configOnu.potenciaRx} dBm / ${c.equipoActual.configOnu.potenciaTx ?? '—'} dBm`
                              : '—'
                          } mono last/>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Sección historial de órdenes ── */}
              <div style={{
                background: '#ffffff',
                margin: '10px 14px 0',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FileText size={13} style={{ color: '#64748b' }}/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Historial de órdenes ({c.ordenes.length})
                    </span>
                  </div>
                </div>

                {c.ordenes.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Sin órdenes registradas
                  </div>
                ) : (
                  <div>
                    {c.ordenes.map((o, i) => {
                      const eCfg   = ESTADO_ORDEN[o.estado] || { label: o.estado, color: '#94a3b8' };
                      const ultima = i === c.ordenes.length - 1;
                      return (
                        <div key={o.id}
                          onClick={() => navigate(`/ordenes/${o.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px',
                            borderBottom: ultima ? 'none' : '1px solid #f8fafc',
                            cursor: 'pointer',
                            transition: 'background .12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          {/* Ícono */}
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: eCfg.color + '12',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FileText size={14} color={eCfg.color}/>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                {o.tipoOrdenLabel || tipoLabel(o.tipoOrden)}
                              </span>
                              <span style={{ fontSize: 11, color: '#3b9fd4', fontFamily: 'monospace' }}>
                                #{o.nServicio}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#94a3b8' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={10}/> {fmtFecha(o.fechaServicio)}
                              </span>
                              {o.tecnico && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <User size={10}/> {o.tecnico.nombre} {o.tecnico.apellido}
                                </span>
                              )}
                              {o.tiempoInstalacion != null && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Clock size={10}/> {Math.round(o.tiempoInstalacion)} min
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge estado */}
                          <span style={{
                            padding: '3px 8px', borderRadius: 5, flexShrink: 0,
                            fontSize: 10, fontWeight: 700,
                            background: eCfg.color + '12',
                            color: eCfg.color,
                            border: `1px solid ${eCfg.color}20`,
                          }}>
                            {eCfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ height: 16 }}/>
            </div>
          </>
        ) : null}
      </aside>
    </>,
    document.body
  );
}

// ── Mini-componentes ──────────────────────────────────────────

function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: '1px solid #e2e8f0',
      cursor: 'pointer', color: '#64748b',
      transition: 'all .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
      {children}
    </button>
  );
}

function FilaDato({ label, value, mono, onCopy, last }) {
  return (
    <div onClick={onCopy || undefined} style={{
      display: 'flex', alignItems: 'center',
      padding: '9px 0',
      borderBottom: last ? 'none' : '1px solid #f8fafc',
      cursor: onCopy ? 'pointer' : 'default',
      gap: 12,
    }}>
      <span style={{
        fontSize: 12, color: '#94a3b8',
        minWidth: 90, flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        flex: 1, fontSize: 13, color: '#0f172a', fontWeight: 500,
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-word',
      }}>
        {value}
      </span>
      {onCopy && <Copy size={11} style={{ color: '#cbd5e1', flexShrink: 0 }}/>}
    </div>
  );
}