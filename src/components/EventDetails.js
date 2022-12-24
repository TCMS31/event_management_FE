import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Container, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignLeft, faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { describeApiError, fetchEvent, isOrganizedBy } from '../services/eventService';
import { useEvent } from '../context/EventContext';
import { formatEventDate } from '../utils/formatters';

/**
 * A single event.
 *
 * The API returns `404 {"errors":["Event not found"]}` for an unknown id, so
 * "not found" is distinguished from "the request failed" and rendered as a
 * page state rather than a toast over an empty screen. (It used to answer
 * `200` with a raw exception string, which this component happily rendered as
 * an event with an `undefined` name.)
 */
const EventDetails = () => {
  const { id } = useParams();
  const {
    state: { user },
  } = useEvent();

  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setStatus('loading');
      try {
        const data = await fetchEvent(id, { signal: controller.signal });
        setEvent(data);
        setStatus('ready');
      } catch (requestError) {
        if (requestError.name === 'CanceledError' || requestError.name === 'AbortError') return;
        if (requestError.response?.status === 404) {
          setStatus('missing');
          return;
        }
        setError(describeApiError(requestError, 'Could not load this event.'));
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, [id]);

  return (
    <div className="event-details">
      <Container className="event-details__inner">
        {status === 'loading' && (
          <div className="event-details__state" aria-busy="true">
            <Spinner animation="border" role="status" />
            <p className="mt-3 mb-0">Loading event…</p>
          </div>
        )}

        {status === 'missing' && (
          <div className="event-details__state">
            <h1 className="event-details__title">Event not found</h1>
            <p>This event has been deleted, or the link is wrong.</p>
            <Button as={Link} to="/" variant="light">
              Back to events
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="event-details__state" role="alert">
            <h1 className="event-details__title">Something went wrong</h1>
            <p>{error}</p>
            <Button as={Link} to="/" variant="light">
              Back to events
            </Button>
          </div>
        )}

        {status === 'ready' && event && (
          <article>
            {isOrganizedBy(event, user) && (
              <span className="event-details__badge">You organize this event</span>
            )}
            <h1 className="event-details__title">{event.name}</h1>
            <p className="event-details__meta">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              {formatEventDate(event.date, 'withTime')}
            </p>
            <p className="event-details__meta">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
              {event.location}
            </p>
            <p className="event-details__description">
              <FontAwesomeIcon icon={faAlignLeft} className="me-2" />
              {event.description}
            </p>
            <Button as={Link} to="/" variant="light" className="mt-3">
              Back to events
            </Button>
          </article>
        )}
      </Container>
    </div>
  );
};

export default EventDetails;
