// src/services/localStorageService.js
// Claves para localStorage
export const STORAGE_KEYS = {
    USER_INFO: 'userInfo',
    CREDITOS: 'creditos',
    CLIENTES: 'clientes',
    ABONOS: 'abonos',
    SUCURSALES: 'sucursales',
    USUARIOS: 'usuarios',
    PENDING_OPERATIONS: 'pendingOperations',
    LAST_SYNC: 'lastSync'
  };
  
  // Operaciones básicas
  export const getItemFromStorage = (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error al obtener ${key} de localStorage:`, error);
      return null;
    }
  };
  
  export const setItemInStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error al guardar ${key} en localStorage:`, error);
      return false;
    }
  };
  
  export const removeItemFromStorage = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error al eliminar ${key} de localStorage:`, error);
      return false;
    }
  };
  
  // Funciones específicas para cada entidad
  export const generateTempId = () => `temp_${Date.now()}`;
  
  // Gestión de créditos
  export const getCreditosFromStorage = () => {
    return getItemFromStorage(STORAGE_KEYS.CREDITOS) || [];
  };
  
  export const getClientesFromStorage = () => {
    return getItemFromStorage(STORAGE_KEYS.CLIENTES) || [];
  };
  
  export const getAbonosFromStorage = () => {
    return getItemFromStorage(STORAGE_KEYS.ABONOS) || [];
  };
  
  export const saveCreditoToStorage = (credito) => {
    const creditos = getCreditosFromStorage();
    
    if (!credito._id) {
      credito._id = generateTempId();
      credito._temp = true;
    }
    
    const updatedCreditos = [...creditos, credito];
    return setItemInStorage(STORAGE_KEYS.CREDITOS, updatedCreditos);
  };
  
  export const saveClienteToStorage = (cliente) => {
    const clientes = getClientesFromStorage();
    
    // Verificar si ya existe
    const existingIndex = clientes.findIndex(c => c.cedula === cliente.cedula);
    
    if (existingIndex !== -1) {
      clientes[existingIndex] = { ...clientes[existingIndex], ...cliente };
    } else {
      if (!cliente._id) {
        cliente._id = generateTempId();
        cliente._temp = true;
      }
      clientes.push(cliente);
    }
    
    return setItemInStorage(STORAGE_KEYS.CLIENTES, clientes);
  };
  
  export const saveAbonoToStorage = (abono) => {
    const abonos = getAbonosFromStorage();
    
    if (!abono._id) {
      abono._id = generateTempId();
      abono._temp = true;
    }
    
    const updatedAbonos = [...abonos, abono];
    return setItemInStorage(STORAGE_KEYS.ABONOS, updatedAbonos);
  };
  
  export const saveSucursalesToStorage = (sucursales) => {
    return setItemInStorage(STORAGE_KEYS.SUCURSALES, sucursales);
  };
  
  export const saveUsuariosToStorage = (usuarios) => {
    return setItemInStorage(STORAGE_KEYS.USUARIOS, usuarios);
  };