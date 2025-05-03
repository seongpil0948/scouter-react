import { StateCreator } from "zustand";

// 데이터 슬라이스는 일반적인 구현체가 아닌 구체적인 데이터 타입에 의존적이므로
// 인터페이스만 정의하고 구현은 각 스토어에서 수행합니다.
export interface DataSlice<T> {
  data: T[];
  setData: (data: T[]) => void;
  addData: (items: T[]) => void;
  clearData: () => void;
  lastFetched: number;
}

export const createDataSlice =
  <T>(
    initialData: T[] = []
  ): StateCreator<DataSlice<T>, [], [], DataSlice<T>> =>
  (set) => ({
    data: initialData,
    setData: (data) => set({ data, lastFetched: Date.now() }),
    addData: (items) =>
      set((state) => ({
        data: [...state.data, ...items],
        lastFetched: Date.now(),
      })),
    clearData: () => set({ data: [] }),
    lastFetched: 0,
  });
