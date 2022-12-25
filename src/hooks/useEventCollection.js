import { useCallback, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { describeApiError, fetchEventPage } from '../services/eventService';

/**
 * Loads one paginated event collection into the context and keeps it there.
 *
 * The three list screens were previously three copies of the same
 * `useState` + `useEffect` + `axios.get` block, each of which rendered
 * `response.data` straight into the DOM and therefore silently showed only the
 * API's first page. They now share this hook, so pagination, the loading state
 * and the error state are implemented once.
 *
 * @param {'organized'|'joinable'|'joined'} collection
 * @returns {{items, total, hasMore, status, error, loadMore, reload}}
 */
export const useEventCollection = (collection) => {
  const { state, dispatch } = useEvent();
  const slice = state.collections[collection];

  const load = useCallback(
    async ({ page, append, signal }) => {
      dispatch({ type: 'COLLECTION_LOADING', collection });
      try {
        const result = await fetchEventPage(collection, { page, signal });
        dispatch({ type: 'COLLECTION_LOADED', collection, payload: result, append });
      } catch (error) {
        // An aborted request is a navigation, not a failure worth showing.
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        dispatch({
          type: 'COLLECTION_FAILED',
          collection,
          error: describeApiError(error, 'Could not load events.'),
        });
      }
    },
    [collection, dispatch]
  );

  useEffect(() => {
    const controller = new AbortController();
    load({ page: 1, append: false, signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const loadMore = useCallback(() => {
    if (!slice.hasMore || slice.status === 'loading') return;
    load({ page: slice.page + 1, append: true });
  }, [load, slice.hasMore, slice.page, slice.status]);

  const reload = useCallback(() => load({ page: 1, append: false }), [load]);

  return { ...slice, loadMore, reload };
};

export default useEventCollection;
