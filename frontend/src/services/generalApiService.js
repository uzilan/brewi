export const generalApiService = {
  async fetchPackages() {
    const response = await fetch('/api/packages');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return (data.packages || []).map(pkg => ({
      ...pkg,
      isInstalled: true,
    }));
  },

  async fetchLastUpdateTime() {
    const response = await fetch('/api/packages/last-update');
    if (response.ok) {
      const data = await response.json();
      if (data.isSuccess) {
        return data.output;
      }
    }
    return null;
  },
};
