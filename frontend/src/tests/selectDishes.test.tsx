import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SelectDishes from '../pages/selectDishes';
import * as catalogService from '../services/catalogService';
import * as eventService from '../services/eventService';

vi.mock('../services/catalogService');
vi.mock('../services/eventService');

describe('SelectDishes Page (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides soft-deleted dishes and saves active dish selections', async () => {
    vi.spyOn(catalogService, 'fetchDishes').mockResolvedValueOnce([
      { id: 1, name: 'Paneer Butter Masala', category: 'Main Course', isDeleted: false },
      { id: 2, name: 'Discontinued Soup', category: 'Starter', isDeleted: true },
      { id: 3, name: 'Archived Curry', category: 'Main Course', deletedAt: '2026-10-01T00:00:00Z' },
    ]);
    const saveSpy = vi.spyOn(eventService, 'saveEventMenu').mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter initialEntries={['/events/12/dishes']}>
        <Routes>
          <Route path="/events/:eventId/dishes" element={<SelectDishes />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Active dish renders; soft-deleted dishes do not
    await waitFor(() => {
      expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
    });
    expect(screen.queryByText('Discontinued Soup')).not.toBeInTheDocument();
    expect(screen.queryByText('Archived Curry')).not.toBeInTheDocument();

    // Enter servings and submit
    const user = userEvent.setup();
    const servingsInput = screen.getByPlaceholderText('0');
    await user.type(servingsInput, '80');
    await user.click(screen.getByRole('button', { name: /save menu/i }));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith('12', [{ dishId: 1, plannedServings: 80 }]);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});