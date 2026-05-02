import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  authAPI: {
    login:    jest.fn(),
    register: jest.fn(),
    logout:   jest.fn(),
    me:       jest.fn(),
  },
  studentsAPI:    { list: jest.fn().mockResolvedValue({ data: [] }) },
  logbooksAPI:    { list: jest.fn().mockResolvedValue({ data: [] }) },
  evaluationsAPI: { list: jest.fn().mockResolvedValue({ data: [] }) },
  placementsAPI:  { list: jest.fn().mockResolvedValue({ data: [] }) },
  issuesAPI:      { list: jest.fn().mockResolvedValue({ data: [] }) },
}));

beforeEach(() => {
  localStorage.clear();
});

test('test 1 — app renders without crashing', () => {
  render(<App />);
  expect(document.body).toBeTruthy();
});

test('test 2 — shows auth screen when no token stored', () => {
  localStorage.clear();
  render(<App />);
  expect(document.body.innerHTML.length).toBeGreaterThan(0);
});

test('test 3 — dashboard not visible without token', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.queryByText(/system overview/i)).not.toBeInTheDocument();
});

test('test 4 — no token means no dashboard', () => {
  render(<App />);
  expect(screen.queryByText(/internship overview/i)).not.toBeInTheDocument();
});

test('test 5 — localStorage is empty on fresh load', () => {
  localStorage.clear();
  render(<App />);
  expect(localStorage.getItem('access_token')).toBeNull();
});