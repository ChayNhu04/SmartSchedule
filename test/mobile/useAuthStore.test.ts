import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../mobile/hooks/useAuthStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('useAuthStore (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    useAuthStore.setState({ token: null, user: null });
  });

  describe('Initial state', () => {
    it('should have null token and user', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('hydrate', () => {
    it('should load token and user from AsyncStorage', async () => {
      const token = 'test-jwt-token';
      const user = { id: '123', email: 'test@example.com', display_name: 'Test User' };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve(token);
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(user));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.hydrate();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_user');
      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
    });

    it('should handle null values from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.hydrate();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle invalid JSON in auth_user', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('token');
        if (key === 'auth_user') return Promise.resolve('invalid-json');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.hydrate();
        }),
      ).rejects.toThrow();
    });

    it('should use Promise.all for parallel loading', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.hydrate();
      });

      // Should be called exactly twice (once for each key)
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('setAuth', () => {
    it('should save token and user to AsyncStorage and state', async () => {
      const token = 'new-jwt-token';
      const user = { id: '456', email: 'new@example.com', display_name: 'New User' };

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setAuth(token, user);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', token);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));
      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);
    });

    it('should update existing auth data', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      const firstToken = 'first-token';
      const firstUser = { id: '1', email: 'first@example.com', display_name: 'First' };

      await act(async () => {
        await result.current.setAuth(firstToken, firstUser);
      });

      expect(result.current.token).toBe(firstToken);

      const secondToken = 'second-token';
      const secondUser = { id: '2', email: 'second@example.com', display_name: 'Second' };

      await act(async () => {
        await result.current.setAuth(secondToken, secondUser);
      });

      expect(result.current.token).toBe(secondToken);
      expect(result.current.user).toEqual(secondUser);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.setAuth('token', {
            id: '1',
            email: 'test@example.com',
            display_name: 'Test',
          });
        }),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('logout', () => {
    it('should clear AsyncStorage and state', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set some auth data first
      useAuthStore.setState({
        token: 'test-token',
        user: { id: '123', email: 'test@example.com', display_name: 'Test' },
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'auth_user']);
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should work even if no auth data exists', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.logout();
        }),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('Auth flow integration', () => {
    it('should complete full auth flow', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // 1. Initial state
      expect(result.current.token).toBeNull();

      // 2. Login
      const token = 'login-token';
      const user = { id: '789', email: 'flow@example.com', display_name: 'Flow User' };

      await act(async () => {
        await result.current.setAuth(token, user);
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);

      // 3. Hydrate (simulate app restart)
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve(token);
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(user));
        return Promise.resolve(null);
      });

      await act(async () => {
        await result.current.hydrate();
      });

      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual(user);

      // 4. Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple setAuth calls', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      const user1 = { id: '1', email: 'user1@example.com', display_name: 'User 1' };
      const user2 = { id: '2', email: 'user2@example.com', display_name: 'User 2' };

      await act(async () => {
        await Promise.all([
          result.current.setAuth('token1', user1),
          result.current.setAuth('token2', user2),
        ]);
      });

      // Last one should win
      expect(result.current.token).toBe('token2');
      expect(result.current.user).toEqual(user2);
    });
  });
});
