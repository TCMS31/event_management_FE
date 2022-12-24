import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import { logout } from '../services/authService';
import { useEvent } from '../context/EventContext';

/**
 * Signs out.
 *
 * The local session is cleared and the user is redirected whether or not the
 * server accepted the revocation: the previous implementation only dispatched
 * `SIGN_OUT` on success, so an expired token left the UI signed in forever.
 */
const SignOut = () => {
  const navigate = useNavigate();
  const { dispatch, tokenStore } = useEvent();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    const revoked = await logout({ tokenStore });
    dispatch({ type: 'SIGN_OUT' });
    setBusy(false);

    NotificationManager.success(
      revoked ? 'Signed out.' : 'Signed out locally; the session had already expired.',
      'Success',
      3000
    );
    navigate('/login', { replace: true });
  };

  return (
    <Button variant="outline-light" size="sm" onClick={handleSignOut} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  );
};

export default SignOut;
