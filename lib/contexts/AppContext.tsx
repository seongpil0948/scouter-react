/**
 * 애플리케이션 전역 상태 관리를 위한 컨텍스트
 */
import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from "react";
import { useLocalStorage } from "@/lib/hooks/storage/useLocalStorage";

// 테마 유형
export type Theme = "light" | "dark" | "system";

// 사용자 환경설정 인터페이스
interface UserPreferences {
  theme: Theme;
  showNotifications: boolean;
  compactView: boolean;
  language: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  pageSize: number;
}

// 초기 사용자 환경설정
const defaultPreferences: UserPreferences = {
  theme: "system",
  showNotifications: true,
  compactView: false,
  language: "ko-KR",
  dateFormat: "yyyy-MM-dd",
  timeFormat: "HH:mm:ss",
  timezone: "Asia/Seoul",
  pageSize: 10
};

// 애플리케이션 상태 인터페이스
interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  userPreferences: UserPreferences;
  sidebarOpen: boolean;
  activeView: string | null;
  notifications: Notification[];
}

// 알림 인터페이스
interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  read: boolean;
  timestamp: number;
}

// 초기 상태
const initialState: AppState = {
  isInitialized: false,
  isLoading: false,
  userPreferences: defaultPreferences,
  sidebarOpen: true,
  activeView: null,
  notifications: []
};

// 액션 타입
type AppAction =
  | { type: "INITIALIZE"; payload: { preferences: UserPreferences } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PREFERENCE"; payload: Partial<UserPreferences> }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_ACTIVE_VIEW"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Omit<Notification, "id" | "timestamp" | "read"> }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" };

// 리듀서 함수
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        isInitialized: true,
        userPreferences: {
          ...defaultPreferences,
          ...action.payload.preferences
        }
      };
    
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload
      };
    
    case "SET_PREFERENCE":
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };
    
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case "SET_ACTIVE_VIEW":
      return {
        ...state,
        activeView: action.payload
      };
    
    case "ADD_NOTIFICATION":
      const newNotification: Notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
        ...action.payload
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 50) // 최대 50개 알림 유지
      };
    
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
    
    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: []
      };
      
    default:
      return state;
  }
}

// 컨텍스트 타입 정의
interface AppContextType {
  state: AppState;
  setLoading: (isLoading: boolean) => void;
  setPreference: (preferences: Partial<UserPreferences>) => void;
  toggleSidebar: () => void;
  setActiveView: (view: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleTheme: () => void;
  unreadNotificationsCount: number;
}

// 컨텍스트 생성
const AppContext = createContext<AppContextType | undefined>(undefined);

// 컨텍스트 프로바이더 Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * 애플리케이션 컨텍스트 제공자 컴포넌트
 */
export function AppProvider({ children }: AppProviderProps) {
  // 로컬 스토리지에서 환경설정 로드
  const { value: storedPreferences, setValue: setStoredPreferences } = useLocalStorage<UserPreferences>(
    "scouter-app-preferences",
    defaultPreferences
  );
  
  // 애플리케이션 상태 관리
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 컴포넌트 마운트 시 초기화
  React.useEffect(() => {
    dispatch({
      type: "INITIALIZE",
      payload: { preferences: storedPreferences }
    });
  }, [storedPreferences]);
  
  // 환경설정이 변경될 때 로컬 스토리지 업데이트
  React.useEffect(() => {
    if (state.isInitialized) {
      setStoredPreferences(state.userPreferences);
    }
  }, [state.userPreferences, state.isInitialized, setStoredPreferences]);
  
  // 로딩 상태 설정
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: isLoading });
  }, []);
  
  // 환경설정 업데이트
  const setPreference = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: "SET_PREFERENCE", payload: preferences });
  }, []);
  
  // 사이드바 토글
  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);
  
  // 활성 뷰 설정
  const setActiveView = useCallback((view: string) => {
    dispatch({ type: "SET_ACTIVE_VIEW", payload: view });
  }, []);
  
  // 알림 추가
  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  }, []);
  
  // 알림 읽음 표시
  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });
  }, []);
  
  // 모든 알림 삭제
  const clearNotifications = useCallback(() => {
    dispatch({ type: "CLEAR_NOTIFICATIONS" });
  }, []);
  
  // 테마 전환
  const toggleTheme = useCallback(() => {
    const currentTheme = state.userPreferences.theme;
    let newTheme: Theme;
    
    if (currentTheme === "light") {
      newTheme = "dark";
    } else if (currentTheme === "dark") {
      newTheme = "system";
    } else {
      newTheme = "light";
    }
    
    setPreference({ theme: newTheme });
  }, [state.userPreferences.theme, setPreference]);
  
  // 읽지 않은 알림 개수
  const unreadNotificationsCount = useMemo(() => {
    return state.notifications.filter(notification => !notification.read).length;
  }, [state.notifications]);
  
  // 컨텍스트 값
  const contextValue: AppContextType = {
    state,
    setLoading,
    setPreference,
    toggleSidebar,
    setActiveView,
    addNotification,
    markNotificationRead,
    clearNotifications,
    toggleTheme,
    unreadNotificationsCount
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * 애플리케이션 컨텍스트 사용 훅
 */
export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  
  return context;
}

export default AppContext;
