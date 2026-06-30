import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { contratosApi } from '../services/api';
import { Table, Tr, Td, Spinner } from '../components/ui';
import { fmtFecha, withSede } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';
import { useAuthStore } from '../store/auth.store';

const FILTROS_ESTADO = [
  { key: 'TODOS',          label: 'Todos'          },
  { key: 'ACTIVO',         label: 'Activos'        },
  { key: 'EN_INSTALACION', label: 'En instalación' },
  { key: 'CORTADO',        label: 'Cortados'       },
  { key: 'BAJA',           label: 'Baja'           },
  { key: 'SIN_ACTIVIDAD',  label: 'Sin actividad'  },
];

const FILTROS_TIPO = [
  { key: 'INTERNET,DUO', label: 'Todos' },
  { key: 'INTERNET',     label: '📡 Internet' },
  { key: 'DUO',          label: '📡📺 Dúo' },
];

const ESTADO_COLOR = {
  ACTIVO:         '#3fb950',
  EN_INSTALACION: '#e3b341',
  CORTADO:        '#ef4444',
  BAJA:           '#5a7a9a',
  SIN_ACTIVIDAD:  '#768999',
};

// ─── CSS inyectado una vez ───────────────────────────────────────────────────
const CSS = `
  .cli-cards     { display: none; }
  .cli-table-wrap { display: block; }

  @media (max-width: 700px) {
    .cli-cards      { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
    .cli-table-wrap { display: none; }
    .cli-toolbar    { flex-direction: column !important; }
    .cli-toolbar > * { width: 100% !important; flex: unset !important; }
    .cli-filtros-pills { display: none !important; }
    .cli-filtros-select { display: block !important; }
  }

  .cli-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cli-card:active { opacity: 0.85; }
  .cli-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .cli-card-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--txt-2);
  }
  .cli-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 8px;
    margin-top: 2px;
    gap: 8px;
  }
  .cli-filtros-select { display: none; }
`;

if (typeof document !== 'undefined' && !document.getElementById('cli-responsive-css')) {
  const s = document.createElement('style');
  s.id = 'cli-responsive-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Badge de estado ─────────────────────────────────────────────────────────
function EstadoCliente({ estado }) {
  const eColor = ESTADO_COLOR[estado] || '#768999';
  const eLabel = FILTROS_ESTADO.find(f => f.key === estado)?.label || estado;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: eColor + '20', color: eColor, border: `1px solid ${eColor}40`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: eColor, flexShrink: 0,
        animation: estado === 'EN_INSTALACION' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}/>
      {eLabel}
    </span>
  );
}

// ─── Card individual (móvil) ─────────────────────────────────────────────────
function ClienteCard({ c, onClick, tipoLabel }) {
  return (
    <div className="cli-card" onClick={onClick}>
      {/* Número + estado */}
      <div className="cli-card-top">
        <span style={{
          fontWeight: 800, fontSize: 14,
          color: 'var(--accent)', fontFamily: 'var(--font-mono)',
        }}>
          {c.numero}
        </span>
        <EstadoCliente estado={c.estado} />
      </div>

      {/* Nombre */}
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt)' }}>
        {c.abonado || <span style={{ color: '#e3b341', fontStyle: 'italic' }}>Sin nombre</span>}
      </div>

      {/* DNI + celular */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {c.dni && (
          <div className="cli-card-row">
            <span style={{ fontSize: 11 }}>🪪</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{c.dni}</span>
          </div>
        )}
        {c.celular && (
          <div className="cli-card-row">
            <span style={{ fontSize: 11 }}>📱</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{c.celular}</span>
          </div>
        )}
      </div>

      {/* Dirección */}
      {(c.direccion || c.sector) && (
        <div className="cli-card-row">
          <span style={{ fontSize: 11 }}>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.direccion}{c.sector ? ` · ${c.sector}` : ''}
          </span>
        </div>
      )}

      {/* Sede + última actividad */}
      <div className="cli-card-bottom">
        <div className="cli-card-row">
          {c.sede
            ? <span style={{ color: 'var(--txt-3)', fontSize: 11 }}>{c.sede.nombre}</span>
            : <span style={{ color: 'var(--txt-3)', fontSize: 11 }}>Sin sede</span>
          }
        </div>
        {c.ultimaActividad ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--txt-3)' }}>
              {fmtFecha(c.ultimaActividad)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }}>
              {tipoLabel(c.ultimoTipoOrden)}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Sin actividad</span>
        )}
      </div>
    </div>
  );
}

