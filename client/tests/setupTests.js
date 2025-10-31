import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('react-router-dom/node_modules/react', async () => {
  const actual = await import('react');
  return {
    ...actual,
    default: actual.default ?? actual
  };
});

vi.mock('react-router-dom/node_modules/react-dom', async () => {
  const actual = await import('react-dom');
  return {
    ...actual,
    default: actual.default ?? actual
  };
});

afterEach(() => {
  cleanup();
});
