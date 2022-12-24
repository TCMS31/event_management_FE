import React from 'react';
import { Button, Container, Modal } from 'react-bootstrap';
import LazyEventForm from './LazyEventForm';

/** The "create an event" banner and its modal form. */
const CreateEvent = ({ show, onOpen, onClose }) => (
  <>
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>New event</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <LazyEventForm onClose={onClose} />
      </Modal.Body>
    </Modal>

    <div className="create-event-band">
      <Container className="d-flex flex-wrap gap-3 justify-content-between align-items-center">
        <div>
          <h2 className="create-event-band__title">Running something worth turning up to?</h2>
          <p className="create-event-band__subtitle mb-0">
            Publish it here and let people join in one click.
          </p>
        </div>
        <Button variant="light" size="lg" onClick={onOpen}>
          Create an event
        </Button>
      </Container>
    </div>
  </>
);

export default CreateEvent;
