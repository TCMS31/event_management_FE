import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons';

const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com', icon: faFacebook, label: 'Facebook' },
  { href: 'https://www.instagram.com', icon: faInstagram, label: 'Instagram' },
  { href: 'https://www.youtube.com', icon: faYoutube, label: 'YouTube' },
  { href: 'https://www.tiktok.com', icon: faTiktok, label: 'TikTok' },
];

const Footer = () => (
  <footer className="app-footer">
    <Container>
      <Row className="gy-4">
        <Col lg={5} md={12}>
          <h2 className="app-footer__brand">EventApp</h2>
          <p className="app-footer__blurb">
            A small demo client for the <code>event_management_app_BE</code> Rails API: create
            events, publish them, and join the ones other people are running.
          </p>
        </Col>

        <Col lg={3} md={6}>
          <h3 className="app-footer__heading">Sections</h3>
          <ul className="app-footer__links">
            <li>
              <a href="#my-events">My events</a>
            </li>
            <li>
              <a href="#joined-events">Joined events</a>
            </li>
            <li>
              <a href="#join-events">Upcoming events</a>
            </li>
          </ul>
        </Col>

        <Col lg={4} md={6}>
          <h3 className="app-footer__heading">Contact</h3>
          <ul className="app-footer__links">
            <li>
              <FontAwesomeIcon icon={faEnvelope} className="app-footer__icon" aria-hidden="true" />
              <a href="mailto:example@events.com">example@events.com</a>
            </li>
            <li>
              <FontAwesomeIcon
                icon={faLocationDot}
                className="app-footer__icon"
                aria-hidden="true"
              />
              <span>Manchester, United Kingdom</span>
            </li>
          </ul>
          <div className="app-footer__social">
            {SOCIAL_LINKS.map(({ href, icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <FontAwesomeIcon icon={icon} size="lg" />
              </a>
            ))}
          </div>
        </Col>
      </Row>

      <p className="app-footer__copyright">EventApp — demo project, not a real service.</p>
    </Container>
  </footer>
);

export default Footer;
