import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, XCircle, Wifi, MapPin, Clock, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { instalacionesApi } from '../services/api';
import { Card, Btn, Modal, Spinner, Empty } from '../components/ui';
import { fmtFechaHora } from '../utils/helpers';
import { useTiposOrden } from '../hooks/useTiposOrden';
import { useAuthStore } from '../store/auth.store';

// ─────────────────────────────────────────────────────────────
// MODAL CONFIRMACIÓN — con SN editable (autorización vía OLT)
// ─────────────────────────────────────────────────────────────
function ModalAutorizar({ open, onClose, config, onConfirmar, loading, tipoLabel }) {

  const [serialNumber, setSerialNumber] = useState('');
  const [snModified,   setSnModified]   = useState(false);
  
  const orden      = config?.instalacion?.orden;
  const snOriginal = config?.serialNumber || '';

  useEffect(() => {
    if (config) {
      setSerialNumber(snOriginal);
      setSnModified(false);
    }
  }, [config?.id]);

  if (!config) return null;

  const handleSubmit = () => {
    const sn = serialNumber.trim().toUpperCase();
    if (!sn) { toast.error('El SN no puede estar vacío'); return; }
    const payload = snModified ? { serialNumber: sn } : {};
    onConfirmar(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title="Autorizar ONU en OLT" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{orden?.abonado || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>Orden #{orden?.nServicio} · {tipoLabel(orden?.tipoOrden)}</div>
          {orden?.sede && (
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11}/> {orden.sede.nombre}
            </div>
          )}
        </div>

        {config.errorOlt && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', fontSize: 12, color: '#D97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
              <AlertTriangle size={12}/> Error en el intento automático
            </div>
            <div>{config.errorOlt}</div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Serial Number
            {snModified && (
              <span style={{ color: '#D97706', marginLeft: 8, textTransform: 'none', letterSpacing: 'normal' }}>✏ modificado</span>
            )}
          </label>
          <input
            value={serialNumber}
            onChange={e => {
              setSerialNumber(e.target.value);
              setSnModified(e.target.value.trim().toUpperCase() !== snOriginal.toUpperCase());
            }}
            onBlur={e => setSerialNumber(e.target.value.trim().toUpperCase())}
            placeholder="XPON123456789"
            disabled={loading}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-3)',
              border: snModified ? '2px solid #D97706' : '1px solid var(--border-2)',
              borderRadius: 8, color: 'var(--txt)',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
              outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6 }}>
            💡 Si el técnico cargó mal el SN, modificalo aquí antes de autorizar.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleSubmit} loading={loading} icon={<ShieldCheck size={14}/>}>
            {loading ? 'Autorizando...' : 'Autorizar en OLT'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL CONFIRMACIÓN — Marcar como activa SIN OLT
// (para Dixon y otros casos auto-aprovisionados)
// ─────────────────────────────────────────────────────────────
function ModalMarcarActiva({ open, onClose, config, onConfirmar, loading }) {
  if (!config) return null;
  const orden = config.instalacion?.orden;

  return (
    <Modal open={open} onClose={onClose} title="Marcar ONU como activa" width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{orden?.abonado || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
            Orden #{orden?.nServicio} · SN: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{config.serialNumber || '—'}</span>
          </div>
          {orden?.sede && (
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11}/> {orden.sede.nombre}
            </div>
          )}
        </div>

        {/* Advertencia / info */}
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
          fontSize: 12, color: '#16A34A',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
            <CheckCheck size={13}/> Marcar como activa sin tocar la OLT
          </div>
          <div style={{ color: 'var(--txt-2)', lineHeight: 1.5 }}>
            Usá esto cuando la ONU ya está funcionando por fuera del sistema — por ejemplo, una OLT que auto-aprovisiona (Dixon), o si la activaste manualmente desde otra herramienta.
          </div>
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)',
          fontSize: 11, color: '#D97706',
        }}>
          ⚠ Esta acción NO autoriza en ninguna OLT del sistema. Solo limpia la pendiente.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
          <Btn
            variant="primary"
            onClick={() => onConfirmar()}
            loading={loading}
            icon={<CheckCheck size={14}/>}
            style={{ background: '#16A34A', borderColor: '#16A34A' }}>
            {loading ? 'Procesando...' : 'Sí, marcar como activa'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL RESULTADO
// ─────────────────────────────────────────────────────────────
function ModalResultado({ open, onClose, resultado, abonado }) {
  if (!resultado) return null;
  return (
    <Modal open={open} onClose={onClose} title="Resultado" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: resultado.ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {resultado.ok ? <CheckCircle size={32} color="#16A34A"/> : <XCircle size={32} color="#DC2626"/>}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
            {resultado.ok
              ? (resultado.omitirOlt ? '✅ Marcada como activa' : '✅ ONU autorizada correctamente')
              : '❌ No se pudo procesar'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>{abonado}</div>
        </div>

        {resultado.ok && !resultado.omitirOlt && (
          <div style={{ width: '100%', background: 'var(--bg-3)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 12 }}>
              <span style={{ color: 'var(--txt-3)' }}>OLT</span>
              <span style={{ fontWeight: 600, color: 'var(--txt)' }}>{resultado.oltNombre}</span>
              <span style={{ color: 'var(--txt-3)' }}>Puerto</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{resultado.puertoCompleto}</span>
              <span style={{ color: 'var(--txt-3)' }}>ONU ID</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{resultado.onuId}</span>
            </div>
          </div>
        )}

        {resultado.ok && resultado.omitirOlt && (
          <div style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', fontSize: 12, color: 'var(--txt-2)' }}>
            La instalación se marcó como autorizada en el sistema. No se realizó ninguna acción en la OLT.
          </div>
        )}

        {!resultado.ok && (
          <div style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 12, color: '#DC2626' }}>
            {resultado.error || resultado.motivo || 'Error desconocido'}
          </div>
        )}

        <Btn variant="primary" onClick={onClose} style={{ width: '100%' }}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// TARJETA ONU PENDIENTE
// ─────────────────────────────────────────────────────────────
function OnuCard({ config, onAutorizar, onMarcarActiva, tipoLabel }) {
  const orden = config.instalacion?.orden;

  const estadoColor = {
    PENDIENTE_OLT: { bg: 'rgba(217,119,6,0.08)', color: '#D97706', label: 'Pendiente OLT' },
    ERROR_OLT:     { bg: 'rgba(220,38,38,0.08)', color: '#DC2626', label: 'Error OLT'     },
    AUTORIZADA:    { bg: 'rgba(22,163,74,0.08)', color: '#16A34A', label: 'Autorizada'    },
  }[config.estadoOlt] || { bg: 'rgba(217,119,6,0.08)', color: '#D97706', label: config.estadoOlt };

  return (
    <Card style={{ borderLeft: `3px solid ${estadoColor.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)', marginBottom: 4 }} className="truncate">
            {orden?.abonado || '—'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: estadoColor.bg, color: estadoColor.color }}>
              {estadoColor.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--txt-3)', padding: '2px 8px', borderRadius: 20, background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              {tipoLabel(orden?.tipoOrden)}
            </span>
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: estadoColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wifi size={18} color={estadoColor.color}/>
        </div>
      </div>

      {/* Info ONU */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, flexShrink: 0 }}>Serial</span>
          <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{config.serialNumber || '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, flexShrink: 0 }}>VLAN</span>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--txt-2)' }}>{config.vlan || '100 (defecto)'}</span>
        </div>
        {orden?.sede && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, flexShrink: 0 }}>Sede</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} color="var(--txt-3)"/>
              <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{orden.sede.nombre}</span>
            </div>
          </div>
        )}
        {orden?.nServicio && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 60, flexShrink: 0 }}>Orden</span>
            <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>#{orden.nServicio}</span>
          </div>
        )}
        {config.errorOlt && (
          <div style={{ fontSize: 11, color: '#DC2626', padding: '6px 10px', background: 'rgba(220,38,38,0.06)', borderRadius: 7, border: '1px solid rgba(220,38,38,0.2)', marginTop: 4 }}>
            ⚠ {config.errorOlt}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--txt-3)', marginBottom: 14 }}>
        <Clock size={11}/>
        {fmtFechaHora(config.updatedAt)}
      </div>

      {/* Botones */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn
          variant="primary"
          size="sm"
          icon={<ShieldCheck size={12}/>}
          onClick={() => onAutorizar(config)}
          style={{ width: '100%' }}>
          Revisar y autorizar en OLT
        </Btn>
        <button
          onClick={() => onMarcarActiva(config)}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 7, cursor: 'pointer',
            background: 'transparent', color: '#16A34A',
            fontSize: 11, fontWeight: 600,
            border: '1px solid rgba(22,163,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <CheckCheck size={11}/> Marcar como activa (sin OLT)
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function OnusPendientesPage() {
  const qc = useQueryClient();
  const { tipoLabel } = useTiposOrden();
  const sedeSel = useAuthStore(s => s.sedeSeleccionada);
  const [ordenAutorizar, setOrdenAutorizar] = useState(null);
  const [ordenMarcar,    setOrdenMarcar]    = useState(null);
 const [modalResult,    setModalResult]    = useState(null);
  const [spinning,       setSpinning]       = useState(false);

  const { data: pendientes = [], isLoading, refetch } = useQuery({
    queryKey: ['onus-pendientes-olt', sedeSel],
    queryFn:  () => instalacionesApi.pendientesOlt(sedeSel).then(r => r.data),
    refetchInterval: 30000,
  });

  // Mutación 1: autorizar en OLT (con SN editable)
  const autorizarMut = useMutation({
    mutationFn: ({ instalacionId, payload }) => instalacionesApi.autorizarOlt(instalacionId, payload),
    onSuccess: (res, vars) => {
      setOrdenAutorizar(null);
      setModalResult({ resultado: res.data, abonado: vars.abonado });
      qc.invalidateQueries(['onus-pendientes-olt']);
    },
    onError: (err, vars) => {
      setOrdenAutorizar(null);
      setModalResult({
        resultado: { ok: false, error: err.response?.data?.error || 'Error al autorizar' },
        abonado:   vars.abonado,
      });
      qc.invalidateQueries(['onus-pendientes-olt']);
    },
  });

  // Mutación 2: marcar como activa sin OLT
  const marcarActivaMut = useMutation({
    mutationFn: ({ instalacionId }) => instalacionesApi.autorizarOlt(instalacionId, { omitirOlt: true }),
    onSuccess: (res, vars) => {
      setOrdenMarcar(null);
      setModalResult({ resultado: res.data, abonado: vars.abonado });
      qc.invalidateQueries(['onus-pendientes-olt']);
    },
    onError: (err, vars) => {
      setOrdenMarcar(null);
      setModalResult({
        resultado: { ok: false, error: err.response?.data?.error || 'Error al marcar' },
        abonado:   vars.abonado,
      });
      qc.invalidateQueries(['onus-pendientes-olt']);
    },
  });

  const handleConfirmarAutorizar = (payload) => {
    if (!ordenAutorizar) return;
    autorizarMut.mutate({
      instalacionId: ordenAutorizar.instalacionId,
      payload,
      abonado:       ordenAutorizar.instalacion?.orden?.abonado || '—',
    });
  };

  const handleConfirmarMarcar = () => {
    if (!ordenMarcar) return;
    marcarActivaMut.mutate({
      instalacionId: ordenMarcar.instalacionId,
      abonado:       ordenMarcar.instalacion?.orden?.abonado || '—',
    });
  };

  const pendientesFiltrados = pendientes.filter(p =>
    p.estadoOlt === 'PENDIENTE_OLT' || p.estadoOlt === 'ERROR_OLT'
  );

  const totalPendientes = pendientesFiltrados.length;
  const totalError      = pendientes.filter(p => p.estadoOlt === 'ERROR_OLT').length;

  return (
    <div style={{ padding: 24 }} className="animate-fade">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--txt)' }}>
            ONUs Pendientes OLT
          </h1>
          <p style={{ color: 'var(--txt-3)', fontSize: 12, marginTop: 4 }}>
            {totalPendientes} pendiente{totalPendientes !== 1 ? 's' : ''} de autorizar
            {totalError > 0 && <span style={{ color: '#DC2626', marginLeft: 8 }}>· {totalError} con error</span>}
          </p>
        </div>
<Btn variant="ghost" size="sm" icon={<span style={{ display: 'inline-flex' }} className={spinning ? 'spin' : ''}><RefreshCw size={13}/></span>} onClick={async () => { setSpinning(true); await refetch(); setTimeout(() => setSpinning(false), 600); }}>Actualizar</Btn>      </div>

      {totalPendientes > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
          <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }}/>
          <div style={{ fontSize: 12, color: '#D97706' }}>
            <span style={{ fontWeight: 600 }}>{totalPendientes} ONU{totalPendientes !== 1 ? 's' : ''} completadas por el técnico</span>
            {' '}pero sin autorizar en la OLT. Autorizá vía OLT o marcá como activa si ya se auto-aprovisionó (Dixon).
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28}/></div>
      ) : pendientesFiltrados.length === 0 ? (
        <Empty icon="✅" title="Todo al día" subtitle="No hay ONUs pendientes de autorizar"/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {pendientesFiltrados.map(config => (
            <OnuCard
              key={config.id}
              config={config}
              onAutorizar={setOrdenAutorizar}
              onMarcarActiva={setOrdenMarcar}
              tipoLabel={tipoLabel}
            />
          ))}
        </div>
      )}

      <ModalAutorizar
        open={!!ordenAutorizar}
        onClose={() => !autorizarMut.isPending && setOrdenAutorizar(null)}
        config={ordenAutorizar}
        onConfirmar={handleConfirmarAutorizar}
        loading={autorizarMut.isPending}
        tipoLabel={tipoLabel}
      />

      <ModalMarcarActiva
        open={!!ordenMarcar}
        onClose={() => !marcarActivaMut.isPending && setOrdenMarcar(null)}
        config={ordenMarcar}
        onConfirmar={handleConfirmarMarcar}
        loading={marcarActivaMut.isPending}
      />

      <ModalResultado
        open={!!modalResult}
        onClose={() => setModalResult(null)}
        resultado={modalResult?.resultado}
        abonado={modalResult?.abonado}
      />
    </div>
  );
}