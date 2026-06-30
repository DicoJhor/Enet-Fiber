import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import { ordenesApi, BACKEND_URL } from '../services/api';
import { Card, EstadoBadge, Btn, Spinner, Avatar, TimerBadge } from '../components/ui';
import { fmtFecha, fmtFechaHora, fmtMinutos, TIPO_COLOR, waLink } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';

function InfoFila({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', width: 100, flexShrink: 0, paddingTop: 1 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500, flex: 1 }}>{value || '—'}</div>
    </div>
  );
}

const CSS = `
  @media (max-width: 1080px) {
    .od-noc-grid-main { grid-template-columns: 1fr !important; }
    .od-noc-grid-inst { grid-template-columns: 1fr 1fr !important; }
    .od-noc-inst-fotos { grid-column: span 2 !important; }
  }
  @media (max-width: 600px) {
    .od-noc-grid-inst  { grid-template-columns: 1fr !important; }
    .od-noc-inst-fotos { grid-column: span 1 !important; }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('od-noc-responsive-css')) {
  const s = document.createElement('style');
  s.id = 'od-noc-responsive-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

export default function OrdenDetalle() {
  const { id }   = useParams();
  const { tipoLabel, esInternet: esInternetFn, esDeGrupo } = useTiposOrden();
  const navigate = useNavigate();

  const { data: orden, isLoading } = useQuery({
    queryKey: ['noc-orden', id],
    queryFn:  () => ordenesApi.obtener(id).then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size={28} />
    </div>
  );
  if (!orden) return <div style={{ padding: 28, color: 'var(--txt-3)' }}>Orden no encontrada</div>;

  const esInternet    = esInternetFn(orden.tipoOrden);
  const esDuo         = esDeGrupo(orden.tipoOrden, 'DUO');
  const necesitaWan   = esInternet || esDuo;
  const inst       = orden.instalacion;
  const enCurso    = orden.estado === 'ACEPTADA' || orden.estado === 'EN_PROCESO';

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1000, margin: '0 auto' }} className="animate-fade">

      <button onClick={() => navigate('/seguimiento')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--txt-3)', fontSize: 12, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}>
        <ArrowLeft size={14} /> Volver a seguimiento
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)' }}>Orden #{orden.nServicio}</h1>
            <EstadoBadge estado={orden.estado} />
            <span style={{ fontSize: 11, fontWeight: 600, color: TIPO_COLOR[orden.tipoOrden], background: (TIPO_COLOR[orden.tipoOrden] || '#666') + '15', padding: '3px 10px', borderRadius: 20 }}>
              {esInternet ? '📡' : esDuo ? '📡📺' : '📺'} {tipoLabel(orden.tipoOrden)}
            </span>
            {enCurso && orden.fechaAceptacion && <TimerBadge fechaAceptacion={orden.fechaAceptacion} completada={false} />}
            {orden.tiempoInstalacion && (
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ {fmtMinutos(orden.tiempoInstalacion)}</span>
            )}
          </div>
          <p style={{ color: 'var(--txt-3)', fontSize: 12 }}>Creada {fmtFechaHora(orden.createdAt)}</p>
        </div>
      </div>

      {/* Timeline */}
      <Card style={{ marginBottom: 18, padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
          {[
            { label: 'Creada',     fecha: orden.createdAt },
            ...(necesitaWan ? [{ label: 'WAN OK', fecha: orden.fechaWan }] : []),
            { label: 'Aceptada',   fecha: orden.fechaAceptacion },
            { label: 'En campo',   fecha: orden.fechaInicio },
            { label: 'Completada', fecha: orden.fechaFin },
          ].map((step, i, arr) => {
            const done = !!step.fecha;
            return (
              <React.Fragment key={step.label}>
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--accent)' : 'var(--bg-3)',
                    border: `2px solid ${done ? 'var(--accent)' : 'var(--border-2)'}`,
                    fontSize: 11, color: done ? '#fff' : 'var(--txt-3)',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: done ? 'var(--txt)' : 'var(--txt-3)', fontWeight: done ? 600 : 400 }}>{step.label}</div>
                  {step.fecha && <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 1 }}>{fmtFechaHora(step.fecha)}</div>}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? 'var(--accent)' : 'var(--border-2)', marginBottom: 20 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      <div className="od-noc-grid-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Datos del cliente */}
        <Card>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Datos del Cliente</h3>
          <InfoFila label="Abonado"    value={orden.abonado} />
          <InfoFila label="DNI"        value={orden.dni} />
          <InfoFila label="Contrato"   value={orden.contrato} />
          <InfoFila label="Fecha"      value={fmtFecha(orden.fechaServicio)} />
          <InfoFila label="Dirección"  value={orden.direccion} />
          <InfoFila label="Referencia" value={orden.referencia} />
          <InfoFila label="Sector"     value={orden.sector} />
          {(orden.plan?.nombre || orden.mbps) && (
            <InfoFila label="Plan" value={orden.plan?.nombre || `${orden.mbps} Mbps`} />
          )}
          {orden.observacion && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(227,179,65,0.08)', borderRadius: 8, fontSize: 12, color: '#e3b341', borderLeft: '3px solid #e3b341' }}>
              {orden.observacion}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {orden.celular && <>
              <a href={`tel:${orden.celular}`} style={{ flex: 1 }}>
                <Btn variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center' }} icon={<Phone size={13} />}>{orden.celular}</Btn>
              </a>
              <a href={waLink(orden.celular)} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                <Btn variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center' }} icon={<MessageCircle size={13} />}>WhatsApp</Btn>
              </a>
            </>}
          </div>
        </Card>

        {/* WAN + Técnico — solo lectura */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {necesitaWan && (
            <Card>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>WAN — NOC</h3>
              {orden.ipWan ? (
                <>
                  <InfoFila label="IP WAN"  value={orden.ipWan} />
                  <InfoFila label="Máscara" value={orden.mascara} />
                  <InfoFila label="Gateway" value={orden.gateway} />
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ WAN lista para el técnico</div>
                </>
              ) : (
                <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--txt-3)', fontSize: 12 }}>
                  ⏳ Esperando configuración de WAN
                </div>
              )}
            </Card>
          )}

          <Card>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Técnico Asignado</h3>
            {orden.tecnico ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar nombre={orden.tecnico.usuario.nombre} apellido={orden.tecnico.usuario.apellido} size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--txt)' }}>
                    {orden.tecnico.usuario.nombre} {orden.tecnico.usuario.apellido}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
                    {orden.tecnico.zonaAsignada || 'Sin zona'}
                  </div>
                </div>
                {orden.tecnico.usuario.telefono && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <a href={`tel:${orden.tecnico.usuario.telefono}`}>
                      <Btn variant="ghost" size="sm" icon={<Phone size={12} />} />
                    </a>
                    <a href={waLink(orden.tecnico.usuario.telefono)} target="_blank" rel="noreferrer">
                      <Btn variant="ghost" size="sm" icon={<MessageCircle size={12} />} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--txt-3)', fontSize: 12 }}>
                Sin técnico asignado
              </div>
            )}
          </Card>
        </div>

        {/* Instalación */}
        {inst && (
          <Card style={{ gridColumn: '1 / -1', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Registro de Instalación</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <EstadoBadge estado={inst.completada ? 'COMPLETADA' : 'EN_PROCESO'} />
                {orden.tiempoInstalacion && (
                  <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>⏱ {fmtMinutos(orden.tiempoInstalacion)}</span>
                )}
              </div>
            </div>
            <div className="od-noc-grid-inst" style={{ display: 'grid', gridTemplateColumns: necesitaWan ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>

              {/* GPS */}
              <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>GPS</div>
                {inst.latitud ? (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                      {inst.latitud.toFixed(5)}, {inst.longitud.toFixed(5)}
                    </div>
                    <a href={`https://maps.google.com/?q=${inst.latitud},${inst.longitud}`} target="_blank" rel="noreferrer">
                      <Btn variant="ghost" size="sm">Ver mapa</Btn>
                    </a>
                  </>
                ) : <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>Sin GPS</span>}
              </div>

              {/* Config ONU — solo Internet */}
              {necesitaWan && (
                <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>Señal ONU</div>
                  {inst.configOnu ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                      {inst.configOnu.serialNumber && <div style={{ color: 'var(--txt-2)', fontFamily: 'var(--font-mono)' }}>SN: <strong>{inst.configOnu.serialNumber}</strong></div>}
                      {inst.configOnu.potenciaRx && (
                        <div>RX: <strong style={{ color: inst.configOnu.potenciaRx > -25 ? 'var(--green)' : '#ef4444' }}>
                          {inst.configOnu.potenciaRx} dBm
                        </strong></div>
                      )}
                      {inst.configOnu.potenciaTx && <div style={{ color: 'var(--txt-2)' }}>TX: <strong>{inst.configOnu.potenciaTx} dBm</strong></div>}
                      {inst.configOnu.ssid && <div style={{ color: 'var(--txt-3)', marginTop: 2 }}>WiFi: {inst.configOnu.ssid}</div>}
                    </div>
                  ) : <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>Sin config</span>}
                </div>
              )}

              {/* Fotos */}
              <div className="od-noc-inst-fotos" style={{ padding: '14px 16px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>
                  Fotos ({inst.fotos?.length || 0})
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(inst.fotos || []).map(f => {
                    const fotoUrl = f.url.startsWith('http') ? f.url : `${BACKEND_URL}${f.url}`;
                    return (
                      <a key={f.id} href={fotoUrl} target="_blank" rel="noreferrer">
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-3)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          <img src={fotoUrl} alt={f.tipo}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                      </a>
                    );
                  })}
                  {(inst.fotos?.length || 0) === 0 && <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>Sin fotos</span>}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}