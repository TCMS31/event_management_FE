import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import CreateEvent from '../components/CreateEvent';
import EventList from '../components/EventList';
import JoinEvent from '../components/JoinEvent';
import JoinedEvents from '../components/JoinedEvents';
import { useEvent } from '../context/EventContext';

/**
 * The signed-in dashboard: what you organize, what you have joined, and what
 * you could join. The route is guarded by `ProtectedRoute`, so this component
 * can assume a session exists.
 */
const Home = () => {
  const {
    state: { user },
  } = useEvent();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="dashboard-hero">
        <Container>
          <p className="dashboard-hero__eyebrow">Dashboard</p>
          <h1 className="dashboard-hero__title">
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Welcome back.'}
          </h1>
          <p className="dashboard-hero__subtitle">
            Everything you are running and everything you are attending, in one place.
          </p>
        </Container>
      </div>

      <CreateEvent
        show={showCreate}
        onOpen={() => setShowCreate(true)}
        onClose={() => setShowCreate(false)}
      />
      <EventList onCreate={() => setShowCreate(true)} />
      <JoinedEvents />
      <JoinEvent />
    </>
  );
};

export default Home;
