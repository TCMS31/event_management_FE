import React, { useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { BsFillPersonFill, BsLockFill } from 'react-icons/bs';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import { login } from '../services/authService';
import { useEvent } from '../context/EventContext';
import 'react-notifications/lib/notifications.css';

/**
 * Sign-in form.
 *
 * Two things were wrong here and both are fixed: the inputs were bound to
 * `formData.email` while the state lived at `formData.user.email`, so they were
 * permanently uncontrolled; and the success path ran regardless of whether a
 * token actually came back. `authService.login` now throws when the
 * `Authorization` header is absent, so a tokenless "success" cannot sign
 * anybody in.
 */
const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch, tokenStore } = useEvent();

  const [fields, setFields] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const session = await login(fields);
      tokenStore.save(session);
      dispatch({ type: 'SIGN_IN', payload: session });
      NotificationManager.success('Signed in. Taking you to your events.', 'Success');
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      NotificationManager.error(loginError.message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="auth-page">
      <Row className="justify-content-center">
        <Col md={7} lg={5}>
          <Form onSubmit={handleSubmit} className="auth-card">
            <h1 className="auth-card__title">Sign in</h1>
            <p className="auth-card__subtitle">Manage the events you run and the ones you join.</p>

            {error && (
              <Alert variant="danger" role="alert">
                {error}
              </Alert>
            )}

            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsFillPersonFill aria-hidden="true" />
                </span>
                <Form.Control
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-4">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsLockFill aria-hidden="true" />
                </span>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={fields.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Signing in
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="auth-card__footer">
              No account yet? <Link to="/signup">Create one</Link>.
            </p>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default SignIn;
