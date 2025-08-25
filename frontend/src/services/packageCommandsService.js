import useCacheStore from '../stores/cacheStore';
import useUIStore from '../stores/uiStore';

export const packageCommandsService = {
  async fetchPackageCommands(packageName, showInUI = true) {
    const cacheStore = useCacheStore.getState();
    const uiStore = useUIStore.getState();

    // Check cache first
    if (cacheStore.hasPackageCommands(packageName)) {
      const cachedCommands = cacheStore.getPackageCommands(packageName);
      if (showInUI) {
        uiStore.setPackageCommands(cachedCommands);
      }
      return cachedCommands;
    }

    try {
      if (showInUI) {
        uiStore.setPackageCommandsLoading(true);
        uiStore.setPackageCommandsError(null);
      }

      const response = await fetch(`/api/packages/${packageName}/commands`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Cache the package commands
      cacheStore.setPackageCommands(packageName, data);

      if (showInUI) {
        uiStore.setPackageCommands(data);
      }

      return data;
    } catch (err) {
      if (showInUI) {
        uiStore.setPackageCommandsError(err.message);
      }
      console.error('Error fetching package commands:', err);
      throw err;
    } finally {
      if (showInUI) {
        uiStore.setPackageCommandsLoading(false);
      }
    }
  },
};
