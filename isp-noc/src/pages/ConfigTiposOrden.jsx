import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Settings, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { tiposOrdenApi } from '../services/api';
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from '../components/ui';

// ── Colores por servicio ──────────────────────────────────────
const SERVICIO_COLOR = {
  INTERNET: { bg: '#eff6ff', color: '#2563eb', label: '📡 Internet' },
  CABLE:    { bg: '#f5f3ff', color: '#7c3aed', label: '📺 Cable'    },
  DUO:      { bg: '#fff7ed', color: '#ea580c', label: '📡📺 Dúo'   },
};

const FLUJO_COLOR = {
  NOC_TECNICO:     { bg: '#ecfdf5', color: '#16a34a', label: 'NOC → Técnico' },
  SOLO_NOC:        { bg: '#eff6ff', color: '#2563eb', label: 'Solo NOC'      },
  TECNICO_DIRECTO: { bg: '#fef3c7', color: '#d97706', label: 'Técnico directo'},
};

const FLAGS = [
  { key: 'requiereWan',    label: 'Requiere WAN'      },
  { key: 'autorizaOlt',    label: 'Autoriza OLT'      },
  { key: 'esRetiro',       label: 'Es retiro'         },
  { key: 'esBaja',         label: 'Es baja'           },
  { key: 'esInstalacion',  label: 'Es instalación'    },
  { key: 'esCorte',        label: 'Es corte'          },
  { key: 'esCambioEquipo', label: 'Es cambio equipo'  },
];

const FORM_INICIAL = {
  codigo: '', label: '', servicio: 'INTERNET', flujo: 'NOC_TECNICO',
  requiereWan: false, autorizaOlt: false, esRetiro: false,
  esBaja: false, esInstalacion: false, esCorte: false,
  esCambioEquipo: false, orden: 999,
};

