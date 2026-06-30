import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordenesApi } from '../services/api';
import { Spinner, Empty } from '../components/ui';
import { fmtMinutos, minutosDesde, TIPO_COLOR } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';
import { withSede } from '../utils/helpers';
import { useAuthStore } from '../store/auth.store';


function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1 }}>
        {now.toLocaleTimeString('es-PE')}
      </div>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>
        {now.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}
      </div>
    </div>
  );
}

function LiveTimer({ desde }) {
  const [mins, setMins] = useState(minutosDesde(desde));
  useEffect(() => {
    const t = setInterval(() => setMins(minutosDesde(desde)), 10000);
    return () => clearInterval(t);
  }, [desde]);

  const color = !mins ? 'var(--green)' : mins < 60 ? 'var(--green)' : mins < 120 ? 'var(--yellow)' : 'var(--red)';
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>
      {hh}:{mm}
    </span>
  );
}

const METRIC_CFG = [
  { key: 'pendienteNoc',     label: 'Esperando WAN',   icon: 'ti-clock-pause',   color: '#BA7517' },
  { key: 'pendienteTecnico', label: 'Para técnico',     icon: 'ti-user-check',    color: '#185FA5' },
  { key: 'aceptadas',        label: 'Aceptadas',        icon: 'ti-circle-check',  color: '#7F77DD' },
  { key: 'enProceso',        label: 'En proceso',       icon: 'ti-loader',        color: '#0F6E56' },
  { key: 'completadasHoy',   label: 'Completadas hoy',  icon: 'ti-check',         color: '#3B6D11' },
];

const TIPO_BADGE = {
  INSTALACION: { bg: '#E6F1FB', color: '#0C447C' },
  REPARACION:  { bg: '#E1F5EE', color: '#085041' },
  CORTE:       { bg: '#FCEBEB', color: '#791F1F' },
  RECONEXION:  { bg: '#EEEDFE', color: '#3C3489' },
};

