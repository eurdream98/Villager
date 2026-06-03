import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading or welcome when not signed in', () => {
  render(<App />);
  const text = screen.getByText(/불러오는 중|Villager/i);
  expect(text).toBeInTheDocument();
});
