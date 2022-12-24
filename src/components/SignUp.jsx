import React, { useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { BsEnvelopeFill, BsFillPersonFill, BsLockFill } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import { signUp } from '../services/authService';
import 'react-notifications/lib/notifications.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
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
      await signUp(fields);
      NotificationManager.success('Account created. Please sign in.', 'Success');
      navigate('/login');
    } catch (signUpError) {
      setError(signUpError.message);
      NotificationManager.error(signUpError.message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="auth-page">
      <Row className="justify-content-center">
        <Col md={7} lg={5}>
          <Form onSubmit={handleSubmit} className="auth-card">
            <h1 className="auth-card__title">Create an account</h1>
            <p className="auth-card__subtitle">It takes about twenty seconds.</p>

            {error && (
              <Alert variant="danger" role="alert">
                {error}
              </Alert>
            )}

            <Form.Group controlId="formName" className="mb-3">
              <Form.Label>Name</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsFillPersonFill aria-hidden="true" />
                </span>
                <Form.Control
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={fields.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </Form.Group>

            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsEnvelopeFill aria-hidden="true" />
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

            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsLockFill aria-hidden="true" />
                </span>
                <Form.Control
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </Form.Group>

            <Form.Group controlId="formPasswordConfirmation" className="mb-4">
              <Form.Label>Confirm password</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <BsLockFill aria-hidden="true" />
                </span>
                <Form.Control
                  type="password"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  value={fields.passwordConfirmation}
                  onChange={handleChange}
                  required
                />
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Creating account
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="auth-card__footer">
              Already registered? <Link to="/login">Sign in</Link>.
            </p>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default SignUp;
