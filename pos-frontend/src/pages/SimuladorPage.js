//modificacion de plazo de 1 6 consicutivo 
//con metamap que nos deje parametrizar la consulta de datacredito, para poder modificarlas y calificarlas al cliente al cliente bien o mal
//si sale aprobado hiria a otro flujo que seria firma de documentos, de los documentos de credito
//

import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Form, Button, InputGroup, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalculator,
  faDollarSign,
  faCalendarAlt,
  faCheck,
  faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { simularCredito, validarCliente, crearCredito } from '../services/apiService';
import { OfflineContext } from '../context/OfflineContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SimuladorPage = () => {
  // Estado para simulación
  const [monto, setMonto] = useState(0);
  const [plazo, setPlazo] = useState(0);
  const [simulacion, setSimulacion] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para validación de cliente
  const [showValidacion, setShowValidacion] = useState(false);
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Estado para verificación
  const [verificacionIniciada, setVerificacionIniciada] = useState(false);
  const [verificacionCompletada, setVerificacionCompletada] = useState(false);
  
  // Estado para datos del cliente
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    apellido: '',
    email: '',
    direccion: ''
  });
  
  // Estado para la solicitud de crédito
  const [showSolicitud, setShowSolicitud] = useState(false);
  
  // Contextos
  const { offline } = useContext(OfflineContext);
  const { user } = useContext(AuthContext);

  // Calcular simulación
  const calcularSimulacion = (montoCalcular, plazoCalcular) => {
    const montoNumerico = parseInt(montoCalcular);
    
    // Aplicar cálculos según el plazo
    let tasaInteres;
    let porcentajeFGA;
    
    switch (plazoCalcular) {
      case 3:
        tasaInteres = 1.93;
        porcentajeFGA = 13.00;
        break;
      case 6:
        tasaInteres = 2.5;
        porcentajeFGA = 10.00;
        break;
      case 9:
        tasaInteres = 2.7;
        porcentajeFGA = 9.00;
        break;
      case 12:
        tasaInteres = 2.9;
        porcentajeFGA = 8.50;
        break;
      default:
        tasaInteres = 2.5;
        porcentajeFGA = 10.00;
    }
    
    
    // Cálculos financieros
    const interesesTotales = (montoNumerico * (tasaInteres / 100)) * plazoCalcular;
    const seguroVida = Math.round(montoNumerico * 0.005); // 0.5% del monto
    const totalFGA = Math.round(montoNumerico * (porcentajeFGA / 100));
    
    // Cálculo de la cuota mensual (incluyendo seguro de vida)
    const valorCuota = Math.round((montoNumerico + interesesTotales + totalFGA) / plazoCalcular);
    const totalPagar = montoNumerico + interesesTotales + totalFGA;
    
    return {
      valorVenta: montoNumerico,
      valorCuota: valorCuota,
      cuotaInicial: 0,
      numeroCuotas: plazoCalcular,
      frecuenciaPago: 'Mensual',
      tasaInteres: tasaInteres,
      interesesTotales: interesesTotales,
      porcentajeFGA: porcentajeFGA,
      totalFGA: totalFGA,
      totalPagar: totalPagar,
      seguroVida: seguroVida
    };
  };

  // Simular crédito
  const handleSimular = () => {
    if (!monto) {
      toast.error('Por favor ingrese un monto');
      return;
    }

    setLoading(true);
    try {
      // Calcular la simulación
      const resultado = calcularSimulacion(monto, plazo);
      setSimulacion(resultado);
    } catch (error) {
      console.error('Error al simular:', error);
      toast.error('Ocurrió un error al simular el crédito');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para simular inicialmente
  useEffect(() => {
    handleSimular();
  }, []);
  
  // Efecto para recalcular cuando cambia el plazo o monto
  useEffect(() => {
    handleSimular();
  }, [plazo, monto]);

  // Abrir modal de validación
  const handleSolicitar = () => {
    setShowValidacion(true);
    setVerificacionIniciada(false);
    setVerificacionCompletada(false);
    setCedula('');
    setTelefono('');
  };

  // Validar cliente
  const handleValidarCliente = () => {
    if (!cedula || !telefono) {
      toast.error('Por favor complete todos los campos');
      return;
    }
    
    setVerificacionIniciada(true);
    // El proceso de verificación lo manejará Metamap
  };
  
  // Configurar Metamap
  useEffect(() => {
    // Cargar script de Metamap
    const script = document.createElement('script');
    script.src = "https://web-button.metamap.com/button.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Limpiar script al desmontar
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  // Configurar eventos de Metamap cuando se muestra el modal
  useEffect(() => {
    if (!showValidacion) return;
    
    // Buscar el botón de Metamap después de que el modal se muestre
    const checkForMetamapButton = setInterval(() => {
      const metamapButton = document.querySelector('metamap-button');
      if (metamapButton) {
        clearInterval(checkForMetamapButton);
        
        // Evento cuando inicia la verificación
        metamapButton.addEventListener('metamap:userStartedSdk', (event) => {
          console.log('Verificación iniciada:', event.detail);
        });
        
        // Evento cuando completa la verificación
        metamapButton.addEventListener('metamap:userFinishedSdk', (event) => {
          console.log('Verificación completada:', event.detail);
          
          // Marcar como completada
          setVerificacionCompletada(true);
          
          // Obtener datos del cliente (simulado)
          setDatosCliente({
            nombre: "Oscar David",
            apellido: "Madrigal Fonnegra",
            email: "Oxkr96@gmail.com",
            direccion: "Calle Principal 123, Medellín"
          });
          
          toast.success('Verificación completada exitosamente');
        });
        
        // Evento cuando sale de la verificación
        metamapButton.addEventListener('metamap:exitedSdk', (event) => {
          console.log('Usuario salió de la verificación:', event.detail);
        });
      }
    }, 500);
    
    return () => {
      clearInterval(checkForMetamapButton);
    };
  }, [showValidacion]);
  
  // Continuar después de la validación
  const handleContinuar = () => {
    if (verificacionCompletada) {
      setShowValidacion(false);
      setShowSolicitud(true);
    } else {
      toast.error('Debe completar la verificación primero');
    }
  };
  
  // Aprobar crédito
  const handleAprobarCredito = async () => {
    setLoading(true);
    try {
      // Aquí harías la llamada a tu API para crear el crédito
      // await crearCredito({...datosCliente, monto, plazo});
      
      toast.success('Crédito aprobado exitosamente');
      setShowSolicitud(false);
      
      // Limpiar formulario
      setMonto('200000');
      setPlazo(3);
      setCedula('');
      setTelefono('');
      setVerificacionCompletada(false);
      setVerificacionIniciada(false);
      setDatosCliente({
        nombre: '',
        apellido: '',
        email: '',
        direccion: ''
      });
    } catch (error) {
      console.error('Error al aprobar crédito:', error);
      toast.error('Ocurrió un error al aprobar el crédito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Simulador</h1>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Simulador</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Monto a financiar</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group mt-3">
                <label>Plazo (en cuotas)</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-${plazo === 3 ? 'primary' : 'outline-secondary'} flex-fill`}
                    onClick={() => setPlazo(3)}
                  >
                    3
                  </button>
                  <button
                    type="button"
                    className={`btn btn-${plazo === 6 ? 'primary' : 'outline-secondary'} flex-fill`}
                    onClick={() => setPlazo(6)}
                  >
                    6
                  </button>
                  <button
                    type="button"
                    className={`btn btn-${plazo === 9 ? 'primary' : 'outline-secondary'} flex-fill`}
                    onClick={() => setPlazo(9)}
                  >
                    9
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-primary w-100 mt-3"
                onClick={handleSimular}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faCalculator} className="me-2" />
                Calcular
              </button>
              
              {simulacion && (
                <div className="text-center mt-4">
                  <h4>Valor de cuota:</h4>
                  <h2 className="text-primary">$ {simulacion.valorCuota.toLocaleString()}</h2>
                </div>
              )}
              
              <button
                type="button"
                className="btn btn-success w-100 mt-3"
                onClick={handleSolicitar}
              >
                Solicitar
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Detalle de la simulación</h3>
            </div>
            <div className="card-body">
              {simulacion && (
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td>Valor de la venta</td>
                        <td className="text-end">$ {parseInt(monto).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Valor de la cuota</td>
                        <td className="text-end">$ {simulacion.valorCuota.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Cuota inicial</td>
                        <td className="text-end">$ {simulacion.cuotaInicial.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>N. cuotas</td>
                        <td className="text-end">{simulacion.numeroCuotas}</td>
                      </tr>
                      <tr>
                        <td>Frecuencia de pago</td>
                        <td className="text-end">{simulacion.frecuenciaPago}</td>
                      </tr>
                      <tr>
                        <td>Tasa de interés</td>
                        <td className="text-end">{simulacion.tasaInteres}%</td>
                      </tr>
                      <tr>
                        <td>Total de intereses</td>
                        <td className="text-end">$ {Math.round(simulacion.interesesTotales).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Porcentaje FGA</td>
                        <td className="text-end">{simulacion.porcentajeFGA.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td>Total de FGA</td>
                        <td className="text-end">$ {simulacion.totalFGA.toLocaleString()}</td>
                      </tr>
                      <tr className="table-active">
                        <td><strong>Total a pagar</strong></td>
                        <td className="text-end"><strong>$ {Math.round(simulacion.totalPagar).toLocaleString()}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="alert alert-info mt-3">
                <strong>Información importante</strong>
                <p className="mb-0">Esta simulación es solo informativa y los valores pueden variar según la evaluación del cliente. El porcentaje FGA depende de la calificación que arroje las políticas internas y datacredito. Ejemplo: excelente hábito de pago FGA 8% + IVA.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Validación de Cliente */}
      <Modal show={showValidacion} onHide={() => setShowValidacion(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Validación de Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Número de Cédula</Form.Label>
              <Form.Control
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ingrese número de cédula"
                disabled={verificacionIniciada}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ingrese número de teléfono"
                disabled={verificacionIniciada}
              />
            </Form.Group>
            
            <div id="verificacion-container" className="text-center mt-4">
              {!verificacionIniciada ? (
                <p>Para continuar con la solicitud, se requiere verificar su identidad.</p>
              ) : verificacionCompletada ? (
                <p className="text-success">
                  <FontAwesomeIcon icon={faCircleCheck} className="me-2" />
                  Verificación completada exitosamente
                </p>
              ) : (
                <p>Por favor complete el proceso de verificación.</p>
              )}
              
              {verificacionIniciada && !verificacionCompletada && (
                <metamap-button
                  clientid="67e844f12f057303ed9e7b54"
                  flowid="67e844f155e2997603974699"
                  metadata={JSON.stringify({
                    cedula: cedula,
                    telefono: telefono,
                    source: "simulador_creditos"
                  })}
                ></metamap-button>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {!verificacionIniciada ? (
            <>
              <Button variant="secondary" onClick={() => setShowValidacion(false)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleValidarCliente}
                disabled={!cedula || !telefono}
              >
                Verificarme
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowValidacion(false)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleContinuar}
                disabled={!verificacionCompletada}
              >
                Continuar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      
      {/* Modal de Detalle del Crédito */}
      <Modal show={showSolicitud} onHide={() => setShowSolicitud(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle del Crédito</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-success mb-4">
            <FontAwesomeIcon icon={faCircleCheck} className="me-2" />
            Identidad verificada exitosamente
          </div>
          
          <h5>Datos del Cliente:</h5>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label>Cédula</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={cedula} 
                  readOnly 
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label>Teléfono</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={telefono} 
                  readOnly 
                />
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label>Nombre</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={datosCliente.nombre} 
                  readOnly 
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label>Apellido</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={datosCliente.apellido} 
                  readOnly 
                />
              </div>
            </div>
          </div>
          
          <div className="form-group mb-3">
            <label>Email</label>
            <input 
              type="text" 
              className="form-control"
              value={datosCliente.email} 
              readOnly 
            />
          </div>
          
          <div className="form-group mb-3">
            <label>Dirección</label>
            <input 
              type="text" 
              className="form-control"
              value={datosCliente.direccion} 
              readOnly 
            />
          </div>
          
          <h5 className="mt-4">Detalle del crédito:</h5>
          {simulacion && (
            <table className="table table-bordered mt-2">
              <tbody>
                <tr>
                  <td>Valor de la venta</td>
                  <td className="text-end">$ {parseInt(monto).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Valor de la cuota</td>
                  <td className="text-end">$ {simulacion.valorCuota.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Cuota inicial</td>
                  <td className="text-end">$ {simulacion.cuotaInicial.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>N. cuotas</td>
                  <td className="text-end">{simulacion.numeroCuotas}</td>
                </tr>
                <tr>
                  <td>Frecuencia de pago</td>
                  <td className="text-end">{simulacion.frecuenciaPago}</td>
                </tr>
                <tr>
                  <td>Tasa de interés</td>
                  <td className="text-end">{simulacion.tasaInteres}%</td>
                </tr>
                <tr>
                  <td>Total de intereses</td>
                  <td className="text-end">$ {Math.round(simulacion.interesesTotales).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Porcentaje FGA</td>
                  <td className="text-end">{simulacion.porcentajeFGA.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td>Total de FGA</td>
                  <td className="text-end">$ {simulacion.totalFGA.toLocaleString()}</td>
                </tr>
                <tr className="table-active">
                  <td><strong>Total a pagar</strong></td>
                  <td className="text-end"><strong>$ {Math.round(simulacion.totalPagar).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSolicitud(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAprobarCredito}
            disabled={loading}
          >
            Continuar
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default SimuladorPage;