export default function MonitorPage() {

  const { tipoLabel, grupos } = useTiposOrden();
  const navigate = useNavigate();
  const sedeSel  = useAuthStore(s => s.sedeSeleccionada);


  const { data: stats } = useQuery({
    queryKey: ['noc-stats', sedeSel],
    queryFn:  () => ordenesApi.stats(withSede({}, sedeSel)).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: activas } = useQuery({
    queryKey: ['noc-activas', sedeSel],
    queryFn:  () => ordenesApi.listar(withSede({
      estado: 'EN_PROCESO', limit: 20,
      tipos: (grupos.NOC_TECNICO || []).join(','),
    }, sedeSel)).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: aceptadas } = useQuery({
    queryKey: ['noc-aceptadas', sedeSel],
    queryFn:  () => ordenesApi.listar(withSede({
      estado: 'ACEPTADA', limit: 20,
      tipos: (grupos.NOC_TECNICO || []).join(','),
    }, sedeSel)).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: pendientesNoc, dataUpdatedAt } = useQuery({
    queryKey: ['noc-pendientes-preview', sedeSel],
    queryFn:  () => ordenesApi.listar(withSede({ estado: 'PENDIENTE_NOC', limit: 5 }, sedeSel)).then(r => r.data),
    refetchInterval: 15000,
  });

  const enCampo = [...(activas?.data || []), ...(aceptadas?.data || [])];

  const segsAtras = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  };
  const hdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };

  return (
    <>
      <style>{`
        .mon-pad { padding: 20px; }
        .mon-5 { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 16px; }
        .mon-2 { display: grid; grid-template-columns: 1fr 290px; gap: 14px; }
        .campo-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .12s; }
        .campo-row:last-child { border-bottom: none; }
        .campo-row:hover { background: var(--bg-3); }
        .pulse-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; flex-shrink: 0; }
        .warn-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 8px; background: var(--yellow-bg); border: 1px solid rgba(227,179,65,0.2); margin-bottom: 6px; cursor: pointer; transition: opacity .12s; }
        .warn-row:hover { opacity: .85; }
        @media (max-width: 720px) {
          .mon-5 { grid-template-columns: repeat(3,1fr); }
          .mon-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mon-pad animate-fade">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-0.02em' }}>Monitor</h1>
            <p style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>Estado en tiempo real</p>
          </div>
          <LiveClock />
        </div>

        {/* 5 métricas */}
        <div className="mon-5">
          {METRIC_CFG.map(m => (
            <div key={m.key} style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>
                <i className={`ti ${m.icon}`} style={{ fontSize: 13, color: m.color }} aria-hidden="true"/>
                {m.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: m.color, lineHeight: 1 }}>
                {stats?.[m.key] ?? <Spinner size={14} color={m.color}/>}
              </div>
            </div>
          ))}
        </div>

        <div className="mon-2">

          {/* Técnicos en campo */}
          <div style={cardStyle}>
            <div style={hdStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pulse-dot" style={{ background: '#1D9E75' }}/>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Técnicos en campo</span>
                <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>({enCampo.length} activos)</span>
              </div>
              {segsAtras != null && (
                <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>hace {segsAtras}s</span>
              )}
            </div>

            {enCampo.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Empty icon="📡" title="Sin técnicos activos" subtitle="No hay instalaciones en curso"/>
              </div>
            ) : enCampo.map(o => {
              const mins = minutosDesde(o.fechaAceptacion);
              const dotColor = !mins ? '#1D9E75' : mins < 60 ? '#1D9E75' : mins < 120 ? '#EF9F27' : '#E24B4A';
              const badge = TIPO_BADGE[o.tipoOrden] || { bg: 'var(--bg-3)', color: 'var(--txt-2)' };
              return (
                <div key={o.id} className="campo-row" onClick={() => navigate(`/ordenes/${o.id}`)}>
                  <span className="pulse-dot" style={{ background: dotColor }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                        #{o.nServicio}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: badge.bg, color: badge.color }}>
                        {tipoLabel(o.tipoOrden)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.abonado}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.direccion}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {o.tecnico && (
                      <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 3 }}>
                        {o.tecnico.usuario.nombre} {o.tecnico.usuario.apellido.split(' ')[0]}
                      </div>
                    )}
                    <LiveTimer desde={o.fechaAceptacion}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Pendientes WAN */}
            <div style={cardStyle}>
              <div style={hdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#BA7517' }} aria-hidden="true"/>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Pendientes WAN</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#BA7517' }}>{stats?.pendienteNoc || 0}</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {(pendientesNoc?.data || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--green)' }}>
                    ✓ Todo al día
                  </div>
                ) : (
                  <>
                    {(pendientesNoc?.data || []).map(o => (
                      <div key={o.id} className="warn-row" onClick={() => navigate('/pendientes')}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#854F0B' }}>
                            #{o.nServicio}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--txt-2)', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.abonado}
                          </div>
                        </div>
                        <i className="ti ti-arrow-right" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"/>
                      </div>
                    ))}
                    {(stats?.pendienteNoc || 0) > 5 && (
                      <button onClick={() => navigate('/pendientes')}
                        style={{ width: '100%', fontSize: 11, color: '#BA7517', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', textAlign: 'center' }}>
                        Ver todas ({stats.pendienteNoc}) →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Tiempo promedio */}
            {stats?.tiempoPromedioMin && (
              <div style={{ ...cardStyle, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-clock" style={{ fontSize: 14 }} aria-hidden="true"/>
                  Tiempo prom. hoy
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#1D9E75', lineHeight: 1 }}>
                  {fmtMinutos(stats.tiempoPromedioMin)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>
                  por instalación · {stats.completadasHoy} completadas
                </div>
                {(stats.promedioInternet || stats.promedioCable) && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stats.promedioInternet && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--txt-3)' }}>Internet</span>
                        <span style={{ fontWeight: 700, color: 'var(--txt-2)' }}>{fmtMinutos(stats.promedioInternet)}</span>
                      </div>
                    )}
                    {stats.promedioCable && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--txt-3)' }}>Cable</span>
                        <span style={{ fontWeight: 700, color: 'var(--txt-2)' }}>{fmtMinutos(stats.promedioCable)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}