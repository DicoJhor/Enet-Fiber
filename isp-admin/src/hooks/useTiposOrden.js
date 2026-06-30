/**
 * useTiposOrden — hook que carga la configuración de tipos de orden desde el backend.
 *
 * Reemplaza los arrays hardcodeados de helpers.js.
 * Se cachea 10 minutos — si el servidor está caído, usa el fallback estático.
 *
 * Uso:
 *   const { tipoLabel, grupos, isLoading } = useTiposOrden();
 *   tipoLabel('INSTALACION_I')   → 'Instalación Internet'
 *   grupos.INTERNET              → ['INSTALACION_I', 'AVERIA_I', ...]
 *   grupos.SOLO_NOC              → ['CORTE_DEUDA_I', ...]
 */

import { useQuery } from '@tanstack/react-query';
import { tiposOrdenApi } from '../services/api';
import { TIPO_LABEL as TIPO_LABEL_FALLBACK, TIPOS_INTERNET, TIPOS_CABLE, TIPOS_DUO, TIPOS_SOLO_NOC } from '../utils/helpers';

// Fallback estático para cuando el servidor no responde
const FALLBACK = {
  labels: TIPO_LABEL_FALLBACK,
  grupos: {
    INTERNET:        TIPOS_INTERNET,
    CABLE:           TIPOS_CABLE,
    DUO:             TIPOS_DUO,
    SOLO_NOC:        TIPOS_SOLO_NOC,
    NOC_TECNICO:     [],
    TECNICO_DIRECTO: [],
    REQUIERE_WAN:    [],
    AUTORIZA_OLT:    [],
    RETIROS:         [],
    BAJAS:           [],
    INSTALACIONES:   [],
    CORTES:          [],
    CAMBIO_EQUIPO:   [],
  },
  tipos: [],
};

export function useTiposOrden() {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['tipos-orden'],
    queryFn:   () => tiposOrdenApi.listar().then(r => r.data),
    staleTime: 10 * 60 * 1000,  // 10 minutos — cambia raramente
    gcTime:    30 * 60 * 1000,  // 30 minutos en caché
    retry:     1,
  });

  const labels  = data?.labels  ?? FALLBACK.labels;
  const grupos  = data?.grupos  ?? FALLBACK.grupos;
  const tipos   = data?.tipos   ?? FALLBACK.tipos;

  /** Devuelve el label legible de un código */
  const tipoLabel = (codigo) => labels[codigo] ?? codigo ?? '—';

  /** true si el tipo pertenece al grupo indicado */
  const esDeGrupo = (codigo, grupo) => (grupos[grupo] ?? []).includes(codigo);

  /** true si el tipo requiere WAN del NOC */
  const requiereWan    = (codigo) => esDeGrupo(codigo, 'REQUIERE_WAN');

  /** true si el tipo es retiro de equipo */
  const esRetiro       = (codigo) => esDeGrupo(codigo, 'RETIROS');

  /** true si el tipo es baja de servicio */
  const esBaja         = (codigo) => esDeGrupo(codigo, 'BAJAS');

  /** true si el tipo es instalación */
  const esInstalacion  = (codigo) => esDeGrupo(codigo, 'INSTALACIONES');

  /** true si el tipo es corte */
  const esCorte        = (codigo) => esDeGrupo(codigo, 'CORTES');

  /** true si el tipo es cambio de equipo */
  const esCambioEquipo = (codigo) => esDeGrupo(codigo, 'CAMBIO_EQUIPO');

  /** true si el tipo resuelve solo el NOC (sin técnico en campo) */
  const esSoloNoc      = (codigo) => esDeGrupo(codigo, 'SOLO_NOC');

  /** true si el tipo tiene componente Internet (para mostrar WAN/ONU) */
  const esInternet     = (codigo) => esDeGrupo(codigo, 'INTERNET');

  return {
    tipos,
    labels,
    grupos,
    isLoading,
    isError,
    // Helpers por tipo
    tipoLabel,
    esDeGrupo,
    requiereWan,
    esRetiro,
    esBaja,
    esInstalacion,
    esCorte,
    esCambioEquipo,
    esSoloNoc,
    esInternet,
  };
}