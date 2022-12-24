import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <Container className="auth-page text-center">
    <h1 className="auth-card__title">Page not found</h1>
    <p className="text-muted">That link does not point anywhere in this app.</p>
    <Button as={Link} to="/" variant="primary">
      Back to events
    </Button>
  </Container>
);

export default NotFound;
