import { StateCreator } from "zustand";

export interface ModalSlice<ModalType = string> {
  isModalOpen: boolean;
  modalType: ModalType | null;
  modalProps: Record<string, any> | null;

  openModal: (type: ModalType, props?: Record<string, any>) => void;
  closeModal: () => void;
}

export const createModalSlice =
  <ModalType = string>(): StateCreator<
    ModalSlice<ModalType>,
    [],
    [],
    ModalSlice<ModalType>
  > =>
  (set) => ({
    isModalOpen: false,
    modalType: null,
    modalProps: null,

    openModal: (type, props = {}) =>
      set({ isModalOpen: true, modalType: type, modalProps: props }),

    closeModal: () =>
      set({ isModalOpen: false, modalType: null, modalProps: null }),
  });
