import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardEnhanced from '../pages/DashboardEnhanced';

// Mock dependencies (Router, Toast, etc.)
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

describe('DashboardEnhanced', () => {
  test('renders dashboard analytics cards', () => {
    render(<DashboardEnhanced />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Farms/i)).toBeInTheDocument();
    expect(screen.getByText(/Growing Crops/i)).toBeInTheDocument();
    expect(screen.getByText(/Listed Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders Placed/i)).toBeInTheDocument();
  });

  test('renders search/filter inputs for farms, crops, products', () => {
    render(<DashboardEnhanced />);
    expect(screen.getByPlaceholderText(/Search farms/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search crops/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products/i)).toBeInTheDocument();
  });

  test('renders bulk action buttons for farms, crops, products', () => {
    render(<DashboardEnhanced />);
    expect(screen.getAllByText(/Delete Selected/i).length).toBeGreaterThanOrEqual(3);
  });

  test('has accessible labels for search/filter', () => {
    render(<DashboardEnhanced />);
    expect(screen.getByPlaceholderText(/Search farms/i)).toHaveAccessibleName();
    expect(screen.getByPlaceholderText(/Search crops/i)).toHaveAccessibleName();
    expect(screen.getByPlaceholderText(/Search products/i)).toHaveAccessibleName();
  });
});
