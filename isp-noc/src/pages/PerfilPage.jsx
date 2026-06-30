import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Lock, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, usuariosApi } from '../services/api';
import { Card, Btn, Input, Spinner } from '../components/ui';
import { useAuthStore } from '../store/auth.store';

export default function PerfilPage() {
  const usuario       = useAuthStore(s => s.usuario);
  const updateUsuario = useAuthStore(s => s.updateUsuario);

  // ── Datos personales ─────────────────────────────────────────
  const [form, setForm] = useState({
    nombre:   usuario?.nombre   || '',
    apellido: usuario?.apellido || '',
    telefono: usuario?.telefono || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Contraseña ───────────────────────────────────────────────
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const setP = (k, v) => setPassForm(p => ({ ...p, [k]: v }));
  const [passError, setPassError] = useState('');

  // ── 2FA ──────────────────────────────────────────────────────
  const [paso2FA,    setPaso2FA]    = useState('info'); // info | qr | desactivar
  const [qrData,     setQrData]     = useState(null);
  const [manual,     setManual]     = useState('');
  const [totp,       setTotp]       = useState('');
  const [fa2Error,   setFa2Error]   = useState('');
  const [fa2Ok,      setFa2Ok]      = useState('');
  const activo2FA = usuario?.totpActivo;


  // ── Mutations ─────────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: () => usuariosApi.actualizarPerfil({
      nombre: form.nombre, apellido: form.apellido, telefono: form.telefono,
    }),
    onSuccess: () => {
      toast.success('Perfil actualizado');
      updateUsuario({ nombre: form.nombre, apellido: form.apellido, telefono: form.telefono });
    },
    onError: e => toast.error(e.response?.data?.error || 'Error al actualizar'),
  });

  const passMut = useMutation({
    mutationFn: () => authApi.cambiarPassword({
      passwordActual: passForm.actual, passwordNueva: passForm.nueva,
    }),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      setPassForm({ actual: '', nueva: '', confirmar: '' });
      setPassError('');
    },
    onError: e => toast.error(e.response?.data?.error || 'Contraseña actual incorrecta'),
  });

  const handleGuardarPerfil = () => {
    if (!form.nombre || !form.apellido) { toast.error('Nombre y apellido requeridos'); return; }
    updateMut.mutate();
  };

  const handleCambiarPass = () => {
    if (!passForm.actual)                      { setPassError('Ingresa tu contraseña actual'); return; }
    if (passForm.nueva.length < 8)             { setPassError('Mínimo 8 caracteres'); return; }
    if (!/[A-Z]/.test(passForm.nueva))         { setPassError('Debe tener al menos una mayúscula'); return; }
    if (!/[0-9]/.test(passForm.nueva))         { setPassError('Debe tener al menos un número'); return; }
    if (passForm.nueva !== passForm.confirmar)  { setPassError('Las contraseñas no coinciden'); return; }
    setPassError('');
    passMut.mutate();
  };

  // ── Handlers 2FA ─────────────────────────────────────────────
  const handleGenerar2FA = async () => {
    setFa2Error(''); setFa2Ok('');
    try {
      const { data } = await authApi.generar2fa();
      setQrData(data.qr);
      setManual(data.manual);
      setPaso2FA('qr');
    } catch (e) { setFa2Error(e.response?.data?.error || 'Error al generar QR'); }
  };

  const handleActivar2FA = async () => {
    if (totp.length !== 6) { setFa2Error('Ingresa el código de 6 dígitos'); return; }
    setFa2Error('');
    try {
      await authApi.activar2fa(totp);
      setFa2Ok('✅ 2FA activado correctamente');
      updateUsuario({ totpActivo: true });
      setTotp(''); setPaso2FA('info');
    } catch (e) { setFa2Error(e.response?.data?.error || 'Código incorrecto'); }
  };

  const handleDesactivar2FA = async () => {
    if (totp.length !== 6) { setFa2Error('Ingresa el código de 6 dígitos'); return; }
    setFa2Error('');
    try {
      await authApi.desactivar2fa(totp);
      setFa2Ok('2FA desactivado');
      updateUsuario({ totpActivo: false });
      setTotp(''); setPaso2FA('info');
    } catch (e) { setFa2Error(e.response?.data?.error || 'Código incorrecto'); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-3)',
    fontSize: 13, color: 'var(--txt)', outline: 'none', boxSizing: 'border-box',
  };

  const ROL_COLOR = {
    SUPERADMIN:   '#e3b341',
    OPERADOR_NOC: '#3b9fd4',
  };
  const rolColor = ROL_COLOR[usuario?.rol] || '#768999';

  return (
    <div style={{ padding: 28, maxWidth: 640, margin: '0 auto' }} className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--txt)' }}>
          Mi Perfil
        </h1>
        <p style={{ color: 'var(--txt-3)', fontSize: 12, marginTop: 4 }}>
          Gestiona tu información personal y seguridad
        </p>
      </div>

      {/* ── Avatar + info ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${rolColor}cc, ${rolColor}66)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
          }}>
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--txt)' }}>
              {usuario?.nombre} {usuario?.apellido}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 3 }}>{usuario?.email}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${rolColor}18`, color: rolColor, border: `1px solid ${rolColor}33` }}>
                {usuario?.rol}
              </span>
              {usuario?.sede && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: 'var(--bg-3)', color: 'var(--txt-2)', border: '1px solid var(--border)' }}>
                  📍 {usuario.sede.nombre}
                </span>
              )}
              {activo2FA && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: 'rgba(63,185,80,0.1)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.3)' }}>
                  🔐 2FA activo
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Datos personales ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader icon={<User size={15} color="var(--accent)"/>} title="Datos personales" sub="Actualiza tu información de contacto" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Input label="Nombre *"   value={form.nombre}   onChange={e => set('nombre', e.target.value)}   placeholder="Juan" />
          <Input label="Apellido *" value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Pérez" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Input label="Teléfono" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="9XXXXXXXX" />
        </div>
        <div style={{ padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--txt-3)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={13}/> {usuario?.email} — el email no es editable
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary" icon={<Save size={13}/>} onClick={handleGuardarPerfil} loading={updateMut.isPending}>
            Guardar cambios
          </Btn>
        </div>
      </Card>

      {/* ── Cambiar contraseña ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader icon={<Lock size={15} color="var(--accent)"/>} title="Cambiar contraseña" sub="Mínimo 8 caracteres, una mayúscula y un número" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <Input label="Contraseña actual" type="password" value={passForm.actual}    onChange={e => setP('actual', e.target.value)}    placeholder="••••••••" />
          <Input label="Nueva contraseña"  type="password" value={passForm.nueva}     onChange={e => setP('nueva', e.target.value)}     placeholder="Mín. 8 chars, mayúscula y número" />
          <Input label="Confirmar"          type="password" value={passForm.confirmar} onChange={e => setP('confirmar', e.target.value)} placeholder="Repite la nueva contraseña" />
        </div>
        {passError && <AlertBox color="red" msg={passError} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary" icon={<Lock size={13}/>} onClick={handleCambiarPass} loading={passMut.isPending}>
            Cambiar contraseña
          </Btn>
        </div>
      </Card>

      {/* ── 2FA ── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          icon={<Shield size={15} color={activo2FA ? '#3fb950' : 'var(--accent)'}/>}
          title="Autenticación en dos pasos (2FA)"
          sub={activo2FA ? '✅ Activado — tu cuenta está protegida' : 'Agrega seguridad extra con Google Authenticator'}
        />

        {fa2Ok    && <AlertBox color="green" msg={fa2Ok}    style={{ marginBottom: 14 }} />}
        {fa2Error && <AlertBox color="red"   msg={fa2Error} style={{ marginBottom: 14 }} />}

        {paso2FA === 'info' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {!activo2FA && (
              <Btn variant="primary" icon={<Shield size={13}/>} onClick={handleGenerar2FA}>
                Activar 2FA
              </Btn>
            )}
            {activo2FA && (
              <Btn variant="danger" onClick={() => { setPaso2FA('desactivar'); setTotp(''); setFa2Error(''); }}>
                Desactivar 2FA
              </Btn>
            )}
          </div>
        )}

        {paso2FA === 'qr' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14, lineHeight: 1.7 }}>
              1. Abre Google Authenticator<br/>
              2. Toca "+" → "Escanear código QR"<br/>
              3. Ingresa el código de 6 dígitos para confirmar
            </p>
            {qrData && <img src={qrData} alt="QR 2FA" style={{ width: 180, height: 180, display: 'block', margin: '0 auto 14px', borderRadius: 8, border: '1px solid var(--border)' }} />}
            {manual && (
              <div style={{ padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', marginBottom: 14, wordBreak: 'break-all', textAlign: 'center', border: '1px solid var(--border)' }}>
                {manual}
              </div>
            )}
            <input type="text" inputMode="numeric" maxLength={6} value={totp}
              onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
              placeholder="Código de 6 dígitos"
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 8, marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="primary" onClick={handleActivar2FA} disabled={totp.length !== 6}>
                Confirmar y activar
              </Btn>
              <Btn variant="ghost" onClick={() => { setPaso2FA('info'); setTotp(''); setFa2Error(''); }}>
                Cancelar
              </Btn>
            </div>
          </div>
        )}

        {paso2FA === 'desactivar' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>
              ⚠ Confirma con un código de tu app autenticadora para desactivar.
            </p>
            <input type="text" inputMode="numeric" maxLength={6} value={totp}
              onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
              placeholder="Código de 6 dígitos"
              style={{ ...inputStyle, textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 8, marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="danger" onClick={handleDesactivar2FA} disabled={totp.length !== 6}>
                Desactivar 2FA
              </Btn>
              <Btn variant="ghost" onClick={() => { setPaso2FA('info'); setTotp(''); setFa2Error(''); }}>
                Cancelar
              </Btn>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{sub}</div>
      </div>
    </div>
  );
}

function AlertBox({ color, msg, style: s }) {
  const colors = {
    red:   { bg: 'rgba(248,81,73,0.08)', border: 'rgba(248,81,73,0.3)', text: 'var(--red)' },
    green: { bg: 'rgba(63,185,80,0.08)', border: 'rgba(63,185,80,0.3)', text: '#3fb950' },
  };
  const c = colors[color] || colors.red;
  return (
    <div style={{ padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: c.text, marginBottom: 14, ...s }}>
      {msg}
    </div>
  );
}