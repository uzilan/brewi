import useCacheStore from '../stores/cacheStore';
import useUIStore from '../stores/uiStore';

export const tldrService = {
  async fetchTldrInfo(command, showInUI = true) {
    const cacheStore = useCacheStore.getState();
    const uiStore = useUIStore.getState();

    // Check cache first
    if (cacheStore.hasTldrInfo(command)) {
      const cachedTldr = cacheStore.getTldrInfo(command);
      if (showInUI) {
        uiStore.setTldrInfo(cachedTldr);
      }
      return cachedTldr;
    }

    // Fetch from API if not in cache

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

      // Cache the tldr info
      cacheStore.setTldrInfo(command, data);

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
