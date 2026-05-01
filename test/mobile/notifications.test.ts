import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '../../mobile/services/notifications';
import { api } from '../../mobile/services/api';

// expo-notifications, expo-device, expo-constants are already mocked in jest.setup.js
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));
jest.mock('../../mobile/services/api', () => ({
  api: {
    patch: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Notifications Service (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerForPushNotificationsAsync', () => {
    it('should return null if not a physical device', async () => {
      (global as any).__deviceState.isDevice = false;

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();

      (global as any).__deviceState.isDevice = true;
    });

    it('should request permissions if not granted', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxx]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      const result = await registerForPushNotificationsAsync();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe('ExponentPushToken[xxxxx]');
    });

    it('should return null if permission denied', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });

    it('should not request permissions if already granted', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[yyyyy]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      const result = await registerForPushNotificationsAsync();

      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(result).toBe('ExponentPushToken[yyyyy]');
    });

    it('should create Android notification channel', async () => {
      Platform.OS = 'android';
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[zzzzz]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await registerForPushNotificationsAsync();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    });

    it('should not create Android channel on iOS', async () => {
      Platform.OS = 'ios';
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[aaaaa]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await registerForPushNotificationsAsync();

      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('should send token to backend', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      const token = 'ExponentPushToken[bbbbb]';
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: token,
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await registerForPushNotificationsAsync();

      expect(api.patch).toHaveBeenCalledWith('/users/me/push-token', { token });
    });

    it('should ignore backend errors', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      const token = 'ExponentPushToken[ccccc]';
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: token,
      });
      (api.patch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await registerForPushNotificationsAsync();

      expect(result).toBe(token);
    });

    it('should use projectId from Constants if available', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Constants.expoConfig as any) = {
        extra: {
          eas: {
            projectId: 'test-project-id',
          },
        },
      };
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[ddddd]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await registerForPushNotificationsAsync();

      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
    });

    it('should call getExpoPushTokenAsync without projectId if not available', async () => {
      (Device.isDevice as any) = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Constants.expoConfig as any) = null;
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[eeeee]',
      });
      (api.patch as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await registerForPushNotificationsAsync();

      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Notification handler', () => {
    // The notifications module calls setNotificationHandler at import-time.
    // Re-require fresh and capture the call payload inside isolated modules.
    let reloadedHandlerCall: any;

    beforeAll(() => {
      jest.isolateModules(() => {
        const freshNotifications = require('expo-notifications') as typeof Notifications;
        (freshNotifications.setNotificationHandler as jest.Mock).mockClear();
        require('../../mobile/services/notifications');
        reloadedHandlerCall = (
          freshNotifications.setNotificationHandler as jest.Mock
        ).mock.calls[0]?.[0];
      });
    });

    it('should be configured with correct settings', () => {
      expect(reloadedHandlerCall).toBeDefined();
      expect(reloadedHandlerCall.handleNotification).toEqual(expect.any(Function));
    });

    it('should return correct notification behavior', async () => {
      const handler = reloadedHandlerCall;
      const result = await handler.handleNotification();

      expect(result).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      });
    });
  });
});
