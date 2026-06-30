import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { EstadoBadge, Table, Tr, Td, Spinner } from '../components/ui';
import { fmtFecha, fmtMinutos, minutosDesde, TIPO_COLOR } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';

import { ordenesApi } from '../services/api';
import { withSede } from '../utils/helpers';
import { useAuthStore } from '../store/auth.store';

const FILTROS_ESTADO = [
  { key: 'TODOS',             label: 'Todos'          },
  { key: 'PENDIENTE_NOC',     label: 'Esp. WAN'       },
  { key: 'PENDIENTE_TECNICO', label: 'Para técnico'   },
  { key: 'ACEPTADA',          label: 'Aceptada'       },
  { key: 'EN_PROCESO',        label: 'En proceso'     },
  { key: 'COMPLETADA',        label: 'Completada'     },
];

const ESTADO_COLOR = {
  PENDIENTE_NOC:     '#e3b341',
  PENDIENTE_TECNICO: '#3b9fd4',
  ACEPTADA:          '#bc8cff',
  EN_PROCESO:        '#58a6ff',
  COMPLETADA:        '#3fb950',
};

// ─── Estilos responsive inyectados una vez ───────────────────────────────────
const css = `
  .seg-cards { display: none; }
  .seg-table-wrap { display: block; }

  @media (max-width: 1080px) {
    .seg-cards { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
    .seg-table-wrap { display: none; }

    .seg-toolbar {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .seg-toolbar > * {
      width: 100% !important;
      flex: unset !important;
    }
  }

  .seg-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.15s;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .seg-card:active { opacity: 0.85; }

  .seg-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .seg-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px solid var(--border);
    padding-top: 8px;
    margin-top: 2px;
  }

  .seg-card-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--txt-2);
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('seg-responsive-css')) {
  const s = document.createElement('style');
  s.id = 'seg-responsive-css';
  s.textContent = css;
  document.head.appendChild(s);
}

// ─── Card individual (móvil) ─────────────────────────────────────────────────
function OrdenCard({ o, onClick, tipoLabel }) {
  const eColor  = ESTADO_COLOR[o.estado] || '#768999';
  const minutos = (o.estado === 'EN_PROCESO' || o.estado === 'ACEPTADA')
    ? minutosDesde(o.fechaAceptacion)
    : null;

  const tiempoNode = o.tiempoInstalacion
    ? <span style={{ color: 'var(--green)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>✓ {fmtMinutos(o.tiempoInstalacion)}</span>
    : minutos !== null
    ? <span style={{ color: minutos < 60 ? 'var(--green)' : minutos < 120 ? '#e3b341' : '#ef4444', fontSize: 12, fontFamily: 'var(--font-mono)' }}>⏱ {fmtMinutos(minutos)}</span>
    : <span style={{ color: 'var(--txt-3)', fontSize: 12 }}>{fmtFecha(o.fechaServicio)}</span>;

  return (
    <div className="seg-card" onClick={onClick}>
      {/* Fila superior: # orden + estado */}
      <div className="seg-card-top">
        <div>
          <span style={{ fontWeight: 800, fontSize: 14, color: eColor, fontFamily: 'var(--font-mono)' }}>
            #{o.nServicio}
          </span>
          {o.contrato && (
            <span style={{ fontSize: 11, color: 'var(--txt-3)', marginLeft: 8 }}>{o.contrato}</span>
          )}
        </div>
        <EstadoBadge estado={o.estado} />
      </div>

      {/* Abonado + tipo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)' }}>
          {o.abonado || <span style={{ color: '#e3b341', fontStyle: 'italic' }}>Sin nombre</span>}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: TIPO_COLOR[o.tipoOrden] || '#666',
          background: 'var(--bg-3)', borderRadius: 5, padding: '2px 7px' }}>
          {tipoLabel(o.tipoOrden)}
        </span>
      </div>

      {/* Dirección */}
      {(o.direccion || o.sector) && (
        <div className="seg-card-row">
          <span style={{ fontSize: 11 }}>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {o.direccion}{o.sector ? ` · ${o.sector}` : ''}
          </span>
        </div>
      )}

      {/* Fila inferior: técnico + tiempo */}
      <div className="seg-card-bottom">
        <div className="seg-card-row">
          <span style={{ fontSize: 11 }}>👤</span>
          {o.tecnico
            ? <span>{o.tecnico.usuario.nombre} {o.tecnico.usuario.apellido}</span>
            : <span style={{ color: '#e3b341' }}>Sin asignar</span>
          }
        </div>
        {tiempoNode}
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function SeguimientoPage() {
  const navigate = useNavigate();
const { tipoLabel, grupos } = useTiposOrden();
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Tipos que aparecen en seguimiento — todos excepto los que resuelve solo el NOC
  // Solo tipos de Internet — excluye Cable y Dúo
  const TIPOS_SEGUIMIENTO = [
    ...(grupos.INSTALACIONES   || []),
    ...(grupos.RETIROS         || []),
    ...(grupos.CAMBIO_EQUIPO   || []),
    ...(grupos.CORTES          || []),
    ...(grupos.BAJAS           || []),
    ...(grupos.NOC_TECNICO     || []),
    ...(grupos.TECNICO_DIRECTO || []),
  ].filter(tipo => 
    (grupos.INTERNET || []).includes(tipo) || 
    (grupos.DUO      || []).includes(tipo)
  );

  const [spinning, setSpinning] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina,   setPagina]   = useState(1);
  const POR_PAGINA = 15;
  const sedeSel = useAuthStore(s => s.sedeSeleccionada);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['seg-internet', sedeSel],
    queryFn:  () => ordenesApi.listar(withSede({
      limit: 500,
      tipos: TIPOS_SEGUIMIENTO.join(','),
    }, sedeSel)).then(r => r.data),
    refetchInterval: 20000,
  });

  const ordenes = (data?.data || []).filter(o => TIPOS_SEGUIMIENTO.includes(o.tipoOrden));

  const filtradas = ordenes.filter(o => {
    const matchEstado = filtroEstado === 'TODOS' || o.estado === filtroEstado;
    const matchBusq   = !busqueda
      || o.abonado?.toLowerCase().includes(busqueda.toLowerCase())
      || o.nServicio?.toString().includes(busqueda)
      || o.contrato?.toLowerCase().includes(busqueda.toLowerCase())
      || o.tecnico?.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusq;
  });

  const counts = FILTROS_ESTADO.slice(1).reduce((acc, f) => {
    acc[f.key] = ordenes.filter(o => o.estado === f.key).length;
    return acc;
  }, {});

  const totalPaginas   = Math.ceil(filtradas.length / POR_PAGINA);
  const filtradaPagina = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  React.useEffect(() => { setPagina(1); }, [filtroEstado, busqueda, sedeSel]);

  return (
    <div style={{ padding: '16px' }} className="animate-fade">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="seg-toolbar" style={{
        display: 'flex', gap: 8, marginBottom: 16,
        flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 12px',
      }}>
        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }}/>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar abonado, #servicio, técnico..."
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, height: 34,
              background: 'var(--bg-3)', border: '1px solid var(--border-2)',
              borderRadius: 8, color: 'var(--txt)', fontSize: 12, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            flex: '1 1 140px', padding: '7px 10px',
            background: 'var(--bg-3)', border: '1px solid var(--border-2)',
            borderRadius: 8, color: 'var(--txt)', fontSize: 12,
            outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}>
          {FILTROS_ESTADO.map(f => (
            <option key={f.key} value={f.key}>
              {f.label}{f.key !== 'TODOS' ? ` (${counts[f.key] ?? 0})` : ''}
            </option>
          ))}
        </select>

        <button onClick={async () => { setSpinning(true); await refetch(); setTimeout(() => setSpinning(false), 600); }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 8,
          background: 'transparent', border: '1px solid var(--border-2)',
          color: 'var(--txt-2)', fontSize: 12, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
<span style={{ display: 'inline-flex' }} className={spinning ? 'spin' : ''}><RefreshCw size={13}/></span> Actualizar        </button>
      </div>

      {/* ── Vista MÓVIL: cards ───────────────────────────────────────────── */}
      <div className="seg-cards" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spinner />
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--txt-3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt-2)', marginBottom: 4 }}>Sin resultados</p>
            <p style={{ fontSize: 13 }}>Prueba ajustando los filtros</p>
          </div>
        ) : filtradaPagina.map(o => (
          <OrdenCard key={o.id} o={o} tipoLabel={tipoLabel} onClick={() => navigate(`/seguimiento/${o.id}`)} />
        ))}
      </div>

      {/* ── Vista DESKTOP: tabla ─────────────────────────────────────────── */}
      <div className="seg-table-wrap" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden', overflowX: 'auto',
      }}>
        <div style={{ minWidth: 640 }}>
          <Table loading={isLoading} headers={['N° Orden','Abonado','Tipo','Dirección','Técnico','Estado','Tiempo','']}>
            {!isLoading && filtradas.length === 0 ? (
              <tr><td colSpan={8}>
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--txt-3)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt-2)', marginBottom: 4 }}>Sin resultados</p>
                  <p style={{ fontSize: 13 }}>Prueba ajustando los filtros</p>
                </div>
              </td></tr>
            ) : filtradaPagina.map(o => {
              const eColor  = ESTADO_COLOR[o.estado] || '#768999';
              const minutos = (o.estado === 'EN_PROCESO' || o.estado === 'ACEPTADA')
                ? minutosDesde(o.fechaAceptacion)
                : null;
              return (
                <Tr key={o.id} onClick={() => navigate(`/seguimiento/${o.id}`)}>
                  <Td>
                    <span style={{ fontWeight: 800, fontSize: 13, color: eColor, fontFamily: 'var(--font-mono)' }}>
                      #{o.nServicio}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 600, color: 'var(--txt)', fontSize: 13 }}>{o.abonado || <span style={{ color: '#e3b341', fontStyle: 'italic' }}>Sin nombre</span>}</div>
                    {o.contrato && <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{o.contrato}</div>}
                  </Td>
                  <Td>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TIPO_COLOR[o.tipoOrden] || '#666' }}>
                      {tipoLabel(o.tipoOrden)}
                    </span>
                  </Td>
                  <Td style={{ maxWidth: 180 }}>
                    <div style={{ fontSize: 12, color: 'var(--txt-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.direccion || '—'}
                    </div>
                    {o.sector && <div style={{ fontSize: 11, color: 'var(--txt-3)' }}> {o.sector}</div>}
                  </Td>
                  <Td style={{ fontSize: 12 }}>
                    {o.tecnico
                      ? (
                        <div>
                          <span style={{ color: 'var(--txt-2)' }}>{o.tecnico.usuario.nombre} {o.tecnico.usuario.apellido}</span>
                          {o.sede && <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}> {o.sede.nombre}</div>}
                        </div>
                      )
                      : <span style={{ color: '#e3b341', fontSize: 11 }}>Sin asignar</span>
                    }
                  </Td>
                  <Td><EstadoBadge estado={o.estado}/></Td>
                  <Td style={{ fontSize: 12, color: 'var(--txt-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {o.tiempoInstalacion
                      ? <span style={{ color: 'var(--green)' }}>✓ {fmtMinutos(o.tiempoInstalacion)}</span>
                      : minutos !== null
                      ? <span style={{ color: minutos < 60 ? 'var(--green)' : minutos < 120 ? '#e3b341' : '#ef4444' }}>⏱ {fmtMinutos(minutos)}</span>
                      : <span style={{ color: 'var(--txt-3)' }}>{fmtFecha(o.fechaServicio)}</span>
                    }
                  </Td>
                  <Td>
                    <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Ver →</span>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtradas.length)} de {filtradas.length} órdenes
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt)', cursor: pagina === 1 ? 'default' : 'pointer', opacity: pagina === 1 ? 0.4 : 1, fontSize: 14 }}>‹</button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let p;
              if (totalPaginas <= 5)              p = i + 1;
              else if (pagina <= 3)               p = i + 1;
              else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
              else                                 p = pagina - 2 + i;
              return (
                <button key={p} onClick={() => setPagina(p)} style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: pagina === p ? 'none' : '1px solid var(--border)',
                  background: pagina === p ? 'var(--accent)' : 'transparent',
                  color: pagina === p ? '#fff' : 'var(--txt)',
                  cursor: 'pointer', fontSize: 12, fontWeight: pagina === p ? 700 : 400,
                }}>{p}</button>
              );
            })}
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt)', cursor: pagina === totalPaginas ? 'default' : 'pointer', opacity: pagina === totalPaginas ? 0.4 : 1, fontSize: 14 }}>›</button>
          </div>
        </div>
      )}
      {totalPaginas <= 1 && (
        <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 10, textAlign: 'right' }}>
          Mostrando {filtradas.length} de {ordenes.length} órdenes
        </div>
      )}
    </div>
  );
}