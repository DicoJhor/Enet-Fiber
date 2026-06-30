import { create } from 'zustand';
import { authApi } from '../services/api';

const cargarUsuarioInicial = () => {
  try {
    const stored = localStorage.getItem('noc_usuario');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    localStorage.removeItem('noc_usuario');
    localStorage.removeItem('noc_token');
    localStorage.removeItem('noc_refresh_token');
    return null;
  }
};

const invalidarTokenHuerfano = async (token) => {
  try {
    localStorage.setItem('noc_token', token);
    await authApi.logout();
  } catch {
    /* no nos importa si falla */
  } finally {
    localStorage.removeItem('noc_token');
  }
};

export const useAuthStore = create((set, get) => ({
  usuario:       cargarUsuarioInicial(),
  token:         localStorage.getItem('noc_token')         || null,
  refreshToken:  localStorage.getItem('noc_refresh_token') || null,
  loading:       false,
  requiere2FA:   false,   // true cuando el backend pide código TOTP
  emailPendiente: '',     // email guardado para reenviar con el código 2FA

  sedeSeleccionada: localStorage.getItem('noc_sede_sel') || '',

  setSedeSeleccionada: (sedeId) => {
    if (sedeId) localStorage.setItem('noc_sede_sel', sedeId);
    else        localStorage.removeItem('noc_sede_sel');
    set({ sedeSeleccionada: sedeId });
  },

  // ── Login paso 1: email + password ──────────────────────────
  login: async (email, password) => {
    set({ loading: true, requiere2FA: false });
    try {
      const { data } = await authApi.login({ email, password, dispositivo: 'Panel NOC' });

      // Backend pide código 2FA
      if (data.requiere2FA) {
        set({ loading: false, requiere2FA: true, emailPendiente: email });
        return { ok: false, requiere2FA: true };
      }

      if (!['SUPERADMIN', 'OPERADOR_NOC'].includes(data.usuario.rol)) {
        await invalidarTokenHuerfano(data.token);
        set({ loading: false });
        return { ok: false, error: 'No tienes acceso al panel NOC' };
      }

      localStorage.setItem('noc_token',         data.token);
      localStorage.setItem('noc_refresh_token', data.refreshToken || '');
      localStorage.setItem('noc_usuario',       JSON.stringify(data.usuario));

      set({
        token:        data.token,
        refreshToken: data.refreshToken || null,
        usuario:      data.usuario,
        loading:      false,
        requiere2FA:  false,
      });
      return { ok: true };
    } catch (err) {
      set({ loading: false });
      return { ok: false, error: err.response?.data?.error || 'Error de conexión' };
    }
  },

  // ── Login paso 2: código TOTP ────────────────────────────────
  login2FA: async (totpCodigo) => {
    const { emailPendiente } = get();
    set({ loading: true });
    try {
      // Re-enviamos la request original con el código TOTP
      // El password no lo tenemos — el usuario tiene que ingresarlo de nuevo
      // Por eso guardamos email y pedimos password + código juntos
      const { data } = await authApi.login({
        email:      emailPendiente,
        password:   get()._passwordTemp || '',
        totpCodigo,
        dispositivo: 'Panel NOC',
      });

      if (!['SUPERADMIN', 'OPERADOR_NOC'].includes(data.usuario.rol)) {
        await invalidarTokenHuerfano(data.token);
        set({ loading: false });
        return { ok: false, error: 'No tienes acceso al panel NOC' };
      }

      localStorage.setItem('noc_token',         data.token);
      localStorage.setItem('noc_refresh_token', data.refreshToken || '');
      localStorage.setItem('noc_usuario',       JSON.stringify(data.usuario));

      set({
        token:         data.token,
        refreshToken:  data.refreshToken || null,
        usuario:       data.usuario,
        loading:       false,
        requiere2FA:   false,
        emailPendiente: '',
        _passwordTemp: '',
      });
      return { ok: true };
    } catch (err) {
      set({ loading: false });
      return { ok: false, error: err.response?.data?.error || 'Código incorrecto' };
    }
  },

  // Guardar password temporalmente para el paso 2FA
  guardarPasswordTemp: (password) => set({ _passwordTemp: password }),

  logout: async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('noc_token');
    localStorage.removeItem('noc_refresh_token');
    localStorage.removeItem('noc_usuario');
    localStorage.removeItem('noc_sede_sel');
    set({ token: null, refreshToken: null, usuario: null, sedeSeleccionada: '', requiere2FA: false });
  },

  updateUsuario: (cambios) => {
    set((state) => {
      const nuevoUsuario = { ...state.usuario, ...cambios };
      localStorage.setItem('noc_usuario', JSON.stringify(nuevoUsuario));
      return { usuario: nuevoUsuario };
    });
  },
}));