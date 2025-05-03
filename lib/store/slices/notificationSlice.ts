import { StateCreator } from "zustand";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

export interface NotificationSlice {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const createNotificationSlice: StateCreator<
  NotificationSlice,
  [],
  [],
  NotificationSlice
> = (set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }],
    }));

    // 지정된 지속 시간 후 자동 제거
    if (notification.duration) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.duration);
    }

    return id;
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAllNotifications: () => set({ notifications: [] }),
});

// 알림 헬퍼 함수
export const createNotifyHelpers = (
  addNotification: NotificationSlice["addNotification"]
) => ({
  info: (message: string, title?: string, duration = 5000) =>
    addNotification({ type: "info", message, title, duration }),

  success: (message: string, title?: string, duration = 5000) =>
    addNotification({ type: "success", message, title, duration }),

  warning: (message: string, title?: string, duration = 5000) =>
    addNotification({ type: "warning", message, title, duration }),

  error: (message: string, title?: string, duration = 5000) =>
    addNotification({ type: "error", message, title, duration }),
});
