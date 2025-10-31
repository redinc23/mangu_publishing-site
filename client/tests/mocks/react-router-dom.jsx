import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RouterContext = createContext({
  location: '/',
  navigate: () => {}
});

function normalizeDestination(destination) {
  if (!destination) {
    return '/';
  }
  if (typeof destination === 'string') {
    return destination;
  }
  if (typeof destination === 'object' && typeof destination.pathname === 'string') {
    return destination.pathname;
  }
  return '/';
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function MemoryRouter({ initialEntries = ['/'], children }) {
  const [location, setLocation] = useState(initialEntries[0] ?? '/');

  const navigate = useCallback((next) => {
    setLocation(normalizeDestination(next));
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {typeof children === 'function' ? children({ location }) : children}
    </RouterContext.Provider>
  );
}

export function createMemoryRouter(routes = [], { initialEntries = ['/'] } = {}) {
  return { routes, initialEntries };
}

export function RouterProvider({ router, children }) {
  const initialLocation = router?.initialEntries?.[0] ?? '/';
  const [location, setLocation] = useState(initialLocation);

  const navigate = useCallback((next) => {
    setLocation(normalizeDestination(next));
  }, []);

  const match = router?.routes?.find((route) => route.path === location) ??
    router?.routes?.find((route) => route.path === initialLocation);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {match?.element ?? null}
      {children ?? null}
    </RouterContext.Provider>
  );
}

export const __esModule = true;
export default {
  useNavigate,
  MemoryRouter,
  createMemoryRouter,
  RouterProvider
};
