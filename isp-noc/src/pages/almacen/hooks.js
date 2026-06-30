import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sedesApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export function useSedeSeleccionada() {
  const usuario = useAuthStore(s => s.usuario);
  const esUsuarioConSede = Boolean(usuario?.sedeId);
  
  // Inicializar desde localStorage o usuario
  const [sedeId, setSedeId] = useState(() => {
    const saved = localStorage.getItem('sedeSeleccionada');
    if (usuario?.sedeId) return usuario.sedeId;
    if (saved) return saved;
    return '';
  });

  const sedesQ = useQuery({
    queryKey: ['sedes-almacen'],
    queryFn: () => sedesApi.listar().then(r => r.data),
  });
  
  const sedes = sedesQ.data || [];
  const sedePrincipal = sedes.find(s => s.esPrincipal);

  // Validar y ajustar cuando las sedes se cargan
  useEffect(() => {
    if (sedes.length === 0) return;

    const existe = sedes.some(s => s.id === sedeId);
    
    if (esUsuarioConSede) {
      if (sedeId !== usuario.sedeId) {
        setSedeId(usuario.sedeId);
        localStorage.setItem('sedeSeleccionada', usuario.sedeId);
      }
      return;
    }

    if (sedeId && existe) {
      localStorage.setItem('sedeSeleccionada', sedeId);
      return;
    }

    if (sedeId && !existe) {
      setSedeId('');
    }
    localStorage.removeItem('sedeSeleccionada');
  }, [sedes, sedeId, esUsuarioConSede, usuario?.sedeId]);

  const handleSetSedeId = (newId) => {
    setSedeId(newId);
    localStorage.setItem('sedeSeleccionada', newId);
  };

  const selected = usuario?.sedeId || sedeId || '';
  
  return { 
    usuario, 
    sedes, 
    sedePrincipal,
    sedeId: selected, 
    setSedeId: handleSetSedeId 
  };
}