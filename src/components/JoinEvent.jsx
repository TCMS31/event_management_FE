import React from 'react';
import EventSection from './EventSection';
import useEventCollection from '../hooks/useEventCollection';

/** Upcoming events the user neither organizes nor has joined. */
const JoinEvent = () => {
  const collection = useEventCollection('joinable');

  return (
    <EventSection
      id="join-events"
      variant="joinable"
      title="Join upcoming events"
      subtitle="Open events from other organizers."
      collection={collection}
      emptyMessage="There are no upcoming events to join right now."
      cardProps={{ canJoin: true }}
    />
  );
};

export default JoinEvent;
