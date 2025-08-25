import { create } from 'zustand';

const useCacheStore = create((set, get) => ({
  // Package Info Cache
  packageInfoCache: new Map(),

  // Package Commands Cache
  packageCommandsCache: new Map(),

  // Tldr Info Cache
  tldrCache: new Map(),

  // Dependency Maps
  dependencyMap: new Map(), // package -> dependencies
  dependentsMap: new Map(), // package -> dependents

  // Actions for Package Info
  setPackageInfo: (packageName, data) => {
    set(state => {
      const newCache = new Map(state.packageInfoCache);
      newCache.set(packageName, data);
      return { packageInfoCache: newCache };
    });
  },

  getPackageInfo: packageName => {
    return get().packageInfoCache.get(packageName);
  },

  hasPackageInfo: packageName => {
    return get().packageInfoCache.has(packageName);
  },

  // Actions for Package Commands
  setPackageCommands: (packageName, data) => {
    set(state => {
      const newCache = new Map(state.packageCommandsCache);
      newCache.set(packageName, data);
      return { packageCommandsCache: newCache };
    });
  },

  getPackageCommands: packageName => {
    return get().packageCommandsCache.get(packageName);
  },

  hasPackageCommands: packageName => {
    return get().packageCommandsCache.has(packageName);
  },

  // Actions for Tldr Info
  setTldrInfo: (command, data) => {
    set(state => {
      const newCache = new Map(state.tldrCache);
      newCache.set(command, data);
      return { tldrCache: newCache };
    });
  },

  getTldrInfo: command => {
    return get().tldrCache.get(command);
  },

  hasTldrInfo: command => {
    return get().tldrCache.has(command);
  },

  // Actions for Dependency Maps
  setDependencyMap: (packageName, dependencies) => {
    set(state => {
      const newMap = new Map(state.dependencyMap);
      newMap.set(packageName, new Set(dependencies));
      return { dependencyMap: newMap };
    });
  },

  getDependencies: packageName => {
    return get().dependencyMap.get(packageName) || new Set();
  },

  setDependentsMap: (packageName, dependents) => {
    set(state => {
      const newMap = new Map(state.dependentsMap);
      newMap.set(packageName, new Set(dependents));
      return { dependentsMap: newMap };
    });
  },

  getDependents: packageName => {
    return get().dependentsMap.get(packageName) || new Set();
  },

  addDependent: (dependency, dependent) => {
    set(state => {
      const newMap = new Map(state.dependentsMap);
      const currentDependents = newMap.get(dependency) || new Set();
      currentDependents.add(dependent);
      newMap.set(dependency, currentDependents);
      return { dependentsMap: newMap };
    });
  },

  // Initialize dependency maps for all packages
  initializeDependencyMaps: packagesList => {
    set(() => {
      const initialDependencyMap = new Map();
      const initialDependentsMap = new Map();

      packagesList.forEach(pkg => {
        initialDependencyMap.set(pkg.name, new Set());
        initialDependentsMap.set(pkg.name, new Set());
      });

      return {
        dependencyMap: initialDependencyMap,
        dependentsMap: initialDependentsMap,
      };
    });
  },

  // Clear all caches
  clearAllCaches: () => {
    set({
      packageInfoCache: new Map(),
      packageCommandsCache: new Map(),
      tldrCache: new Map(),
      dependencyMap: new Map(),
      dependentsMap: new Map(),
    });
  },

  // Get cache statistics
  getCacheStats: () => {
    const state = get();
    return {
      packageInfoCount: state.packageInfoCache.size,
      packageCommandsCount: state.packageCommandsCache.size,
      tldrCount: state.tldrCache.size,
      dependencyMapCount: state.dependencyMap.size,
      dependentsMapCount: state.dependentsMap.size,
    };
  },
}));

export default useCacheStore;
