// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Chart.js to prevent canvas errors in tests
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
  })),
  registerables: [],
}));

// Mock react-chartjs-2 with simple div components
jest.mock('react-chartjs-2', () => ({
  Bar: 'div',
  Doughnut: 'div',
  Line: 'div',
}));
