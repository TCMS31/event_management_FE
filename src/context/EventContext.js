import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { createInitialState, eventReducer } from './eventReducer';
import { defaultTokenStore } from '../services/tokenStore';

const EventContext = createContext(null);

/**
 * Provides the domain state and the dispatcher.
 *
 * The persisted session is read **once**, here, and handed to the reducer as
 * its initial state. Nothing else in the tree reads `localStorage`.
 */
const EventProvider = ({ children, tokenStore = defaultTokenStore, initialState }) => {
  const [state, dispatch] = useReducer(
    eventReducer,
    initialState ?? createInitialState({ token: tokenStore.getToken(), user: tokenStore.getUser() })
  );

  const value = useMemo(() => ({ state, dispatch, tokenStore }), [state, dispatch, tokenStore]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export { EventProvider, useEvent, EventContext };
