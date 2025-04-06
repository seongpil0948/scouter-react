// app/lib/store/uiStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// UI 상태 스토어 인터페이스
interface UIState {
  // 사이드바 상태
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // 다크 모드
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;

  // 현재 페이지 정보
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // 모달 상태
  isModalOpen: boolean;
  modalType: string | null;
  modalProps: Record<string, any> | null;
  openModal: (type: string, props?: Record<string, any>) => void;
  closeModal: () => void;

  // 알림 상태
  notifications: Array<{
    id: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
    duration?: number;
  }>;
  addNotification: (
    notification: Omit<UIState["notifications"][0], "id">,
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// UI 스토어 생성
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // 사이드바 상태
        isSidebarOpen: true,
        toggleSidebar: () =>
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

        // 다크 모드
        isDarkMode: false,
        toggleDarkMode: () =>
          set((state) => ({ isDarkMode: !state.isDarkMode })),
        setDarkMode: (isDark) => set({ isDarkMode: isDark }),

        // 현재 페이지
        currentPage: "dashboard",
        setCurrentPage: (currentPage) => set({ currentPage }),

        // 모달 상태
        isModalOpen: false,
        modalType: null,
        modalProps: null,
        openModal: (type, props = {}) =>
          set({ isModalOpen: true, modalType: type, modalProps: props }),
        closeModal: () =>
          set({ isModalOpen: false, modalType: null, modalProps: null }),

        // 알림 상태
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
      }),
      {
        name: "telemetry-ui-storage",
        partialize: (state) => ({
          isSidebarOpen: state.isSidebarOpen,
          isDarkMode: state.isDarkMode,
          currentPage: state.currentPage,
        }),
      },
    ),
  ),
);

// 알림 헬퍼 함수
export const notify = {
  info: (message: string, duration = 5000) =>
    useUIStore.getState().addNotification({ type: "info", message, duration }),

  success: (message: string, duration = 5000) =>
    useUIStore
      .getState()
      .addNotification({ type: "success", message, duration }),

  warning: (message: string, duration = 5000) =>
    useUIStore
      .getState()
      .addNotification({ type: "warning", message, duration }),

  error: (message: string, duration = 5000) =>
    useUIStore.getState().addNotification({ type: "error", message, duration }),
};

export default useUIStore;
