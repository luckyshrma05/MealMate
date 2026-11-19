import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/authContext';

const mockAuth: any = {
  user: { name: 'Priyanshu', role: 'USER' },
  logout: vi.fn(),
};

function renderNavbarAt(path: string) {
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Navbar Visibility Rules', () => {
  it('renders nothing on /admin routes', () => {
    const { container } = renderNavbarAt('/admin/quotations');
    expect(container.firstChild).toBeNull();
  });

  it('shows MealMate banner without user name or Logout on non-dashboard pages', () => {
    renderNavbarAt('/events/new');
    expect(screen.getByText('MealMate')).toBeInTheDocument();
    expect(screen.queryByText(/Hello, Priyanshu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('shows MealMate banner with user name and Logout on /dashboard', () => {
    renderNavbarAt('/dashboard');
    expect(screen.getByText('MealMate')).toBeInTheDocument();
    expect(screen.getByText(/Hello, Priyanshu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});