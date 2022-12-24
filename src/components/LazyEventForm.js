import React, { Suspense, lazy } from 'react';
import { Spinner } from 'react-bootstrap';

/**
 * `EventForm` pulls in `react-datepicker` and its stylesheet, which together
 * are the single largest dependency in the app. Both entry points to the form
 * are modals behind a click, so the chunk is fetched exactly when it is needed
 * and never on first paint.
 */
const EventForm = lazy(() => import('./EventForm'));

const LazyEventForm = (props) => (
  <Suspense
    fallback={
      <div className="py-5 text-center" role="status" aria-label="Loading form">
        <Spinner animation="border" />
      </div>
    }
  >
    <EventForm {...props} />
  </Suspense>
);

export default LazyEventForm;
