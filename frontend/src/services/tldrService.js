import useUIStore from '../stores/uiStore';

export const tldrService = {
  async fetchTldrInfo(command, showInUI = true) {
    const uiStore = useUIStore.getState();

    try {
      if (showInUI) {
        uiStore.setTldrLoading(true);
        uiStore.setTldrError(null);
      }

      const response = await fetch(`/api/tldr/${command}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (showInUI) {
        uiStore.setTldrInfo(data);
      }

      return data;
    } catch (err) {
      if (showInUI) {
        uiStore.setTldrError(err.message);
      }
      console.error('Error fetching tldr info:', err);
      throw err;
    } finally {
      if (showInUI) {
        uiStore.setTldrLoading(false);
      }
    }
  },
};
