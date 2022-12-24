import React from 'react';
import EventSection from './EventSection';
import useEventCollection from '../hooks/useEventCollection';

/** Events the signed-in user has joined as an attendee. */
const JoinedEvents = () => {
  const collection = useEventCollection('joined');

  return (
    <EventSection
      id="joined-events"
      variant="joined"
      title="Joined events"
      subtitle="Events you are attending."
      collection={collection}
      emptyMessage="You have not joined an event yet. Pick one from the list below."
    />
  );
};

export default JoinedEvents;
