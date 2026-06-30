import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, User, MapPin, Zap, AlertTriangle, RefreshCw, GripVertical, X, Clock, Phone, Search } from 'lucide-react';
import { ordenesApi, tecnicosApi } from '../services/api';
import { TIPO_LABEL, TIPO_COLOR, TIPOS_SOLO_NOC } from '../utils/helpers';
import { Spinner } from '../components/ui';

// ── Helpers de fecha ──────────────────────────────────────────
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const HORA_INICIO = 6;
const HORA_FIN    = 22;
const TOTAL_HORAS = HORA_FIN - HORA_INICIO;
const CELL_HEIGHT = 90;

// ── Semana comienza 2 días antes de hoy ──────────────────────
function getInicioVista(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 2);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLunes(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDia(date)      { return date.getDate(); }
function fmtMesCorto(date) { return MESES[date.getMonth()].slice(0, 3); }

function isHoy(date) {
  const hoy = new Date();
  return date.getDate() === hoy.getDate() &&
    date.getMonth() === hoy.getMonth() &&
    date.getFullYear() === hoy.getFullYear();
}

function isSemanaActual(inicio) {
  const ref = getInicioVista(new Date());
  return inicio.toDateString() === ref.toDateString();
}

function fmtHora(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

// ── Verifica si una celda es pasada (no asignable) ───────────
function isPasado(dia, hora) {
  const ahora = new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaD = new Date(dia);
  diaD.setHours(0, 0, 0, 0);

  if (diaD < hoy) return true; // día anterior
  if (diaD.getTime() === hoy.getTime()) {
    // mismo día: bloquear horas <= hora actual
    return hora <= ahora.getHours();
  }
  return false;
}

const TECNICO_COLORS = [
  { bg: 'rgba(99,102,241,0.18)',  border: '#6366f1', text: '#818cf8' },
  { bg: 'rgba(16,185,129,0.18)',  border: '#10b981', text: '#34d399' },
  { bg: 'rgba(245,158,11,0.18)',  border: '#f59e0b', text: '#fbbf24' },
  { bg: 'rgba(239,68,68,0.18)',   border: '#ef4444', text: '#f87171' },
  { bg: 'rgba(168,85,247,0.18)',  border: '#a855f7', text: '#c084fc' },
  { bg: 'rgba(14,165,233,0.18)',  border: '#0ea5e9', text: '#38bdf8' },
  { bg: 'rgba(236,72,153,0.18)',  border: '#ec4899', text: '#f472b6' },
  { bg: 'rgba(20,184,166,0.18)',  border: '#14b8a6', text: '#2dd4bf' },
];

function TipoIcon({ tipo, size = 12 }) {
  if (!tipo) return null;
  if (tipo.includes('AVERIA'))  return <AlertTriangle size={size} />;
  if (tipo.includes('INSTALA')) return <Zap size={size} />;
  return <RefreshCw size={size} />;
}

// ── Chip de orden en la lista izquierda ──────────────────────
function OrdenChip({ orden, isDragging, onDragStart, onToggleSelect, isSelected, selectedCount, tecnicoColor }) {
  const color = TIPO_COLOR[orden.tipoOrden] || 'var(--txt-3)';

  return (
    <div
      draggable
      onClick={e => onToggleSelect(orden.id, e.ctrlKey || e.metaKey || e.shiftKey)}
      onDragStart={(e) => {
        e.dataTransfer.setData('ordenId', orden.id);
        onDragStart(orden.id);
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px 10px 15px',
        borderRadius: 10,
        border: `2px solid ${isSelected ? 'var(--accent)' : tecnicoColor ? tecnicoColor.border : 'var(--border-2)'}`,
        background: isSelected ? 'rgba(99,102,241,0.12)' : tecnicoColor ? tecnicoColor.bg : 'var(--bg-3)',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity .15s, transform .1s, box-shadow .15s, border-color .12s, background .12s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Checkbox visual */}
      <div style={{
        position: 'absolute', top: 7, right: 28,
        width: 14, height: 14, borderRadius: 4,
        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-2)'}`,
        background: isSelected ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .12s', flexShrink: 0,
      }}>
        {isSelected && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '10px 0 0 10px' }} />

      <div style={{ paddingLeft: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>
            #{orden.nServicio}
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 700, color,
            background: `${color}22`, padding: '2px 7px', borderRadius: 20,
          }}>
            <TipoIcon tipo={orden.tipoOrden} size={9} />
            {TIPO_LABEL[orden.tipoOrden] || orden.tipoOrden}
          </span>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 5, lineHeight: 1.3 }}>
          <User size={10} color="var(--txt-3)" style={{ flexShrink: 0 }} />
          {orden.abonado}
        </div>

        {orden.celular && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--txt-2)', marginBottom: 3 }}>
            <Phone size={9} color="var(--txt-3)" style={{ flexShrink: 0 }} />
            {orden.celular}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 11, color: 'var(--txt-3)', lineHeight: 1.35, marginBottom: 5 }}>
          <MapPin size={9} style={{ flexShrink: 0, marginTop: 2 }} />
          {orden.direccion}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
          {(orden.zona || orden.sector) && (
            <span style={{ fontSize: 10, color: 'var(--txt-2)', fontWeight: 600, background: 'var(--bg-2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
              📍 {orden.zona || orden.sector}
            </span>
          )}
          {tecnicoColor && orden._tecnicoNombre && (
            <span style={{ fontSize: 10, color: tecnicoColor.text, fontWeight: 600 }}>
              👷 {orden._tecnicoNombre}
            </span>
          )}
        </div>
      </div>

      <GripVertical size={14} color="var(--txt-3)" style={{ flexShrink: 0, marginTop: 2 }} />
    </div>
  );
}

