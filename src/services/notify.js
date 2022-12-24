/**
 * App-wide toast notifications.
 *
 * A module-level observable rather than a React context, so services and
 * event handlers can raise a toast without threading a hook through, and tests
 * can spy on `notify.success` / `notify.error` directly. `<Toaster />` is the
 * only subscriber in the running app.
 */

let nextId = 1;
const listeners = new Set();

const publish = (variant, message, title, timeout) => {
  const toast = { id: nextId, variant, message, title, timeout };
  nextId += 1;
  listeners.forEach((listener) => listener(toast));
};

export const notify = {
  success: (message, title = 'Success', timeout = 4000) =>
    publish('success', message, title, timeout),
  // Errors stay up longer: they usually carry the API's explanation.
  error: (message, title = 'Error', timeout = 7000) => publish('danger', message, title, timeout),
};

/** @returns {() => void} unsubscribe */
export const subscribeToNotifications = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
