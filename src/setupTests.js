import '@testing-library/jest-dom';

// The app persists its session in localStorage via `defaultTokenStore`, and the
// axios singleton reads from it. Emptying it between tests keeps them
// independent without stubbing out the code path under test.
beforeEach(() => {
  window.localStorage.clear();
});
