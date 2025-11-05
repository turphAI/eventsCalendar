/**
 * Firebase Cloud Messaging for iOS push notifications
 */

import * as admin from 'firebase-admin';
import { NotificationPayload } from '../../types';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase credentials not properly configured');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return firebaseApp;
}

/**
 * Send push notification to iOS device
 */
export async function sendNotification(
  fcmToken: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);

    const message: admin.messaging.Message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        eventId: payload.eventId,
        ...payload.data,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
      token: fcmToken,
    };

    const response = await messaging.send(message);
    console.log('Notification sent successfully:', response);

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send batch notifications to multiple devices
 */
export async function sendBatchNotifications(
  tokens: string[],
  payload: NotificationPayload
): Promise<{ success: number; failure: number }> {
  const app = getFirebaseApp();
  const messaging = admin.messaging(app);

  const message: admin.messaging.MulticastMessage = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      eventId: payload.eventId,
      ...payload.data,
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: 'default',
        },
      },
    },
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    console.log('Batch notifications sent:', {
      success: response.successCount,
      failure: response.failureCount,
    });

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return { success: 0, failure: tokens.length };
  }
}
