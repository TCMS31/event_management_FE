import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

const Footer = () => (
  <footer className="app-footer">
    <Container>
      <Row className="gy-4">
        <Col lg={7}>
          <h2 className="app-footer__brand">EventApp</h2>
          <p className="app-footer__blurb">
            A small demo client for the <code>event_management_app_BE</code> Rails API: create
            events, publish them, and join the ones other people are running.
          </p>
        </Col>

        <Col lg={5}>
          <h3 className="app-footer__heading">On the dashboard</h3>
          <ul className="app-footer__links">
            <li>
              <a href="/#my-events">My events</a>
            </li>
            <li>
              <a href="/#joined-events">Joined events</a>
            </li>
            <li>
              <a href="/#join-events">Upcoming events</a>
            </li>
          </ul>
        </Col>
      </Row>

      <p className="app-footer__copyright">EventApp is a demo project, not a real service.</p>
    </Container>
  </footer>
);

export default Footer;
