import { create } from 'zustand';

const useUIStore = create(set => ({
  // Package Info UI State
  packageInfo: null,
  packageInfoLoading: false,
  packageInfoError: null,

  // Package Commands UI State
  packageCommands: null,
  packageCommandsLoading: false,
  packageCommandsError: null,

  // Tldr UI State
  tldrInfo: null,
  tldrLoading: false,
  tldrError: null,

  // Selected Package
  selectedPackage: null,

  // Modal States
  searchModalOpen: false,
  updateUpgradeModalOpen: false,
  uninstallModalOpen: false,
  doctorModalOpen: false,
  selectedPackageForUninstall: null,

  // Snackbar State
  snackbarOpen: false,
  snackbarMessage: '',
  snackbarSeverity: 'success',

  // Actions for Package Info UI
  setPackageInfo: info => set({ packageInfo: info }),
  setPackageInfoLoading: loading => set({ packageInfoLoading: loading }),
  setPackageInfoError: error => set({ packageInfoError: error }),
  clearPackageInfo: () =>
    set({
      packageInfo: null,
      packageInfoError: null,
    }),

  // Actions for Package Commands UI
  setPackageCommands: commands => set({ packageCommands: commands }),
  setPackageCommandsLoading: loading =>
    set({ packageCommandsLoading: loading }),
  setPackageCommandsError: error => set({ packageCommandsError: error }),
  clearPackageCommands: () =>
    set({
      packageCommands: null,
      packageCommandsError: null,
    }),

  // Actions for Tldr UI
  setTldrInfo: info => set({ tldrInfo: info }),
  setTldrLoading: loading => set({ tldrLoading: loading }),
  setTldrError: error => set({ tldrError: error }),
  clearTldrInfo: () =>
    set({
      tldrInfo: null,
      tldrError: null,
    }),

  // Actions for Selected Package
  setSelectedPackage: pkg => set({ selectedPackage: pkg }),
  clearSelectedPackage: () => set({ selectedPackage: null }),

  // Actions for Modals
  setSearchModalOpen: open => set({ searchModalOpen: open }),
  setUpdateUpgradeModalOpen: open => set({ updateUpgradeModalOpen: open }),
  setUninstallModalOpen: open => set({ uninstallModalOpen: open }),
  setDoctorModalOpen: open => set({ doctorModalOpen: open }),
  setSelectedPackageForUninstall: pkg =>
    set({ selectedPackageForUninstall: pkg }),

  // Actions for Snackbar
  showSnackbar: (message, severity = 'success') =>
    set({
      snackbarOpen: true,
      snackbarMessage: message,
      snackbarSeverity: severity,
    }),
  hideSnackbar: () => set({ snackbarOpen: false }),

  // Clear all UI state (for dialog close)
  clearDialogState: () =>
    set({
      packageInfo: null,
      packageInfoError: null,
      packageCommands: null,
      packageCommandsError: null,
      tldrInfo: null,
      tldrError: null,
      selectedPackage: null,
    }),
}));

export default useUIStore;
