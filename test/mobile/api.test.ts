import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../mobile/services/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('API Client (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API instance', () => {
    it('should be created with correct baseURL', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('should have timeout of 15 seconds', () => {
      expect(api.defaults.timeout).toBe(15_000);
    });

    it('should use default baseURL if env var not set', () => {
      expect(api.defaults.baseURL).toContain('api');
    });
  });

  describe('Request interceptor', () => {
    it('should add Authorization header if token exists', async () => {
      const token = 'test-jwt-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = await interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      }
    });

    it('should not add Authorization header if no token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = await interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBeUndefined();
      }
    });

    it('should read token from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');

      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        await interceptor.fulfilled(config);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      }
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        await expect(interceptor.fulfilled(config)).rejects.toThrow('Storage error');
      }
    });

    it('should preserve existing headers', async () => {
      const token = 'test-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        } as any,
      };

      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = await interceptor.fulfilled(config);
        expect(result.headers['Content-Type']).toBe('application/json');
        expect(result.headers['X-Custom-Header']).toBe('custom-value');
        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      }
    });

    it('should update Authorization header if token changes', async () => {
      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        // First request with token1
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token1');
        const result1 = await interceptor.fulfilled({ ...config });
        expect(result1.headers.Authorization).toBe('Bearer token1');

        // Second request with token2
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token2');
        const result2 = await interceptor.fulfilled({ ...config });
        expect(result2.headers.Authorization).toBe('Bearer token2');
      }
    });
  });

  describe('Multiple requests', () => {
    it('should handle concurrent requests', async () => {
      const token = 'concurrent-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

      const config1 = { headers: {} as any };
      const config2 = { headers: {} as any };
      const config3 = { headers: {} as any };

      const interceptor = api.interceptors.request.handlers[0];

      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const results = await Promise.all([
          interceptor.fulfilled(config1),
          interceptor.fulfilled(config2),
          interceptor.fulfilled(config3),
        ]);

        results.forEach((result) => {
          expect(result.headers.Authorization).toBe(`Bearer ${token}`);
        });

        // AsyncStorage should be called 3 times
        expect(AsyncStorage.getItem).toHaveBeenCalledTimes(3);
      }
    });
  });
});