// ─── Paginación ───────────────────────────────────────────────────────────────
function Paginacion({ page, pages, isFetching, onPrev, onNext }) {
  if (pages <= 1) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderTop: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>
        Página {page} de {pages} {isFetching && '· actualizando...'}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button disabled={page === 1} onClick={onPrev} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'transparent', border: '1px solid var(--border-2)',
          color: page === 1 ? 'var(--txt-3)' : 'var(--txt-2)',
          cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1,
        }}>← Anterior</button>
        <button disabled={page >= pages} onClick={onNext} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'transparent', border: '1px solid var(--border-2)',
          color: page >= pages ? 'var(--txt-3)' : 'var(--txt-2)',
          cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.5 : 1,
        }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ClientesPage() {
  const navigate         = useNavigate();
  const { tipoLabel } = useTiposOrden();
  const sedeSeleccionada = useAuthStore(s => s.sedeSeleccionada);

  const [filtroEstado,  setFiltroEstado]  = useState('TODOS');
  const [filtroTipo,    setFiltroTipo]    = useState('INTERNET,DUO');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [busqueda,      setBusqueda]      = useState('');
  const [page,          setPage]          = useState(1);
  const [spinning,      setSpinning]      = useState(false);
  const LIMIT = 15;

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(busquedaInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => { setPage(1); }, [filtroEstado, filtroTipo, sedeSeleccionada]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['clientes', { busqueda, filtroEstado, filtroTipo, page, sede: sedeSeleccionada }],
    queryFn:  () => contratosApi.listar(withSede({
      page, limit: LIMIT, tipoServicio: filtroTipo,
      ...(busqueda             && { search: busqueda }),
      ...(filtroEstado !== 'TODOS' && { estado: filtroEstado }),
    }, sedeSeleccionada)).then(r => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const contratos = data?.data       || [];
  const total     = data?.total      || 0;
  const pages     = data?.totalPages || 1;
  const stats     = data?.stats      || {};

  const irA = (num, sedeId) => navigate(`/clientes/${num}`, {
    state: { sedeId },  // pasa el sedeId como state de navegación
  });

  return (
    <div style={{ padding: 16 }} className="animate-fade">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="cli-toolbar" style={{
        display: 'flex', gap: 10, marginBottom: 16,
        flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px',
      }}>
        {/* Buscador */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--txt-3)',
          }}/>
          <input
            value={busquedaInput}
            onChange={e => setBusquedaInput(e.target.value)}
            placeholder="Buscar abonado, contrato, DNI, celular..."
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, height: 34,
              background: 'var(--bg-3)', border: '1px solid var(--border-2)',
              borderRadius: 8, color: 'var(--txt)', fontSize: 12, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filtro tipo de servicio */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {FILTROS_TIPO.map(f => (
            <button key={f.key} onClick={() => { setFiltroTipo(f.key); setPage(1); }} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: filtroTipo === f.key ? 'rgba(249,115,22,0.15)' : 'transparent',
              color:      filtroTipo === f.key ? '#f97316' : 'var(--txt-3)',
              border:    `1px solid ${filtroTipo === f.key ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtros pill — desktop */}
        <div className="cli-filtros-pills" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTROS_ESTADO.map(f => {
            const eColor = f.key === 'TODOS' ? '#5a7a9a' : (ESTADO_COLOR[f.key] || '#5a7a9a');
            const active = filtroEstado === f.key;
            return (
              <button key={f.key} onClick={() => setFiltroEstado(f.key)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: active ? eColor + '20' : 'transparent',
                color:      active ? eColor        : 'var(--txt-3)',
                border:    `1px solid ${active ? eColor + '40' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                {f.label}{f.key !== 'TODOS' ? ` (${stats[f.key] ?? 0})` : ''}
              </button>
            );
          })}
        </div>

        {/* Filtro select — móvil */}
        <select
          className="cli-filtros-select"
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            padding: '7px 10px',
            background: 'var(--bg-3)', border: '1px solid var(--border-2)',
            borderRadius: 8, color: 'var(--txt)', fontSize: 12,
            outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}>
          {FILTROS_ESTADO.map(f => (
            <option key={f.key} value={f.key}>
              {f.label}{f.key !== 'TODOS' ? ` (${stats[f.key] ?? 0})` : ''}
            </option>
          ))}
        </select>

        <button onClick={async () => { setSpinning(true); await refetch(); setTimeout(() => setSpinning(false), 600); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
          borderRadius: 8, background: 'transparent', border: '1px solid var(--border-2)',
          color: 'var(--txt-2)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{ display: 'inline-flex' }} className={spinning ? 'spin' : ''}><RefreshCw size={13}/></span> Actualizar
        </button>
      </div>

      {/* ── Vista MÓVIL: cards ───────────────────────────────────────────── */}
      <div className="cli-cards" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spinner />
          </div>
        ) : contratos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--txt-3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt-2)', marginBottom: 4 }}>Sin resultados</p>
            <p style={{ fontSize: 13 }}>Prueba ajustando los filtros</p>
          </div>
        ) : contratos.map(c => (
          <ClienteCard key={`${c.sede?.id ?? 'sin-sede'}-${c.numero}`} c={c} onClick={() => irA(c.numero, c.sede?.id)} tipoLabel={tipoLabel} />
        ))}
        <Paginacion
          page={page} pages={pages} isFetching={isFetching}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
        />
      </div>

      {/* ── Vista DESKTOP: tabla ─────────────────────────────────────────── */}
      <div className="cli-table-wrap" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <Table loading={isLoading} headers={['N° Contrato','Abonado','DNI','Dirección','Celular','Sede','Estado','Última actividad','']}>
          {!isLoading && contratos.length === 0 ? (
            <tr><td colSpan={9}>
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--txt-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt-2)', marginBottom: 4 }}>Sin resultados</p>
                <p style={{ fontSize: 13 }}>Prueba ajustando los filtros</p>
              </div>
            </td></tr>
          ) : contratos.map(c => (
            <Tr key={`${c.sede?.id ?? 'sin-sede'}-${c.numero}`} onClick={() => irA(c.numero, c.sede?.id)}>
              <Td>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  {c.numero}
                </span>
              </Td>
              <Td>
                <div style={{ fontWeight: 600, color: 'var(--txt)', fontSize: 13 }}>
                  {c.abonado || <span style={{ color: '#e3b341', fontStyle: 'italic' }}>Sin nombre</span>}
                </div>
              </Td>
              <Td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--txt-2)' }}>
                {c.dni || '—'}
              </Td>
              <Td style={{ maxWidth: 180 }}>
                <div style={{ fontSize: 12, color: 'var(--txt-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.direccion || '—'}
                </div>
                {c.sector && <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{c.sector}</div>}
              </Td>
              <Td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--txt-2)' }}>
                {c.celular || '—'}
              </Td>
              <Td style={{ fontSize: 12 }}>
                {c.sede
                  ? <span style={{ color: 'var(--txt-2)' }}>{c.sede.nombre}</span>
                  : <span style={{ color: 'var(--txt-3)' }}>—</span>}
              </Td>
              <Td><EstadoCliente estado={c.estado} /></Td>
              <Td style={{ fontSize: 12, color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>
                {c.ultimaActividad ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{fmtFecha(c.ultimaActividad)}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      {tipoLabel(c.ultimoTipoOrden)}
                    </div>
                  </div>
                ) : '—'}
              </Td>
              <Td><span style={{ fontSize: 11, color: 'var(--txt-3)' }}>Ver →</span></Td>
            </Tr>
          ))}
        </Table>
        <Paginacion
          page={page} pages={pages} isFetching={isFetching}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 10, textAlign: 'right' }}>
        Mostrando {contratos.length} de {total} contrato{total !== 1 ? 's' : ''}
      </div>
    </div>
  );
}