import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, 
  faUser, 
  faChartPie, 
  faCalculator, 
  faClipboardList, 
  faBuilding, 
  faFileInvoiceDollar, 
  faUsers, 
  faUserFriends 
} from '@fortawesome/free-solid-svg-icons';

const Layout = ({ children }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarLink = ({ to, icon, children }) => {
    const isActive = location.pathname === to;
    
    return (
      <Nav.Link 
        as={Link} 
        to={to} 
        className={`sidebar-link d-flex align-items-center px-4 py-3 text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FontAwesomeIcon 
          icon={icon} 
          className={`me-4 ${isActive ? 'text-primary' : 'text-muted'}`}
          size="lg"
          fixedWidth
        />
        <span className="sidebar-link-text">{children}</span>
      </Nav.Link>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar Superior */}
      <Navbar 
        bg="white" 
        expand="lg" 
        className="border-bottom shadow-sm py-2"
      >
        <Container fluid className="px-4">
          <Navbar.Brand 
            as={Link} 
            to="/dashboard" 
            className="fw-bold text-primary"
          >
            CREDITOS
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Nav className="align-items-center">
              {userInfo && (
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="me-2 text-muted" 
                      size="lg"
                    />
                    <span className="text-muted">
                      {userInfo.nombre} {userInfo.apellido}
                    </span>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={handleLogout}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon 
                      icon={faSignOutAlt} 
                      className="me-2"
                    />
                    Cerrar Sesión
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Contenido Principal con Sidebar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar Lateral */}
        <div 
          className="sidebar bg-light border-end" 
          style={{ 
            width: "280px", 
            minHeight: "calc(100vh - 60px)" 
          }}
        >
          <Nav className="flex-column pt-4">
            <SidebarLink to="/dashboard" icon={faChartPie}>
              Dashboard
            </SidebarLink>
            <SidebarLink to="/simulador" icon={faCalculator}>
              Simulador
            </SidebarLink>

            {userInfo && (userInfo.tipo === 'Administrativo' || userInfo.tipo === 'Super Usuario') && (
              <>
                <SidebarLink to="/operaciones" icon={faClipboardList}>
                  Operaciones
                </SidebarLink>
                <SidebarLink to="/sucursales" icon={faBuilding}>
                  Sucursales
                </SidebarLink>
                <SidebarLink to="/liquidacion" icon={faFileInvoiceDollar}>
                  Liquidación
                </SidebarLink>
                <SidebarLink to="/clientes" icon={faUserFriends}>
                  Clientes
                </SidebarLink>
              </>
            )}

            {userInfo && (userInfo.tipo === 'Super Usuario' || userInfo.tipo === 'Administrativo') && (
              <SidebarLink to="/usuarios" icon={faUsers}>
                Usuarios
              </SidebarLink>
            )}
          </Nav>
        </div>

        {/* Área de Contenido Principal */}
        <div className="flex-grow-1 bg-light bg-opacity-10 p-4">
          {children}
        </div>
      </div>

      {/* Estilos personalizados */}
      <style jsx>{`
        .sidebar-link {
          transition: all 0.2s ease;
          font-size: 1.2rem;
          font-weight: 500;
          color: #495057;
        }
        .sidebar-link:hover {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }
        .sidebar-link.active {
          background-color: rgba(13, 110, 253, 0.15);
          color: #0d6efd;
          font-weight: 600;
        }
        .sidebar-link.active .text-muted {
          color: #0d6efd !important;
        }
        .sidebar-link-text {
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default Layout;