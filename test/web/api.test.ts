import axios from 'axios';
import { api, TOKEN_KEY } from '../../web/lib/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client (Web)', () => {
  let mockLocalStorage: { [key: string]: string };
  let mockLocation: { pathname: string; href: string };

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

    // Mock window.location
    mockLocation = { pathname: '/', href: '/' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    jest.clearAllMocks();
  });

  describe('API instance', () => {
    it('should be created with correct baseURL', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('should have timeout of 15 seconds', () => {
      expect(api.defaults.timeout).toBe(15_000);
    });
  });

  describe('Request interceptor', () => {
    it('should add Authorization header if token exists', () => {
      const token = 'test-jwt-token';
      mockLocalStorage[TOKEN_KEY] = token;

      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];
      
      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      }
    });

    it('should not add Authorization header if no token', () => {
      const config = { headers: {} as any };
      const interceptor = api.interceptors.request.handlers[0];
      
      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBeUndefined();
      }
    });
  });

  describe('Response interceptor', () => {
    it('should pass through successful responses', async () => {
      const response = { data: { success: true }, status: 200 };
      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'fulfilled' in interceptor && interceptor.fulfilled) {
        const result = interceptor.fulfilled(response as any);
        expect(result).toEqual(response);
      }
    });

    it('should clear auth data on 401 error', async () => {
      mockLocalStorage[TOKEN_KEY] = 'test-token';
      mockLocalStorage['auth_user'] = JSON.stringify({ id: '1', email: 'test@example.com' });
      mockLocation.pathname = '/dashboard';

      const error = {
        response: { status: 401 },
      };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        try {
          await interceptor.rejected(error);
        } catch (e) {
          // Expected to reject
        }

        expect(window.localStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_user');
      }
    });

    it('should redirect to login on 401 error', async () => {
      mockLocation.pathname = '/dashboard';

      const error = {
        response: { status: 401 },
      };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        try {
          await interceptor.rejected(error);
        } catch (e) {
          // Expected to reject
        }

        expect(mockLocation.href).toBe('/login');
      }
    });

    it('should not redirect if already on login page', async () => {
      mockLocation.pathname = '/login';
      const originalHref = mockLocation.href;

      const error = {
        response: { status: 401 },
      };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        try {
          await interceptor.rejected(error);
        } catch (e) {
          // Expected to reject
        }

        expect(mockLocation.href).toBe(originalHref);
      }
    });

    it('should not redirect if on register page', async () => {
      mockLocation.pathname = '/register';
      const originalHref = mockLocation.href;

      const error = {
        response: { status: 401 },
      };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        try {
          await interceptor.rejected(error);
        } catch (e) {
          // Expected to reject
        }

        expect(mockLocation.href).toBe(originalHref);
      }
    });

    it('should pass through non-401 errors', async () => {
      const error = {
        response: { status: 500 },
      };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        await expect(interceptor.rejected(error)).rejects.toEqual(error);
      }
    });

    it('should handle errors without response', async () => {
      const error = { message: 'Network Error' };

      const interceptor = api.interceptors.response.handlers[0];
      
      if (interceptor && 'rejected' in interceptor && interceptor.rejected) {
        await expect(interceptor.rejected(error)).rejects.toEqual(error);
      }
    });
  });

  describe('TOKEN_KEY constant', () => {
    it('should be defined', () => {
      expect(TOKEN_KEY).toBe('auth_token');
    });
  });
});
