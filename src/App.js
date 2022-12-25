import React, { Suspense, lazy } from 'react';
import { Container, Nav, Navbar, Spinner } from 'react-bootstrap';
import { Link, Route, Routes } from 'react-router-dom';
import { NotificationContainer } from 'react-notifications';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import SignIn from './components/SignIn';
import SignOut from './components/SignOut';
import Home from './layouts/Home';
import { useEvent } from './context/EventContext';
import './App.css';

// Split off the routes a given visit usually does not need. `SignUp` and
// `EventDetails` are each reached from a click, so a chunk fetch there is free;
// keeping them in the entry bundle is not.
const EventDetails = lazy(() => import('./components/EventDetails'));
const SignUp = lazy(() => import('./components/SignUp'));

const RouteFallback = () => (
  <div className="route-fallback" role="status" aria-label="Loading">
    <Spinner animation="border" />
  </div>
);

const App = () => {
  const {
    state: { isAuthenticated, user },
  } = useEvent();

  return (
    <>
      <Navbar expand="lg" fixed="top" className="app-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="app-navbar__brand">
            <span className="app-navbar__mark">E</span>
            Event<span className="app-navbar__brand-accent">App</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="ms-auto align-items-lg-center gap-lg-3">
              {isAuthenticated ? (
                <>
                  {user?.email && <span className="app-navbar__user">{user.email}</span>}
                  <SignOut />
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">
                    Sign in
                  </Nav.Link>
                  <Nav.Link as={Link} to="/signup" className="app-navbar__cta">
                    Sign up
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="main-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <NotificationContainer />
      <Footer />
    </>
  );
};

export default App;
