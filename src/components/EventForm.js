import React, { useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { BsCalendar, BsCardText, BsGeoAlt, BsPerson } from 'react-icons/bs';
import DatePicker from 'react-datepicker';
import { NotificationManager } from 'react-notifications';
import { useEvent } from '../context/EventContext';
import { createEvent, describeApiError, updateEvent } from '../services/eventService';
import 'react-datepicker/dist/react-datepicker.css';

const blankEvent = () => ({ name: '', description: '', date: new Date(), location: '' });

const toFormState = (event) => ({
  name: event.name ?? '',
  description: event.description ?? '',
  date: event.date ? new Date(event.date) : new Date(),
  location: event.location ?? '',
});

/**
 * Create / edit form.
 *
 * The HTTP call and the state update both live behind `eventService` and the
 * reducer; this component only owns the form's own fields and its submit state.
 */
const EventForm = ({ onClose, event }) => {
  const { dispatch } = useEvent();
  const isEdit = Boolean(event?.id);

  const [fields, setFields] = useState(() => toFormState(event ?? blankEvent()));
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((current) => ({ ...current, [name]: value }));
  };

  const handleDateChange = (date) => setFields((current) => ({ ...current, date }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { ...fields, date: fields.date?.toISOString() };

    try {
      if (isEdit) {
        const updated = await updateEvent(event.id, payload);
        dispatch({ type: 'EVENT_UPDATED', payload: updated });
      } else {
        const created = await createEvent(payload);
        dispatch({ type: 'EVENT_CREATED', payload: created });
      }
      NotificationManager.success(
        `Event ${isEdit ? 'updated' : 'created'} successfully.`,
        'Success'
      );
      onClose();
    } catch (error) {
      NotificationManager.error(describeApiError(error, 'Could not save the event.'), 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="event-form" noValidate={false}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formName">
            <Form.Label>
              <BsPerson className="me-2" aria-hidden="true" />
              Event name
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={fields.name}
              onChange={handleChange}
              placeholder="Zero Downtime Migrations"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="formDate">
            <Form.Label>
              <BsCalendar className="me-2" aria-hidden="true" />
              Date
            </Form.Label>
            <DatePicker
              id="formDate"
              selected={fields.date}
              onChange={handleDateChange}
              dateFormat="d MMMM yyyy"
              className="form-control"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="formDescription" className="mb-3">
        <Form.Label>
          <BsCardText className="me-2" aria-hidden="true" />
          Description
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={fields.description}
          onChange={handleChange}
          placeholder="What is it, and who is it for?"
          required
        />
      </Form.Group>

      <Form.Group controlId="formLocation" className="mb-4">
        <Form.Label>
          <BsGeoAlt className="me-2" aria-hidden="true" />
          Location
        </Form.Label>
        <Form.Control
          type="text"
          name="location"
          value={fields.location}
          onChange={handleChange}
          placeholder="Manchester"
          required
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="light" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : `${isEdit ? 'Update' : 'Create'} event`}
        </Button>
      </div>
    </Form>
  );
};

export default EventForm;
