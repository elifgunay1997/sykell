import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard page', () => {
  render(<App />);
  const dashboardElement = screen.getByText(/Dashboard/i);
  expect(dashboardElement).toBeInTheDocument();
});
