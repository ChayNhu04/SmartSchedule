import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

/**
 * Mỏng wrapper quanh Expo Server SDK. Validate token, batch chunks.
 * Không retry — caller tự lo nếu cần.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(config: ConfigService) {
    this.expo = new Expo({ accessToken: config.get<string>('EXPO_ACCESS_TOKEN') });
  }

  async send(messages: ExpoPushMessage[]): Promise<void> {
    const valid = messages.filter((m) => Expo.isExpoPushToken(m.to as string));
    if (valid.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(valid);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error(`Lỗi gửi push: ${(err as Error).message}`);
      }
    }
  }
}
