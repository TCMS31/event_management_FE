import React from 'react';
import { Button } from 'react-bootstrap';
import EventSection from './EventSection';
import useEventCollection from '../hooks/useEventCollection';

/** Events the signed-in user organizes — the only ones they may edit or delete. */
const EventList = ({ onCreate }) => {
  const collection = useEventCollection('organized');

  return (
    <EventSection
      id="my-events"
      variant="organized"
      title="My events"
      subtitle="Events you organize. Only you can edit or delete these."
      collection={collection}
      emptyMessage="You have not created an event yet. Create your first one above."
      actions={
        onCreate && (
          <Button variant="primary" size="sm" onClick={onCreate}>
            New event
          </Button>
        )
      }
    />
  );
};

export default EventList;
