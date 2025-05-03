// lib/store/uiStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createThemeSlice, ThemeSlice } from "./slices/themeSlice";
import {
  createNotificationSlice,
  NotificationSlice,
  createNotifyHelpers,
} from "./slices/notificationSlice";
import { createModalSlice, ModalSlice } from "./slices/modalSlice";

// UI 스토어 타입 정의
export interface UIStoreState
  extends ThemeSlice,
    NotificationSlice,
    ModalSlice {
  // 사이드바 상태
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // 현재 페이지
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

// UI 스토어 생성
export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // 슬라이스 연결
        ...createThemeSlice(set, get, api),
        ...createNotificationSlice(set, get, api),
        ...createModalSlice()(set, get, api),

        // 사이드바 상태
        isSidebarOpen: true,
        toggleSidebar: () =>
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

        // 현재 페이지
        currentPage: "dashboard",
        setCurrentPage: (currentPage) => set({ currentPage }),
      }),
      {
        name: "telemetry-ui-storage",
        partialize: (state) => ({
          isSidebarOpen: state.isSidebarOpen,
          theme: state.theme,
          currentPage: state.currentPage,
        }),
      }
    )
  )
);

// 알림 헬퍼 함수 생성
export const notify = createNotifyHelpers(
  useUIStore.getState().addNotification
);

export default useUIStore;
