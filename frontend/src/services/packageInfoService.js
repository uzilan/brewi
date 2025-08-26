import useUIStore from '../stores/uiStore';

export const packageInfoService = {
  async fetchPackageInfo(packageName, showInUI = true) {
    const uiStore = useUIStore.getState();

    try {
      if (showInUI) {
        uiStore.setPackageInfoLoading(true);
        uiStore.setPackageInfoError(null);
      }

      const response = await fetch(`/api/packages/${packageName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (showInUI) {
        uiStore.setPackageInfo(data);
      }

      return data;
    } catch (err) {
      if (showInUI) {
        uiStore.setPackageInfoError(err.message);
      }
      console.error('Error fetching package info:', err);
      throw err;
    } finally {
      if (showInUI) {
        uiStore.setPackageInfoLoading(false);
      }
    }
  },
};
