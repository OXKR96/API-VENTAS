// src/context/OfflineContext.js
import React, { createContext, useState, useEffect } from 'react';

export const OfflineContext = createContext();

const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [lastSync, setLastSync] = useState(localStorage.getItem('lastSync') || null);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar operaciones pendientes
    const stored = localStorage.getItem('pendingOperations');
    if (stored) {
      setPendingOperations(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar cambios en operaciones pendientes
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // Función para agregar operación pendiente
  const addPendingOperation = (operation) => {
    setPendingOperations([...pendingOperations, { ...operation, id: Date.now() }]);
  };

  // Función para sincronizar operaciones pendientes
  const syncPendingOperations = async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    // Procesar operaciones pendientes (implementar lógica según tus necesidades)
    const newPendingOperations = [...pendingOperations];
    let syncSuccess = true;

    for (let i = 0; i < newPendingOperations.length; i++) {
      const op = newPendingOperations[i];
      
      try {
        // Implementar lógica según el tipo de operación
        switch (op.type) {
          case 'CREDITO':
            // Lógica para sincronizar crédito
            break;
          case 'ABONO':
            // Lógica para sincronizar abono 
            break;
          default:
            break;
        }
        
        // Quitar de la lista si se sincroniza correctamente
        newPendingOperations.splice(i, 1);
        i--; // Ajustar índice
      } catch (error) {
        console.error('Error sincronizando operación:', error);
        syncSuccess = false;
      }
    }

    // Actualizar lista de operaciones pendientes
    setPendingOperations(newPendingOperations);
    
    // Actualizar fecha de última sincronización
    if (syncSuccess) {
      const now = new Date().toISOString();
      localStorage.setItem('lastSync', now);
      setLastSync(now);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingOperations,
        lastSync,
        addPendingOperation,
        syncPendingOperations
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineProvider;