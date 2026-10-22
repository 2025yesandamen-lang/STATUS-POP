import { VendorProfile } from '../types/index.ts';
import { getVendorProfile, saveVendorProfile } from './storage.ts';

const SNOOZE_KEY = 'statuspop_reminder_snooze_until';

/**
 * Checks if the 8:00 AM Daily WhatsApp Status reminder should fire right now
 */
export function checkDailyReminderTrigger(vendor: VendorProfile): boolean {
  if (vendor.dailyReminderEnabled === false) return false;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // If already triggered today, don't re-trigger unless manually tested
  if (vendor.lastDailyReminderDate === todayStr) {
    return false;
  }

  // Check snooze
  if (typeof window !== 'undefined') {
    const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
      return false;
    }
  }

  // Parse target reminder time (default: 08:00 AM)
  const reminderTime = vendor.dailyReminderTime || '08:00';
  const [targetHour, targetMinute] = reminderTime.split(':').map(Number);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // If current time is past or at scheduled morning reminder time
  if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
    return true;
  }

  return false;
}

/**
 * Record that today's reminder has been delivered
 */
export function markDailyReminderDelivered(vendor: VendorProfile): VendorProfile {
  const todayStr = new Date().toISOString().split('T')[0];
  const updated = {
    ...vendor,
    lastDailyReminderDate: todayStr,
  };
  saveVendorProfile(updated);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SNOOZE_KEY);
  }
  return updated;
}

/**
 * Snooze reminder by X minutes (e.g. 60 minutes)
 */
export function snoozeDailyReminder(minutes = 60): void {
  if (typeof window !== 'undefined') {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, snoozeUntil.toString());
  }
}

/**
 * Request Browser Desktop/Mobile Push Notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.warn('Notification permission error:', e);
    return false;
  }
}

/**
 * Fire Native System Push Notification
 */
export function sendBrowserPushNotification(title: string, body: string, onClickUrl?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&auto=format&fit=crop&q=80',
      badge: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&auto=format&fit=crop&q=80',
    });

    notif.onclick = () => {
      window.focus();
      if (onClickUrl) {
        window.location.href = onClickUrl;
      }
      notif.close();
    };
  } catch (err) {
    console.warn('Could not display system notification:', err);
  }
}
