import React from 'react';
import { Button, Container, Row, Spinner } from 'react-bootstrap';
import EventCard from './EventCard';

/**
 * The shell every event list renders inside: heading, count, and the four
 * states a paginated remote collection can be in (loading, error, empty,
 * populated + "load more"). Written once so the three lists cannot disagree.
 */
const EventSection = ({
  id,
  title,
  subtitle,
  variant,
  collection,
  emptyMessage,
  cardProps = {},
  actions = null,
}) => {
  const { items, total, hasMore, status, error, loadMore, reload } = collection;
  const isInitialLoad = status === 'loading' && items.length === 0;

  return (
    <section id={id} aria-label={title} className={`event-section event-section--${variant}`}>
      <Container>
        <header className="event-section__header">
          <div>
            <h2 className="event-section__title">{title}</h2>
            {subtitle && <p className="event-section__subtitle">{subtitle}</p>}
          </div>
          <div className="event-section__meta">
            {status === 'ready' && (
              <span className="event-section__count">
                {items.length}
                {total > items.length ? ` of ${total}` : ''}
              </span>
            )}
            {actions}
          </div>
        </header>

        {isInitialLoad && (
          <Row role="status" aria-label={`Loading ${title.toLowerCase()}`} aria-busy="true">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="col-12 col-sm-6 col-lg-3 mb-4">
                <div className="event-card-skeleton" />
              </div>
            ))}
          </Row>
        )}

        {status === 'error' && (
          <div className="event-section__state event-section__state--error" role="alert">
            <p className="mb-3">{error}</p>
            <Button variant="outline-light" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <p className="event-section__state">{emptyMessage}</p>
        )}

        {items.length > 0 && (
          <Row>
            {items.map((event) => (
              <EventCard key={event.id} event={event} {...cardProps} />
            ))}
          </Row>
        )}

        {hasMore && (
          <div className="text-center mt-4">
            <Button variant="outline-primary" onClick={loadMore} disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Loading
                </>
              ) : (
                `Load more (${total - items.length} remaining)`
              )}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
};

export default EventSection;
