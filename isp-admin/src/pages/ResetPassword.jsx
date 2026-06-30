import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const tokenInicial   = params.get('token') || '';

  const [token,    setToken]    = useState(tokenInicial);
  const [nueva,    setNueva]    = useState('');
  const [confirmar,setConfirmar]= useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [exito,    setExito]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim())                    { setError('Ingresa el token de recuperación'); return; }
    if (nueva.length < 8)                 { setError('Mínimo 8 caracteres'); return; }
    if (!/[A-Z]/.test(nueva))             { setError('Debe contener al menos una mayúscula'); return; }
    if (!/[0-9]/.test(nueva))             { setError('Debe contener al menos un número'); return; }
    if (nueva !== confirmar)              { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: token.trim(), passwordNueva: nueva }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Token inválido o expirado'); return; }
      setExito(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #C8DAEA', background: '#F4F8FC',
    fontSize: 13, color: '#0D1B2A', outline: 'none',
    transition: 'border-color .15s', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F4F8FC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, marginBottom: 14,
            background: '#fff', border: '1px solid #C8DAEA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30,58,138,0.1)',
          }}>
            <img src="/logo-e.png" alt="Enet" style={{ width: 40, height: 40, objectFit: 'contain' }}
              onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:24px;font-weight:900;color:#1E3A8A">E</span>'; }}/>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0D1B2A', margin: 0 }}>Enet Fiber Perú</h1>
          <p style={{ fontSize: 12, color: '#5A7A9A', marginTop: 4 }}>Recuperación de contraseña</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 20,
          border: '1px solid #E2ECF4', padding: 28,
          boxShadow: '0 8px 32px rgba(30,58,138,0.08)',
        }}>

          {/* Éxito */}
          {exito ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={48} color="#16A34A" style={{ marginBottom: 16 }}/>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0D1B2A', margin: '0 0 8px' }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ fontSize: 13, color: '#5A7A9A', margin: '0 0 20px' }}>
                Tu contraseña fue cambiada correctamente. Serás redirigido al login en unos segundos.
              </p>
              <button onClick={() => navigate('/login')}
                style={{ padding: '10px 24px', borderRadius: 10, background: '#1E3A8A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Ir al login
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0D1B2A', margin: '0 0 4px' }}>Nueva contraseña</h2>
              <p style={{ fontSize: 12, color: '#8AAABB', margin: '0 0 24px' }}>
                Ingresa el token que te compartió el administrador y tu nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Token */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4A6A8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Token de recuperación
                  </label>
                  <textarea
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Pega aquí el token que te enviaron..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}
                    onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                    onBlur={e  => e.target.style.borderColor = '#C8DAEA'}
                  />
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4A6A8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nueva contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={nueva}
                      onChange={e => setNueva(e.target.value)}
                      placeholder="Mín. 8 chars, mayúscula y número"
                      style={{ ...inputStyle, paddingRight: 40 }}
                      onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                      onBlur={e  => e.target.style.borderColor = '#C8DAEA'}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8AAABB', padding: 0 }}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {/* Indicadores de política */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    {[
                      { ok: nueva.length >= 8,       label: '8+ chars' },
                      { ok: /[A-Z]/.test(nueva),     label: 'Mayúscula' },
                      { ok: /[0-9]/.test(nueva),     label: 'Número' },
                    ].map(({ ok, label }) => (
                      <span key={label} style={{ fontSize: 11, fontWeight: 600, color: ok ? '#16A34A' : '#8AAABB', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {ok ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confirmar */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4A6A8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    style={{ ...inputStyle, borderColor: confirmar && confirmar !== nueva ? '#DC2626' : undefined }}
                    onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                    onBlur={e  => e.target.style.borderColor = confirmar && confirmar !== nueva ? '#DC2626' : '#C8DAEA'}
                  />
                </div>

                {error && (
                  <div style={{ fontSize: 12, color: '#DC2626', padding: '10px 14px', background: 'rgba(220,38,38,0.07)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)', borderLeft: '3px solid #DC2626' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: 12, borderRadius: 10,
                    background: loading ? '#93AECB' : '#1E3A8A',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> Actualizando…</> : 'Cambiar contraseña'}
                </button>

                <button type="button" onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#8AAABB', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                  ← Volver al login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}