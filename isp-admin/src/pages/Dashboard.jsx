import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wifi, Tv, CheckCircle, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ordenesApi, tecnicosApi } from '../services/api';
import { Card, EstadoBadge, Spinner, Avatar } from '../components/ui';
import { fmtFecha, fmtMinutos, TIPO_COLOR } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';

function StatCard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'border-color .2s', padding: 16 }}
      onClick={onClick}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--txt-2)', fontSize: 12 }}>
        <Icon size={14} color={color}/> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1, marginTop: 8 }}>
        {value ?? <Spinner size={16} color={color}/>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tipoLabel } = useTiposOrden();

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn:  () => ordenesApi.stats().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes-dash'],
    queryFn:  () => ordenesApi.listar({ limit: 6 }).then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: tecnicos } = useQuery({
    queryKey: ['tecnicos-dash'],
    queryFn:  () => tecnicosApi.listar({ activo: true }).then(r => r.data),
  });

  const datosDona = [
    { name: 'Internet', value: stats?.pendientesInternet || 0, color: '#3b82f6' },
    { name: 'Cable',    value: stats?.pendientesCable    || 0, color: '#22c55e' },
  ];
  const totalPendientes = datosDona.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* Estilos responsivos inyectados */}
      <style>{`
        .dash-grid-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .dash-grid-middle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .dash-padding {
          padding: 16px;
        }
        @media (max-width: 600px) {
          .dash-grid-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .dash-grid-middle {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .dash-padding {
            padding: 12px;
          }
          .dash-dona-wrap {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="dash-padding animate-fade">

        {/* 4 tarjetas */}
        <div className="dash-grid-stats">
          <StatCard icon={Wifi} label="Pendientes Internet" value={stats?.pendientesInternet} color="#3b82f6"
            onClick={() => navigate('/ordenes')}/>
          <StatCard icon={Tv} label="Pendientes Cable" value={stats?.pendientesCable} color="#22c55e"
            onClick={() => navigate('/ordenes')}/>
          <StatCard icon={CheckCircle} label="Completadas hoy" value={stats?.completadasHoy} color="#22c55e"
            sub={stats?.tiempoPromedioMin ? `Promedio: ${fmtMinutos(stats.tiempoPromedioMin)}` : null}/>
          <StatCard icon={Users} label="Técnicos activos" value={stats?.totalTecnicos} color="#a855f7"/>
        </div>

        {/* Fila: dona + resumen */}
        <div className="dash-grid-middle">

          {/* Dona */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                Pendientes por servicio
              </h2>
            </div>
            <div className="dash-dona-wrap" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              {totalPendientes === 0 ? (
                <div style={{ flex: 1, textAlign: 'center', color: 'var(--txt-3)', fontSize: 13, padding: '30px 0' }}>
                  Sin órdenes pendientes
                </div>
              ) : (
                <>
                  <div style={{ width: 140, height: 140, flexShrink: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={datosDona} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2}>
                          {datosDona.map((d, i) => <Cell key={i} fill={d.color}/>)}
                        </Pie>
                        <Tooltip contentStyle={{
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 8, fontSize: 12,
                        }}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {totalPendientes}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>total</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                    {datosDona.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, color: 'var(--txt-2)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: d.color }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Resumen */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                Resumen
              </h2>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FilaResumen label="Esperando NOC"   valor={stats?.pendienteNoc}     color="#f59e0b"/>
              <FilaResumen label="Para técnico"    valor={stats?.pendienteTecnico} color="#3b82f6"/>
              <FilaResumen label="En proceso"      valor={stats?.enProceso}        color="#06b6d4"/>
              <FilaResumen label="Completadas hoy" valor={stats?.completadasHoy}   color="#22c55e"/>
            </div>
          </Card>
        </div>

        {/* Órdenes recientes */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: 0 }}>
              Órdenes recientes
            </h2>
            <button onClick={() => navigate('/ordenes')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              Ver todas <ArrowRight size={12}/>
            </button>
          </div>
          {!ordenes ? (
            <div style={{ padding: 32, textAlign: 'center' }}><Spinner/></div>
          ) : (ordenes.data || []).map(o => (
            <div key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>#{o.nServicio}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TIPO_COLOR[o.tipoOrden] }}>
                    {tipoLabel(o.tipoOrden)}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{o.abonado}</div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)' }} className="truncate">{o.direccion}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <EstadoBadge estado={o.estado}/>
                <span style={{ fontSize: 10, color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>
                  {fmtFecha(o.fechaServicio)}
                </span>
              </div>
            </div>
          ))}
        </Card>

      </div>
    </>
  );
}

function FilaResumen({ label, valor, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
        <span style={{ fontSize: 13, color: 'var(--txt-2)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>
        {valor ?? '—'}
      </span>
    </div>
  );
}