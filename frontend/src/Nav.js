import { Container, Navbar, Nav, NavItem } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

function AppNav() {
  return (
    <Navbar expand="lg" className="mb-5" fixed="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>BetterTime</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <NavItem className="normal-link">
            <LinkContainer to="/">
              <Nav.Link>Rooster</Nav.Link>
            </LinkContainer>
          </NavItem>
          <NavItem className="normal-link">
            <LinkContainer to="/rooms">
              <Nav.Link>Lokalen</Nav.Link>
            </LinkContainer>
          </NavItem>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNav;
