import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders queued status correctly', () => {
    render(<StatusBadge status="queued" />);
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('Queued')).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders running status correctly', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Running')).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders done status correctly', () => {
    render(<StatusBadge status="done" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Done')).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders error status correctly', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error')).toHaveClass('bg-red-100', 'text-red-800');
  });
}); 