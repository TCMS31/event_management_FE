import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toaster from './Toaster';
import { notify } from '../services/notify';

describe('Toaster', () => {
  it('shows what notify publishes and lets the user dismiss it', async () => {
    const user = userEvent.setup();
    render(<Toaster />);

    act(() => notify.error('You are not allowed to do that.'));

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Error');
    expect(toast).toHaveTextContent('You are not allowed to do that.');

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('You are not allowed to do that.')).not.toBeInTheDocument();
  });

  it('stacks several notifications in order', async () => {
    render(<Toaster />);

    act(() => {
      notify.success('Event created successfully.');
      notify.success('Event joined successfully.');
    });

    const toasts = await screen.findAllByRole('alert');
    expect(toasts.map((t) => t.textContent)).toEqual([
      expect.stringContaining('created'),
      expect.stringContaining('joined'),
    ]);
  });
});
