import { StateCreator } from "zustand";

export interface PaginationSlice {
  currentPage: number;
  pageSize: LimitOption;
  totalCount: number;
  hasMore: boolean;

  setCurrentPage: (page: number) => void;
  setPageSize: (size: LimitOption) => void;
  setTotalCount: (count: number) => void;

  updateHasMore: (
    totalCount: number,
    currentPage: number
  ) => { computedTotalPage: number };
  resetPagination: () => void;
}

export const createPaginationSlice: StateCreator<
  PaginationSlice,
  [],
  [],
  PaginationSlice
> = (set, get) => ({
  currentPage: 1,
  pageSize: 100,
  totalCount: 0,
  hasMore: false,

  setCurrentPage: (page) => set({ currentPage: Math.max(1, page) }),
  setPageSize: (size) => set({ pageSize: size }),
  setTotalCount: (count) => set({ totalCount: count }),

  updateHasMore: (totalCount, currentPage) => {
    const pageSize = get().pageSize;
    const computedTotalPage = Math.ceil(totalCount / pageSize);

    if (currentPage < computedTotalPage) {
      set({ hasMore: true });
    } else {
      set({ hasMore: false });
    }

    return { computedTotalPage };
  },

  resetPagination: () => set({ currentPage: 1, hasMore: false }),
});
