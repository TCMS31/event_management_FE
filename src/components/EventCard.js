import React, { useState } from 'react';
import { Button, Card, Col, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import eventImg from '../assets/images/event1.avif';
import LazyEventForm from './LazyEventForm';
import { useEvent } from '../context/EventContext';
import { deleteEvent, describeApiError, isOrganizedBy, joinEvent } from '../services/eventService';
import { formatEventDate } from '../utils/formatters';
import { eventTint } from '../utils/eventTheme';

/**
 * One event.
 *
 * Which controls appear is decided by `isOrganizedBy(event, user)` — the
 * event's own `organizer_id` — and not by which list the card happens to be
 * rendered in. The API now answers 403 for a cross-user edit or delete, so an
 * "Edit" button on someone else's event would be a button that cannot work.
 */
const EventCard = ({ event, canJoin = false }) => {
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    state: { user },
    dispatch,
  } = useEvent();

  const isOrganizer = isOrganizedBy(event, user);

  const stop = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteEvent(event.id);
      dispatch({ type: 'EVENT_DELETED', id: event.id });
      NotificationManager.success('Event deleted successfully.', 'Success');
    } catch (error) {
      NotificationManager.error(describeApiError(error, 'Could not delete the event.'), 'Error');
    } finally {
      setBusy(false);
      setDeleteModal(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    try {
      await joinEvent(event.id);
      dispatch({ type: 'EVENT_JOINED', payload: event });
      NotificationManager.success('Event joined successfully.', 'Success');
    } catch (error) {
      NotificationManager.error(describeApiError(error, 'Could not join the event.'), 'Error');
    } finally {
      setBusy(false);
      setJoinModal(false);
    }
  };

  return (
    <>
      <Modal show={editModal} onHide={() => setEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LazyEventForm onClose={() => setEditModal(false)} event={event} />
        </Modal.Body>
      </Modal>

      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete this event?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            &ldquo;{event.name}&rdquo; will be removed permanently. This cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy}>
            Delete event
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={joinModal} onHide={() => setJoinModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Join this event?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            You will be added to the attendee list for &ldquo;{event.name}&rdquo;.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setJoinModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleJoin} disabled={busy}>
            Join event
          </Button>
        </Modal.Footer>
      </Modal>

      <Col xs={12} sm={6} lg={3} className="mb-4">
        <Card className="event-card h-100">
          <div className="event-card__media">
            <Card.Img variant="top" src={eventImg} alt="" />
            <span className="event-card__tint" style={{ backgroundImage: eventTint(event.id) }} />
            <span className="event-card__date-chip">{formatEventDate(event.date, 'short')}</span>
            {isOrganizer && (
              <button
                type="button"
                className="event-card__delete"
                aria-label={`Delete ${event.name}`}
                onClick={stop(() => setDeleteModal(true))}
              >
                &times;
              </button>
            )}
          </div>
          <Card.Body className="d-flex flex-column">
            <Card.Title as="h3" className="event-card__title">
              <Link to={`/events/${event.id}`}>{event.name}</Link>
            </Card.Title>
            <p className="event-card__location">{event.location}</p>
            <Card.Text className="event-card__description">{event.description}</Card.Text>
            <div className="event-card__actions mt-auto">
              {isOrganizer && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100"
                  onClick={stop(() => setEditModal(true))}
                >
                  Edit event
                </Button>
              )}
              {canJoin && !isOrganizer && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={stop(() => setJoinModal(true))}
                >
                  Join event
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default EventCard;
