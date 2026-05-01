import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../web/hooks/use-auth';
import { TOKEN_KEY } from '../../web/lib/api';

describe('useAuth Hook (Web)', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    // Reset zustand store
    useAuth.setState({ token: null, user: null, hydrated: false });
  });

  describe('Initial state', () => {
    it('should have null token and user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.hydrated).toBe(false);
    });
  });

  describe('hydrate', () => {
    it('should load token and user from localStorage', () => {
      const token = 'test-jwt-token';
      const user = { id: '123', email: 'test@example.com', display_name: 'Test User' };
      
      mockLocalStorage[TOKEN_KEY] = token;
      mockLocalStorage['auth_user'] = JSON.stringify(user);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.hydrate();
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
      expect(result.current.hydrated).toBe(true);
    });

    it('should set hydrated to true even if no data in localStorage', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.hydrate();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.hydrated).toBe(true);
    });

    it('should handle invalid JSON in auth_user', () => {
      mockLocalStorage[TOKEN_KEY] = 'test-token';
      mockLocalStorage['auth_user'] = 'invalid-json';

      const { result } = renderHook(() => useAuth());

      expect(() => {
        act(() => {
          result.current.hydrate();
        });
      }).toThrow();
    });

    it('should not crash if localStorage is not available', () => {
      // Simulate SSR environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.hydrate();
      });

      expect(result.current.hydrated).toBe(false);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('setAuth', () => {
    it('should save token and user to localStorage and state', () => {
      const token = 'new-jwt-token';
      const user = { id: '456', email: 'new@example.com', display_name: 'New User' };

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setAuth(token, user);
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, token);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));
      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
      expect(result.current.hydrated).toBe(true);
    });

    it('should update existing auth data', () => {
      const { result } = renderHook(() => useAuth());

      const firstToken = 'first-token';
      const firstUser = { id: '1', email: 'first@example.com', display_name: 'First' };

      act(() => {
        result.current.setAuth(firstToken, firstUser);
      });

      expect(result.current.token).toBe(firstToken);

      const secondToken = 'second-token';
      const secondUser = { id: '2', email: 'second@example.com', display_name: 'Second' };

      act(() => {
        result.current.setAuth(secondToken, secondUser);
      });

      expect(result.current.token).toBe(secondToken);
      expect(result.current.user).toEqual(secondUser);
    });
  });

  describe('logout', () => {
    it('should clear localStorage and state', () => {
      const token = 'test-token';
      const user = { id: '123', email: 'test@example.com', display_name: 'Test' };

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setAuth(token, user);
      });

      expect(result.current.token).toBe(token);

      act(() => {
        result.current.logout();
      });

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_user');
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.hydrated).toBe(true);
    });

    it('should work even if no auth data exists', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('Auth flow integration', () => {
    it('should complete full auth flow', () => {
      const { result } = renderHook(() => useAuth());

      // 1. Initial state
      expect(result.current.token).toBeNull();

      // 2. Login
      const token = 'login-token';
      const user = { id: '789', email: 'flow@example.com', display_name: 'Flow User' };

      act(() => {
        result.current.setAuth(token, user);
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);

      // 3. Hydrate (simulate page refresh)
      mockLocalStorage[TOKEN_KEY] = token;
      mockLocalStorage['auth_user'] = JSON.stringify(user);

      act(() => {
        result.current.hydrate();
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);

      // 4. Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });
});
