import { create } from 'zustand';

interface GlobalLoaderState {
  activeProcesses: number;
  message: string;
  increment: (message?: string) => void;
  decrement: () => void;
  reset: () => void;
}

export const useGlobalLoaderStore = create<GlobalLoaderState>((set) => ({
  activeProcesses: 0,
  message: '',
  increment: (message = '') =>
    set((state) => ({
      activeProcesses: state.activeProcesses + 1,
      message,
    })),
  decrement: () =>
    set((state) => ({
      activeProcesses: Math.max(0, state.activeProcesses - 1),
      message: state.activeProcesses <= 1 ? '' : state.message,
    })),
  reset: () => set({ activeProcesses: 0, message: '' }),
}));
