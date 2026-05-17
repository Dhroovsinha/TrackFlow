import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user', role: 'EMPLOYEE' } },
    status: 'authenticated',
  }),
}));