// ── Tarjeta de visita dentro de la celda horaria ─────────────
// Siempre muestra: N° orden · tipo · nombre cliente · técnico
// Es draggable para reubicarla en otra celda (usa 'visitaId' en dataTransfer)
function VisitaCard({ visita, onRemove, tecnicoColor, onDragStartVisita, isDraggingVisita }) {
  const color = TIPO_COLOR[visita.orden.tipoOrden] || 'var(--txt-3)';
  return (
    <div
      draggable
      onDragStart={e => {
        // Marca que es una visita existente (no una orden nueva)
        e.dataTransfer.setData('visitaId', visita.id);
        e.dataTransfer.setData('ordenId', visita.ordenId);
        onDragStartVisita?.(visita.id);
      }}
      style={{
        position: 'relative',
        padding: '4px 18px 4px 6px',
        borderRadius: 6,
        background: tecnicoColor
          ? `linear-gradient(135deg, ${tecnicoColor.bg}, rgba(255,255,255,0.02))`
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${tecnicoColor?.border || 'rgba(255,255,255,0.1)'}`,
        overflow: 'hidden',
        boxShadow: isDraggingVisita ? 'none' : '0 1px 4px rgba(0,0,0,0.12)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        cursor: 'grab',
        opacity: isDraggingVisita ? 0.35 : 1,
        transition: 'opacity .15s',
        userSelect: 'none',
      }}>
      <button onClick={e => { e.stopPropagation(); onRemove(visita.id); }}
        style={{ position: 'absolute', top: 3, right: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: 0, lineHeight: 1 }}>
        <X size={9} />
      </button>

      <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 10, lineHeight: 1 }}>
        #{visita.orden.nServicio}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color, fontWeight: 700, lineHeight: 1 }}>
        <TipoIcon tipo={visita.orden.tipoOrden} size={8} />
        {TIPO_LABEL[visita.orden.tipoOrden] || visita.orden.tipoOrden}
      </span>

      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1 }}>
        {visita.orden.abonado}
      </span>

      {visita.tecnico && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: tecnicoColor?.text || 'var(--txt-3)', fontWeight: 600, lineHeight: 1 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: tecnicoColor?.border || 'var(--txt-3)', flexShrink: 0 }} />
          {visita.tecnico.usuario.nombre} {visita.tecnico.usuario.apellido}
        </span>
      )}
    </div>
  );
}

// ── Modal: seleccionar técnico al soltar ─────────────────────
// conflictosPorTecnico: { [tecnicoId]: string } — mensaje de conflicto si lo hay
function ModalAsignarTecnico({ open, tecnicos, onConfirm, onCancel, conflictosPorTecnico = {} }) {
  const [tecnicoId, setTecnicoId] = useState('');
  useEffect(() => { if (open) setTecnicoId(''); }, [open]);
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Asignar técnico</div>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 18 }}>Seleccioná el técnico. Los marcados con ⛔ ya tienen una orden en ese horario.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {(tecnicos || []).map((t, i) => {
            const col = TECNICO_COLORS[i % TECNICO_COLORS.length];
            const selected = tecnicoId === t.id;
            const conflicto = conflictosPorTecnico[t.id];
            const bloqueado = !!conflicto;
            return (
              <button
                key={t.id}
                onClick={() => !bloqueado && setTecnicoId(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 9,
                  cursor: bloqueado ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${bloqueado ? 'rgba(239,68,68,0.3)' : selected ? col.border : 'var(--border-2)'}`,
                  background: bloqueado ? 'rgba(239,68,68,0.06)' : selected ? col.bg : 'var(--bg-3)',
                  opacity: bloqueado ? 0.65 : 1,
                  transition: 'all .15s', textAlign: 'left',
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: bloqueado ? 'rgba(239,68,68,0.1)' : col.bg,
                  border: `1px solid ${bloqueado ? 'rgba(239,68,68,0.3)' : col.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  color: bloqueado ? '#f87171' : col.text, flexShrink: 0,
                }}>
                  {bloqueado ? '⛔' : `${t.usuario.nombre[0]}${t.usuario.apellido[0]}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: bloqueado ? 'var(--txt-2)' : 'var(--txt)' }}>
                    {t.usuario.nombre} {t.usuario.apellido}
                  </div>
                  {bloqueado
                    ? <div style={{ fontSize: 10, color: '#f87171', marginTop: 1 }}>{conflicto}</div>
                    : t.zonaAsignada && <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{t.zonaAsignada}</div>
                  }
                </div>
                {selected && !bloqueado && <div style={{ marginLeft: 'auto', color: col.text, fontSize: 16 }}>✓</div>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--txt-2)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Cancelar
          </button>
          <button onClick={() => tecnicoId && onConfirm(tecnicoId)} disabled={!tecnicoId} style={{
            flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
            background: tecnicoId ? 'var(--accent)' : 'var(--bg-3)',
            color: tecnicoId ? '#fff' : 'var(--txt-3)',
            cursor: tecnicoId ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13, transition: 'all .15s',
          }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ProgramarPage() {
  const navigate = useNavigate();

  // Empieza 2 días antes de hoy
  const [semanaInicio, setSemanaInicio] = useState(() => getInicioVista(new Date()));
  const [visitas, setVisitas]           = useState([]);
  const [dragId, setDragId]             = useState(null);
  const [dropTarget, setDropTarget]     = useState(null);
  const [pendingDrop, setPendingDrop]   = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE_NOC,PENDIENTE_TECNICO');
  const [busqueda, setBusqueda]           = useState('');
  const [selectedIds, setSelectedIds]   = useState(new Set()); // selección múltiple
  const [dragVisitaId, setDragVisitaId] = useState(null);        // visita siendo reubicada

  // Toast de error para celdas bloqueadas
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  };

  const { data: ordenesData, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes-programar', filtroEstado],
    queryFn: () => ordenesApi.listar({
      estado: filtroEstado.includes(',') ? undefined : filtroEstado,
      limit: 100,
      page: 1,
    }).then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: tecnicosData } = useQuery({
    queryKey: ['tecnicos-activos'],
    queryFn: () => tecnicosApi.listar({ activo: true }).then(r => r.data),
  });

  const tecnicos = tecnicosData || [];
  const ordenesYaProgramadas = new Set(visitas.map(v => v.ordenId));
  const todasOrdenes = (ordenesData?.data || []).filter(o =>
    !TIPOS_SOLO_NOC.includes(o.tipoOrden) && !ordenesYaProgramadas.has(o.id)
  );

  // Filtrar por búsqueda (nombre, nServicio, nContrato)
  const ordenesFiltradas = busqueda.trim() === '' ? todasOrdenes : todasOrdenes.filter(o => {
    const q = busqueda.toLowerCase().trim();
    return (
      String(o.nServicio || '').toLowerCase().includes(q) ||
      String(o.nContrato || '').toLowerCase().includes(q) ||
      String(o.abonado   || '').toLowerCase().includes(q)
    );
  });

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i));
  const horas = Array.from({ length: TOTAL_HORAS }, (_, i) => HORA_INICIO + i);

  const tecnicoColorMap = {};
  tecnicos.forEach((t, i) => { tecnicoColorMap[t.id] = TECNICO_COLORS[i % TECNICO_COLORS.length]; });

  const getOrdenColor = (ordenId) => {
    const visita = visitas.find(v => v.ordenId === ordenId);
    return visita?.tecnico ? tecnicoColorMap[visita.tecnico.id] || null : null;
  };
  const getOrdenTecnicoNombre = (ordenId) => {
    const visita = visitas.find(v => v.ordenId === ordenId);
    return visita?.tecnico ? `${visita.tecnico.usuario.nombre} ${visita.tecnico.usuario.apellido}` : null;
  };

  // ── Selección múltiple ───────────────────────────────────
  const toggleSelect = (ordenId, multi) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (multi) {
        // Ctrl/Shift: toggle individual
        next.has(ordenId) ? next.delete(ordenId) : next.add(ordenId);
      } else {
        // Click simple: si ya está solo él, deseleccionar; si hay otros o no está, seleccionar solo él
        if (next.size === 1 && next.has(ordenId)) {
          next.clear();
        } else {
          next.clear();
          next.add(ordenId);
        }
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Validación de conflicto técnico/hora ─────────────────
  // Regla: mismo técnico no puede tener dos órdenes en el mismo día+hora
  const getConflicto = (tecnicoId, diaIndex, hora, excluirOrdenId = null) => {
    return visitas.find(v =>
      v.tecnico?.id === tecnicoId &&
      v.diaIndex === diaIndex &&
      v.hora === hora &&
      v.ordenId !== excluirOrdenId
    ) || null;
  };

  // ── Drag & Drop ───────────────────────────────────────────
  const handleDrop = (e, diaIndex, hora) => {
    e.preventDefault();
    setDropTarget(null);
    setDragVisitaId(null);

    const dia = dias[diaIndex];
    if (isPasado(dia, hora)) {
      showToast('⛔ No podés asignar órdenes a fechas u horas pasadas');
      setDragId(null);
      return;
    }

    const visitaId = e.dataTransfer.getData('visitaId');

    // ── Reubicación de visita existente ──────────────────────
    if (visitaId) {
      const visita = visitas.find(v => v.id === visitaId);
      if (!visita) return;
      if (visita.diaIndex === diaIndex && visita.hora === hora) return;

      // Validar conflicto: si tiene técnico, no puede coincidir en misma hora/día
      if (visita.tecnico) {
        const conflicto = getConflicto(visita.tecnico.id, diaIndex, hora, visita.ordenId);
        if (conflicto) {
          showToast(
            `⛔ ${visita.tecnico.usuario.nombre} ya tiene la orden #${conflicto.orden.nServicio} a las ${fmtHora(hora)}`
          );
          return;
        }
      }

      setVisitas(prev => {
        const sinEsta = prev.filter(v => v.id !== visitaId);
        return [...sinEsta, {
          ...visita,
          id: `${visita.ordenId}-${diaIndex}-${hora}-${Date.now()}`,
          diaIndex,
          hora,
        }];
      });
      return;
    }

    // ── Nueva asignación desde panel izquierdo ───────────────
    const draggedId = e.dataTransfer.getData('ordenId');
    if (!draggedId) return;

    const idsADrop = (selectedIds.size > 1 && selectedIds.has(draggedId))
      ? [...selectedIds]
      : [draggedId];

    for (let i = 0; i < idsADrop.length; i++) {
      const horaDestino = hora + i;
      if (horaDestino >= HORA_FIN || isPasado(dia, horaDestino)) {
        showToast(`⛔ No hay suficientes horas disponibles desde las ${fmtHora(hora)} para ${idsADrop.length} órdenes`);
        setDragId(null);
        return;
      }
    }

    if (tecnicos.length === 0) {
      setVisitas(prev => {
        let next = [...prev];
        idsADrop.forEach((ordenId, i) => {
          const horaDestino = hora + i;
          const orden = todasOrdenes.find(o => o.id === ordenId) || prev.find(v => v.ordenId === ordenId)?.orden;
          if (!orden) return;
          next = next.filter(v => v.ordenId !== ordenId);
          next.push({ id: `${ordenId}-${diaIndex}-${horaDestino}-${Date.now()}`, ordenId, diaIndex, hora: horaDestino, tecnico: null, orden });
        });
        return next;
      });
      clearSelection();
      return;
    }

    setPendingDrop({ ordenIds: idsADrop, diaIndex, hora });
  };

  const confirmarTecnico = (tecnicoId) => {
    if (!pendingDrop) return;
    const { ordenIds, diaIndex, hora } = pendingDrop;
    const tecnico = tecnicos.find(t => t.id === tecnicoId);

    // Verificar conflictos para cada orden antes de confirmar
    const conflictos = [];
    // También hay que verificar conflictos entre las propias órdenes que se están asignando
    const horasUsadas = new Set();

    ordenIds.forEach((ordenId, i) => {
      const horaDestino = hora + i;
      // Conflicto con visitas existentes
      const existente = getConflicto(tecnicoId, diaIndex, horaDestino, ordenId);
      if (existente) {
        conflictos.push(`${fmtHora(horaDestino)}: ya tiene orden #${existente.orden.nServicio}`);
      }
      // Conflicto entre las mismas órdenes del lote (misma hora)
      if (horasUsadas.has(horaDestino)) {
        conflictos.push(`${fmtHora(horaDestino)}: hora duplicada en la selección`);
      }
      horasUsadas.add(horaDestino);
    });

    if (conflictos.length > 0) {
      showToast(`⛔ Conflicto con ${tecnico.usuario.nombre}: ${conflictos[0]}`);
      setPendingDrop(null);
      setDragId(null);
      return;
    }

    setVisitas(prev => {
      let next = [...prev];
      ordenIds.forEach((ordenId, i) => {
        const horaDestino = hora + i;
        const orden = todasOrdenes.find(o => o.id === ordenId) || prev.find(v => v.ordenId === ordenId)?.orden;
        if (!orden) return;
        next = next.filter(v => v.ordenId !== ordenId);
        next.push({ id: `${ordenId}-${diaIndex}-${horaDestino}-${Date.now()}`, ordenId, diaIndex, hora: horaDestino, tecnico, orden });
      });
      return next;
    });
    setPendingDrop(null);
    setDragId(null);
    clearSelection();
  };

  const removerVisita = (visitaId) => setVisitas(prev => prev.filter(v => v.id !== visitaId));

  const visitasPorCelda = (diaIndex, hora) => visitas.filter(v => v.diaIndex === diaIndex && v.hora === hora);

  const tecnicosEnUso = [...new Set(visitas.filter(v => v.tecnico).map(v => v.tecnico.id))]
    .map(id => tecnicos.find(t => t.id === id))
    .filter(Boolean);

  const isDragOver = (diaIndex, hora) => dropTarget?.diaIndex === diaIndex && dropTarget?.hora === hora;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Toast de error ──────────────────────────────────── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, background: 'var(--bg-2)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 10, padding: '10px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontSize: 13, fontWeight: 600, color: '#f87171',
          animation: 'fadeInDown .2s ease',
          pointerEvents: 'none',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', margin: 0 }}>
            Programar visitas
          </h1>
          <p style={{ fontSize: 12, color: 'var(--txt-3)', margin: '2px 0 0' }}>
            Arrastrá las órdenes al horario del día
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {tecnicosEnUso.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {tecnicosEnUso.map(t => {
                const col = tecnicoColorMap[t.id];
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: col.bg, border: `1px solid ${col.border}`, fontSize: 11, color: col.text, fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.border }} />
                    {t.usuario.nombre}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ padding: '6px 14px', background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
            {visitas.length} programadas
          </div>

          <button onClick={() => navigate(-1)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--txt-2)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ← Volver
          </button>
        </div>
      </div>

      {/* ── Cuerpo ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Panel izquierdo: órdenes pendientes ─────────── */}
        <div style={{ width: 296, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {/* Título + contador */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Órdenes pendientes</span>
              <span style={{ fontSize: 11, color: 'var(--txt-3)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
                {ordenesFiltradas.length}{busqueda ? ` de ${todasOrdenes.length}` : ''}
              </span>
            </div>

            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, N° orden o contrato..."
                style={{
                  width: '100%', padding: '7px 28px 7px 28px',
                  background: 'var(--bg-3)', border: '1px solid var(--border-2)',
                  borderRadius: 7, color: 'var(--txt)', fontSize: 12, outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: 2, lineHeight: 1 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filtro estado */}
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 7, color: 'var(--txt-2)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="PENDIENTE_NOC,PENDIENTE_TECNICO">Todas las pendientes</option>
              <option value="PENDIENTE_NOC">Esperando NOC</option>
              <option value="PENDIENTE_TECNICO">Para técnico</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingOrdenes ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={22} /></div>
            ) : todasOrdenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--txt-3)' }}>
                <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontSize: 12 }}>No hay órdenes pendientes</p>
              </div>
            ) : ordenesFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--txt-3)' }}>
                <Search size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: 12 }}>Sin resultados para<br/><strong style={{ color: 'var(--txt-2)' }}>"{busqueda}"</strong></p>
                <button onClick={() => setBusqueda('')} style={{ marginTop: 10, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpiar búsqueda</button>
              </div>
            ) : (
              ordenesFiltradas.map(o => (
                <OrdenChip
                  key={o.id}
                  orden={{ ...o, _tecnicoNombre: getOrdenTecnicoNombre(o.id) }}
                  isDragging={dragId === o.id}
                  onDragStart={setDragId}
                  onToggleSelect={toggleSelect}
                  isSelected={selectedIds.has(o.id)}
                  selectedCount={selectedIds.size}
                  tecnicoColor={getOrdenColor(o.id)}
                />
              ))
            )}
          </div>

          {/* Barra de selección múltiple */}
          {selectedIds.size > 0 && (
            <div style={{
              padding: '8px 12px', borderTop: '1px solid var(--border)',
              background: 'rgba(99,102,241,0.1)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{selectedIds.size}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                  {selectedIds.size === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--txt-3)' }}>Arrastrá cualquiera →</span>
                <button onClick={clearSelection} style={{ background: 'none', cursor: 'pointer', color: 'var(--txt-3)', fontSize: 10, padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border-2)' }}>
                  Limpiar
                </button>
              </div>
            </div>
          )}
          {selectedIds.size === 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', lineHeight: 1.5 }}>
                ☝️ Click para seleccionar · Ctrl+Click para múltiples · Arrastrá al horario
              </p>
            </div>
          )}
        </div>

        {/* ── Panel derecho: calendario horario ───────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Navegación de semana */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', flexShrink: 0 }}>
            <button onClick={() => setSemanaInicio(d => addDays(d, -7))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--txt-2)', cursor: 'pointer' }}>
              <ChevronLeft size={16} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>
                {fmtMesCorto(semanaInicio)} {semanaInicio.getFullYear()}
                {isSemanaActual(semanaInicio) && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>· Vista actual</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
                {fmtDia(semanaInicio)} — {fmtDia(addDays(semanaInicio, 6))} de {fmtMesCorto(addDays(semanaInicio, 6))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setSemanaInicio(getInicioVista(new Date()))} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--txt-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Hoy
              </button>
              <button onClick={() => setSemanaInicio(d => addDays(d, 7))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--txt-2)', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Cabeceras de días */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0 }}>
            <div style={{ borderRight: '1px solid var(--border)' }} />
            {dias.map((dia, i) => {
              const esHoyFlag = isHoy(dia);
              const esPasadoDia = isPasado(dia, 23);
              return (
                <div key={i} style={{
                  padding: '8px 6px',
                  borderRight: i < 6 ? '1px solid var(--border)' : 'none',
                  background: esHoyFlag ? 'rgba(99,102,241,0.08)' : esPasadoDia ? 'rgba(255,255,255,0.01)' : 'transparent',
                  textAlign: 'center',
                  opacity: esPasadoDia ? 0.5 : 1,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: esHoyFlag ? 'var(--accent)' : 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {DIAS[i % 7]}
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, margin: '3px auto 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: esHoyFlag ? 'var(--accent)' : 'transparent',
                    color: esHoyFlag ? '#fff' : 'var(--txt)',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                  }}>
                    {fmtDia(dia)}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }}>
                    {fmtMesCorto(dia)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid horario */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))', minHeight: TOTAL_HORAS * CELL_HEIGHT }}>

              {/* Columna de horas */}
              <div style={{ borderRight: '1px solid var(--border)' }}>
                {horas.map(hora => (
                  <div key={hora} style={{ height: CELL_HEIGHT, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 6, paddingTop: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-3)', lineHeight: 1 }}>{fmtHora(hora)}</span>
                  </div>
                ))}
              </div>

              {/* Columnas días × horas */}
              {dias.map((dia, diaIndex) => {
                const esHoyFlag = isHoy(dia);
                return (
                  <div key={diaIndex} style={{ borderRight: diaIndex < 6 ? '1px solid var(--border)' : 'none', minWidth: 0, overflow: 'hidden' }}>
                    {horas.map(hora => {
                      const visitasAqui = visitasPorCelda(diaIndex, hora);
                      const over = isDragOver(diaIndex, hora);
                      const bloqueada = isPasado(dia, hora);

                      return (
                        <div
                          key={hora}
                          onDragOver={e => {
                            e.preventDefault();
                            if (!bloqueada) setDropTarget({ diaIndex, hora });
                          }}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={e => handleDrop(e, diaIndex, hora)}
                          style={{
                            height: CELL_HEIGHT,
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box',
                            borderBottom: '1px solid var(--border)',
                            padding: '4px 4px 2px',
                            background: bloqueada
                              ? 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(255,255,255,0.012) 6px, rgba(255,255,255,0.012) 12px)'
                              : over
                                ? 'rgba(99,102,241,0.1)'
                                : esHoyFlag
                                  ? 'rgba(99,102,241,0.02)'
                                  : 'var(--bg)',
                            transition: 'background .12s',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: bloqueada ? 'not-allowed' : 'default',
                            // Responsivo: layout de tarjetas
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Overlay de bloqueado */}
                          {bloqueada && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.05)', pointerEvents: 'none', zIndex: 1 }} />
                          )}

                          {/* Indicador de drop vacío */}
                          {!bloqueada && visitasAqui.length === 0 && over && (
                            <div style={{ position: 'absolute', inset: 3, border: '1.5px dashed var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>
                                {selectedIds.size > 1 ? `Soltar ${selectedIds.size} órdenes` : 'Soltar aquí'}
                              </span>
                              {selectedIds.size > 1 && (
                                <span style={{ fontSize: 9, color: 'var(--txt-3)' }}>
                                  Se asignarán en horas consecutivas
                                </span>
                              )}
                            </div>
                          )}

                          {/* Tarjetas responsivas */}
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            overflow: 'hidden',
                          }}>
                            {visitasAqui.map(v => (
                              <VisitaCard
                                key={v.id}
                                visita={v}
                                onRemove={removerVisita}
                                tecnicoColor={v.tecnico ? tecnicoColorMap[v.tecnico.id] : null}
                                onDragStartVisita={setDragVisitaId}
                                isDraggingVisita={dragVisitaId === v.id}
                              />
                            ))}
                          </div>

                          {/* Indicador de drop cuando ya hay visitas */}
                          {!bloqueada && visitasAqui.length > 0 && over && (
                            <div style={{ border: '1.5px dashed var(--accent)', borderRadius: 5, padding: '2px', textAlign: 'center', fontSize: 9, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
                              + Agregar
                            </div>
                          )}

                          {/* Badge contador si hay muchas */}
                          {visitasAqui.length > 2 && (
                            <div style={{
                              position: 'absolute', top: 3, right: 3,
                              background: 'var(--accent)', color: '#fff',
                              borderRadius: 8, fontSize: 8, fontWeight: 800,
                              padding: '1px 5px', zIndex: 2, pointerEvents: 'none',
                            }}>
                              {visitasAqui.length}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: seleccionar técnico */}
      <ModalAsignarTecnico
        open={!!pendingDrop}
        tecnicos={tecnicos}
        onConfirm={confirmarTecnico}
        onCancel={() => { setPendingDrop(null); setDragId(null); }}
        conflictosPorTecnico={(() => {
          if (!pendingDrop) return {};
          const { ordenIds, diaIndex, hora } = pendingDrop;
          const result = {};
          tecnicos.forEach(t => {
            // Chequear cada hora destino contra visitas existentes
            for (let i = 0; i < ordenIds.length; i++) {
              const horaDestino = hora + i;
              const choque = getConflicto(t.id, diaIndex, horaDestino, ordenIds[i]);
              if (choque) {
                result[t.id] = `Ocupado a las ${fmtHora(horaDestino)} con #${choque.orden.nServicio}`;
                break;
              }
            }
          });
          return result;
        })()}
      />
    </div>
  );
}