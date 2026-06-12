import { render, screen, fireEvent } from '@testing-library/react';
import Login from './features/Auth/Login';
import ScoreCardPanel from './features/Dashboard/panels/ScoreCardPanel';
import LogbookPanel from './features/Dashboard/panels/LogbookPanel';

// Mock the API so tests never make real network calls
jest.mock('./services/api', () => ({
  authAPI:        { login: jest.fn() },
  evaluationsAPI: { list: jest.fn(() => Promise.resolve({ data: [] })) },
  placementsAPI:  { list: jest.fn(() => Promise.resolve({ data: [] })) },
  logbooksAPI:    { list: jest.fn(() => Promise.resolve({ data: [] })) },
}));

// ── Test 1: Login form renders correctly ─────────────────────────────────────
test('Login form renders email, password fields and a sign in button', () => {
  render(<Login onAuthSuccess={jest.fn()} goToSignup={jest.fn()} />);
  expect(screen.getByPlaceholderText(/you@mak.ac.ug/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

// ── Test 2: Login fields start empty ─────────────────────────────────────────
test('Login form fields are empty on first load', () => {
  render(<Login onAuthSuccess={jest.fn()} goToSignup={jest.fn()} />);
  const emailInput    = screen.getByPlaceholderText(/you@mak.ac.ug/i);
  const passwordInput = screen.getByPlaceholderText(/••••••••/i);
  expect(emailInput.value).toBe('');
  expect(passwordInput.value).toBe('');
});

// ── Test 3: Login fields are required ────────────────────────────────────────
test('Login form requires both email and password', () => {
  render(<Login onAuthSuccess={jest.fn()} goToSignup={jest.fn()} />);
  expect(screen.getByPlaceholderText(/you@mak.ac.ug/i)).toBeRequired();
  expect(screen.getByPlaceholderText(/••••••••/i)).toBeRequired();
});

// ── Test 4: Login form accepts typed input ────────────────────────────────────
test('Login form updates fields when user types', () => {
  render(<Login onAuthSuccess={jest.fn()} goToSignup={jest.fn()} />);
  const emailInput    = screen.getByPlaceholderText(/you@mak.ac.ug/i);
  const passwordInput = screen.getByPlaceholderText(/••••••••/i);
  fireEvent.change(emailInput,    { target: { value: 'student@mak.ac.ug' } });
  fireEvent.change(passwordInput, { target: { value: 'Pass@1234' } });
  expect(emailInput.value).toBe('student@mak.ac.ug');
  expect(passwordInput.value).toBe('Pass@1234');
});

// ── Test 5: ScoreCardPanel renders without crashing ───────────────────────────
test('ScoreCardPanel renders for a student without crashing', () => {
  render(
    <ScoreCardPanel
      currentUser={{ id: 1, role: 'student', username: 'testuser' }}
      isActive={true}
    />
  );
  expect(document.body).toBeTruthy();
});