// ── Hook para detectar móvil ──────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Modal Crear / Editar ──────────────────────────────────────
function ModalTipo({ open, onClose, tipo }) {
  const qc       = useQueryClient();
  const esEditar = !!tipo;
  const isMobile = useIsMobile();
  const [form, setForm] = useState(FORM_INICIAL);

  React.useEffect(() => {
    if (open) setForm(tipo ? { ...tipo } : FORM_INICIAL);
  }, [open, tipo]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () => esEditar
      ? tiposOrdenApi.actualizar(tipo.codigo, form)
      : tiposOrdenApi.crear(form),
    onSuccess: () => {
      toast.success(esEditar ? 'Tipo actualizado' : 'Tipo creado');
      qc.invalidateQueries(['tipos-orden']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.error || 'Error'),
  });

  return (
    <Modal open={open} onClose={onClose} title={esEditar ? `Editar — ${tipo?.codigo}` : 'Nuevo tipo de orden'} width={isMobile ? '100%' : 520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Código */}
        {!esEditar && (
          <Input
            label="Código *"
            placeholder="Ej: SUPERVISION_I"
            value={form.codigo}
            onChange={e => set('codigo', e.target.value.toUpperCase().replace(/\s/g, '_'))}
            helper="Solo mayúsculas y guiones bajos. Ej: NUEVO_TIPO_I"
          />
        )}

        {/* Label */}
        <Input
          label="Nombre visible *"
          placeholder="Ej: Supervisión Internet"
          value={form.label}
          onChange={e => set('label', e.target.value)}
        />

        {/* Servicio + Flujo — stack en móvil */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 12,
        }}>
          <Select label="Servicio *" value={form.servicio} onChange={e => set('servicio', e.target.value)}>
            <option value="INTERNET">📡 Internet</option>
            <option value="CABLE">📺 Cable</option>
            <option value="DUO">📡📺 Dúo</option>
          </Select>
          <Select label="Flujo *" value={form.flujo} onChange={e => set('flujo', e.target.value)}>
            <option value="NOC_TECNICO">NOC → Técnico</option>
            <option value="SOLO_NOC">Solo NOC</option>
            <option value="TECNICO_DIRECTO">Técnico directo</option>
          </Select>
        </div>

        {/* Flags */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', marginBottom: 10, letterSpacing: '0.06em' }}>
            COMPORTAMIENTO
          </div>
          {/* 1 columna en móvil, 2 en desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 8,
          }}>
            {FLAGS.map(f => (
              <label key={f.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: form[f.key] ? 'var(--accent-glow, #eff6ff)' : 'var(--bg-3)',
                border: `1px solid ${form[f.key] ? 'var(--accent)' : 'var(--border-2)'}`,
                transition: 'all .15s',
                fontSize: 13, fontWeight: 500,
                color: form[f.key] ? 'var(--accent)' : 'var(--txt-2)',
                // Área táctil más cómoda en móvil
                minHeight: isMobile ? 44 : 'auto',
              }}>
                <input
                  type="checkbox"
                  checked={form[f.key]}
                  onChange={e => set(f.key, e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        {/* Orden */}
        <Input
          label="Orden de aparición"
          type="number"
          value={form.orden}
          onChange={e => set('orden', Number(e.target.value))}
          helper="Número más bajo = aparece primero"
        />

        {/* Botones — full width en móvil */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: 8,
          justifyContent: 'flex-end',
          marginTop: 4,
        }}>
          <Btn variant="ghost" onClick={onClose} style={isMobile ? { width: '100%' } : {}}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            loading={mut.isPending}
            disabled={!form.label.trim() || (!esEditar && !form.codigo.trim())}
            onClick={() => mut.mutate()}
            style={isMobile ? { width: '100%' } : {}}
          >
            {esEditar ? 'Guardar cambios' : 'Crear tipo'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Fila de tipo ──────────────────────────────────────────────
function FilaTipo({ tipo, onEditar, onToggle }) {
  const [expandido, setExpandido] = useState(false);
  const isMobile = useIsMobile();
  const serv  = SERVICIO_COLOR[tipo.servicio] || SERVICIO_COLOR.INTERNET;
  const flujo = FLUJO_COLOR[tipo.flujo]       || FLUJO_COLOR.NOC_TECNICO;
  const flagsActivos = FLAGS.filter(f => tipo[f.key]);

  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      opacity: tipo.activo ? 1 : 0.5,
      transition: 'opacity .2s',
    }}>
      {/* ── Fila principal ── */}
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 10 : 12,
          padding: isMobile ? '12px 12px' : '12px 16px',
          cursor: 'pointer',
          flexDirection: isMobile ? 'column' : 'row',
        }}
        onClick={() => setExpandido(v => !v)}
      >
        {/* Móvil: cabecera compacta */}
        {isMobile ? (
          <>
            {/* Fila superior: código + acciones */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
              {/* Código + label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {tipo.codigo}
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tipo.label}
                </div>
              </div>

              {/* Acciones compactas */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onEditar(tipo)}
                  title="Editar"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 8,
                    border: '1px solid var(--border-2)',
                    background: 'transparent', cursor: 'pointer', color: 'var(--txt-2)',
                  }}>
                  <Pencil size={14}/>
                </button>
                <button
                  onClick={() => onToggle(tipo)}
                  title={tipo.activo ? 'Desactivar' : 'Activar'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 8,
                    border: '1px solid var(--border-2)',
                    background: 'transparent', cursor: 'pointer',
                    color: tipo.activo ? 'var(--green)' : 'var(--txt-3)',
                  }}>
                  {tipo.activo ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setExpandido(v => !v); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 8,
                    border: '1px solid var(--border-2)',
                    background: 'transparent', cursor: 'pointer', color: 'var(--txt-3)',
                  }}>
                  {expandido ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
              </div>
            </div>

            {/* Fila inferior: badges + flags activos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, width: '100%' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: serv.bg, color: serv.color,
              }}>
                {serv.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: flujo.bg, color: flujo.color,
              }}>
                {flujo.label}
              </span>
              {flagsActivos.map(f => (
                <span key={f.key} style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                  background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                }}>
                  {f.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          /* ── Desktop: fila horizontal original ── */
          <>
            {/* Código */}
            <div style={{ minWidth: 200, flex: '0 0 200px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontFamily: 'monospace' }}>
                {tipo.codigo}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                {tipo.label}
              </div>
            </div>

            {/* Servicio */}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
              background: serv.bg, color: serv.color, flexShrink: 0,
            }}>
              {serv.label}
            </span>

            {/* Flujo */}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
              background: flujo.bg, color: flujo.color, flexShrink: 0,
            }}>
              {flujo.label}
            </span>

            {/* Flags activos */}
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {flagsActivos.map(f => (
                <span key={f.key} style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                  background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                }}>
                  {f.label}
                </span>
              ))}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <Btn variant="ghost" size="sm" icon={<Pencil size={12}/>}
                onClick={() => onEditar(tipo)}>
                Editar
              </Btn>
              <button
                onClick={() => onToggle(tipo)}
                title={tipo.activo ? 'Desactivar' : 'Activar'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-2)',
                  background: 'transparent', cursor: 'pointer',
                  color: tipo.activo ? 'var(--green)' : 'var(--txt-3)',
                }}>
                {tipo.activo ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
              </button>
              <button
                onClick={() => setExpandido(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-2)',
                  background: 'transparent', cursor: 'pointer', color: 'var(--txt-3)',
                }}>
                {expandido ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{
          padding: isMobile ? '0 12px 12px 12px' : '0 16px 14px 16px',
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(auto-fit, minmax(130px, 1fr))'
            : 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 8,
        }}>
          {FLAGS.map(f => (
            <div key={f.key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 7,
              background: tipo[f.key] ? '#f0fdf4' : 'var(--bg-3)',
              border: `1px solid ${tipo[f.key] ? '#bbf7d0' : 'var(--border)'}`,
              fontSize: 11, fontWeight: 600,
              color: tipo[f.key] ? '#16a34a' : 'var(--txt-3)',
            }}>
              <span>{tipo[f.key] ? '✓' : '—'}</span>
              {f.label}
            </div>
          ))}
          <div style={{
            padding: '6px 10px', borderRadius: 7,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--txt-3)',
          }}>
            Orden: <strong>{tipo.orden}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ConfigTiposOrdenPage() {
  const qc       = useQueryClient();
  const isMobile = useIsMobile();
  const [showModal, setShowModal]     = useState(false);
  const [tipoEditar, setTipoEditar]   = useState(null);
  const [filtroServ, setFiltroServ]   = useState('');
  const [filtroFlujo, setFiltroFlujo] = useState('');
  const [busqueda, setBusqueda]       = useState('');

  const { data, isLoading } = useQuery({
    queryKey:  ['tipos-orden'],
    queryFn:   () => tiposOrdenApi.listar(true).then(r => r.data),
    staleTime: 0,
  });

  const toggleMut = useMutation({
    mutationFn: (tipo) => tiposOrdenApi.actualizar(tipo.codigo, { activo: !tipo.activo }),
    onSuccess:  (_, tipo) => {
      toast.success(tipo.activo ? 'Tipo desactivado' : 'Tipo activado');
      qc.invalidateQueries(['tipos-orden']);
    },
    onError: e => toast.error(e.response?.data?.error || 'Error'),
  });

  const tipos = (data?.tipos || []).filter(t => {
    if (filtroServ  && t.servicio !== filtroServ)  return false;
    if (filtroFlujo && t.flujo    !== filtroFlujo) return false;
    if (busqueda && !t.codigo.includes(busqueda.toUpperCase()) &&
        !t.label.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const grupos = ['INTERNET', 'CABLE', 'DUO'];

  const abrirEditar = (tipo) => { setTipoEditar(tipo); setShowModal(true); };
  const abrirCrear  = ()     => { setTipoEditar(null); setShowModal(true); };
  const cerrarModal = ()     => { setShowModal(false); setTipoEditar(null); };

  return (
    <div style={{ padding: isMobile ? '16px 12px' : 28, maxWidth: 1100, margin: '0 auto' }} className="animate-fade">

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        justifyContent: 'space-between',
        marginBottom: isMobile ? 16 : 22,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Settings size={isMobile ? 18 : 20} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 18 : 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}>
              Tipos de Orden
            </h1>
          </div>
          <p style={{ color: 'var(--txt-3)', fontSize: 11 }}>
            {data?.tipos?.length || 0} tipos configurados · Los cambios se aplican automáticamente
          </p>
        </div>
        <Btn
          variant="primary"
          icon={<Plus size={14}/>}
          onClick={abrirCrear}
          style={isMobile ? { width: '100%' } : {}}
        >
          Nuevo tipo
        </Btn>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 16, padding: '10px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Búsqueda siempre arriba */}
          <input
            placeholder="Buscar código o nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              background: 'var(--bg-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 8,
              color: 'var(--txt)',
              fontSize: 13,
              outline: 'none',
              // Área táctil cómoda
              minHeight: 40,
            }}
          />
          {/* Selects: lado a lado en móvil también (son cortos) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={filtroServ}
              onChange={e => setFiltroServ(e.target.value)}
              style={{
                flex: '1 1 140px',
                padding: '8px 10px',
                background: 'var(--bg-3)',
                border: `1px solid ${filtroServ ? 'var(--accent)' : 'var(--border-2)'}`,
                borderRadius: 8,
                color: filtroServ ? 'var(--accent)' : 'var(--txt-2)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 40,
              }}>
              <option value="">Todos los servicios</option>
              <option value="INTERNET">📡 Internet</option>
              <option value="CABLE">📺 Cable</option>
              <option value="DUO">📡📺 Dúo</option>
            </select>
            <select
              value={filtroFlujo}
              onChange={e => setFiltroFlujo(e.target.value)}
              style={{
                flex: '1 1 140px',
                padding: '8px 10px',
                background: 'var(--bg-3)',
                border: `1px solid ${filtroFlujo ? 'var(--accent)' : 'var(--border-2)'}`,
                borderRadius: 8,
                color: filtroFlujo ? 'var(--accent)' : 'var(--txt-2)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: 40,
              }}>
              <option value="">Todos los flujos</option>
              <option value="NOC_TECNICO">NOC → Técnico</option>
              <option value="SOLO_NOC">Solo NOC</option>
              <option value="TECNICO_DIRECTO">Técnico directo</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista agrupada por servicio */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={28}/>
        </div>
      ) : tipos.length === 0 ? (
        <Empty icon="⚙️" title="Sin tipos" subtitle="Crea el primer tipo de orden"/>
      ) : (
        (filtroServ ? [filtroServ] : grupos).map(serv => {
          const tiposGrupo = tipos.filter(t => t.servicio === serv);
          if (!tiposGrupo.length) return null;
          const s = SERVICIO_COLOR[serv];
          return (
            <Card key={serv} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              {/* Header del grupo */}
              <div style={{
                padding: isMobile ? '10px 12px' : '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: s.bg,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                  {s.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10,
                  background: s.color + '20', color: s.color,
                }}>
                  {tiposGrupo.length} tipos
                </span>
                <span style={{ fontSize: 11, color: s.color, opacity: 0.7, marginLeft: 'auto' }}>
                  {tiposGrupo.filter(t => t.activo).length} activos
                </span>
              </div>

              {/* Filas */}
              {tiposGrupo.map(t => (
                <FilaTipo
                  key={t.codigo}
                  tipo={t}
                  onEditar={abrirEditar}
                  onToggle={(tipo) => toggleMut.mutate(tipo)}
                />
              ))}
            </Card>
          );
        })
      )}

      <ModalTipo open={showModal} onClose={cerrarModal} tipo={tipoEditar}/>
    </div>
  );
}