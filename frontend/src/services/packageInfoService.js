import useCacheStore from '../stores/cacheStore';
import useUIStore from '../stores/uiStore';

export const packageInfoService = {
  async fetchPackageInfo(packageName, showInUI = true) {
    const cacheStore = useCacheStore.getState();
    const uiStore = useUIStore.getState();

    // Check cache first
    if (cacheStore.hasPackageInfo(packageName)) {
      const cachedInfo = cacheStore.getPackageInfo(packageName);
      if (showInUI) {
        // Enhance cached data with cross-referenced dependents
        const enhancedInfo = {
          ...cachedInfo,
          dependents: Array.from(cacheStore.getDependents(packageName)),
        };
        uiStore.setPackageInfo(enhancedInfo);

        // Also set cached commands if available
        if (cacheStore.hasPackageCommands(packageName)) {
          uiStore.setPackageCommands(
            cacheStore.getPackageCommands(packageName)
          );
        }
      }
      return cachedInfo;
    }

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

      // Cache the package info
      cacheStore.setPackageInfo(packageName, data);

      // Update dependency maps
      if (data.dependencies) {
        cacheStore.setDependencyMap(packageName, data.dependencies);

        // Update dependents map for each dependency
        data.dependencies.forEach(dep => {
          cacheStore.addDependent(dep, packageName);
        });
      }

      if (showInUI) {
        // Enhance with cross-referenced dependents
        const enhancedInfo = {
          ...data,
          dependents: Array.from(cacheStore.getDependents(packageName)),
        };
        uiStore.setPackageInfo(enhancedInfo);
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
