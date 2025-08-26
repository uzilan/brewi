import useUIStore from '../stores/uiStore';

export const packageCommandsService = {
  async fetchPackageCommands(packageName, showInUI = true) {
    const uiStore = useUIStore.getState();

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
