import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80';

export const useMockSessionStore = create(
  persist(
    (set) => ({
      user: null,
      lastActionAt: null,
      signIn: ({ email, name }) => {
        if (!email) {
          return { success: false, error: 'Please enter an email address.' };
        }

        const normalizedEmail = email.toLowerCase();
        const isAdminMock =
          normalizedEmail.startsWith('admin@') ||
          normalizedEmail.includes('+admin@') ||
          normalizedEmail.endsWith('+admin');

        const username =
          name?.trim() ||
          normalizedEmail
            .split('@')[0]
            .replace(/[\W_]+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase()) ||
          'Reader';

        const user = {
          id: 'demo-user',
          name: username,
          email: normalizedEmail,
          avatarUrl: DEFAULT_AVATAR,
          membership: 'Studio Access',
          favoriteGenres: ['Mystery', 'Sci-Fi', 'Indie Voices'],
          badges: ['Beta Explorer', 'Weekly Reader'],
          roles: isAdminMock ? ['admin'] : [],
          isAdmin: isAdminMock
        };

        set({
          user,
          lastActionAt: Date.now()
        });

        return { success: true, user };
      },
      signOut: () => {
        set({
          user: null,
          lastActionAt: Date.now()
        });
      }
    }),
    {
      name: 'mangu-demo-session'
    }
  )
);

