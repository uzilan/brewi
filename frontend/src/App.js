import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Button,
  AppBar,
  Toolbar,
  Chip,
  Snackbar
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon, Update as UpdateIcon } from '@mui/icons-material';
import PackageInfoDialog from './PackageInfoDialog';
import PackageList from './PackageList';
import SearchModal from './SearchModal';
import PackageFilter from './PackageFilter';
import UpdateUpgradeModal from './UpdateUpgradeModal';
import UninstallModal from './UninstallModal';

function App() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [packageInfoLoading, setPackageInfoLoading] = useState(false);
  const [packageInfoError, setPackageInfoError] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [updateUpgradeModalOpen, setUpdateUpgradeModalOpen] = useState(false);
  const [uninstallModalOpen, setUninstallModalOpen] = useState(false);
  const [selectedPackageForUninstall, setSelectedPackageForUninstall] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [packageInfoCache, setPackageInfoCache] = useState(new Map());
  const [dependencyMap, setDependencyMap] = useState(new Map()); // package -> dependencies
  const [dependentsMap, setDependentsMap] = useState(new Map()); // package -> dependents

  useEffect(() => {
    fetchPackages();
    fetchLastUpdateTime();
  }, []);



  const fetchLastUpdateTime = async () => {
    try {
      const response = await fetch('/api/packages/last-update');
      if (response.ok) {
        const data = await response.json();
        if (data.isSuccess) {
          setLastUpdateTime(data.output);
        }
      }
    } catch (err) {
      console.error('Failed to fetch last update time:', err);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/packages');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Add isInstalled: true to all packages since they are installed packages
      const packagesWithInstalledFlag = (data.packages || []).map(pkg => ({
        ...pkg,
        isInstalled: true
      }));
      setPackages(packagesWithInstalledFlag);
      
      // Start background prefetching of package info
      if (packagesWithInstalledFlag.length > 0) {
        prefetchAllPackageInfo(packagesWithInstalledFlag);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPackages();
    await fetchLastUpdateTime();
    // Clear cache since package information might have changed
    // Note: Dependency maps will be rebuilt by prefetchAllPackageInfo
    setPackageInfoCache(new Map());
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };



  const fetchPackageInfo = useCallback(async (packageName, showInUI = true) => {
    // Check if we have cached data for this package
    if (packageInfoCache.has(packageName)) {
      const cachedInfo = packageInfoCache.get(packageName);
      if (showInUI) {
        // Enhance cached data with cross-referenced dependents
        const enhancedInfo = {
          ...cachedInfo,
          dependents: Array.from(dependentsMap.get(packageName) || [])
        };
        setPackageInfo(enhancedInfo);
      }
      return;
    }

    try {
      if (showInUI) {
        setPackageInfoLoading(true);
        setPackageInfoError(null);
      }
      
      const response = await fetch(`/api/packages/${packageName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache the package info
      setPackageInfoCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.set(packageName, data);
        return newCache;
      });
      
      // Note: Dependency maps will be updated by buildDependencyMaps after prefetching
      
      if (showInUI) {
        // Enhance with cross-referenced dependents
        const enhancedInfo = {
          ...data,
          dependents: Array.from(dependentsMap.get(packageName) || [])
        };
        setPackageInfo(enhancedInfo);
      }
    } catch (err) {
      if (showInUI) {
        setPackageInfoError(err.message);
      }
      console.error('Error fetching package info:', err);
    } finally {
      if (showInUI) {
        setPackageInfoLoading(false);
      }
    }
  }, [packageInfoCache, dependentsMap]);



  const buildDependencyMapsFromData = useCallback((packagesList, prefetchedData) => {
    const newDependencyMap = new Map();
    const newDependentsMap = new Map();
    
    // Initialize dependents map for all packages
    packagesList.forEach(pkg => {
      newDependentsMap.set(pkg.name, new Set());
    });
    
    // Build dependency map from prefetched data
    packagesList.forEach(pkg => {
      const packageData = prefetchedData.get(pkg.name);
      if (packageData && packageData.dependencies) {
        const dependencies = new Set(packageData.dependencies);
        newDependencyMap.set(pkg.name, dependencies);
        
        // Update dependents map
        dependencies.forEach(dep => {
          const currentDependents = newDependentsMap.get(dep) || new Set();
          currentDependents.add(pkg.name);
          newDependentsMap.set(dep, currentDependents);
        });
      } else {
        newDependencyMap.set(pkg.name, new Set());
      }
    });
    
    setDependencyMap(newDependencyMap);
    setDependentsMap(newDependentsMap);
  }, []);

  const buildDependencyMaps = useCallback((packagesList) => {
    const newDependencyMap = new Map();
    const newDependentsMap = new Map();
    
    console.log('Building dependency maps...', new Date().toISOString(), 'for', packagesList.length, 'packages');
    
    // Initialize dependents map for all packages
    packagesList.forEach(pkg => {
      newDependentsMap.set(pkg.name, new Set());
    });
    
    console.log('Cache size when building maps:', packageInfoCache.size);
    
    // Build dependency map from cached package info
    packagesList.forEach(pkg => {
      const cachedInfo = packageInfoCache.get(pkg.name);
      if (cachedInfo && cachedInfo.dependencies) {
        const dependencies = new Set(cachedInfo.dependencies);
        newDependencyMap.set(pkg.name, dependencies);
        console.log(`${pkg.name}: ${dependencies.size} dependencies`);
        
        // Update dependents map
        dependencies.forEach(dep => {
          const currentDependents = newDependentsMap.get(dep) || new Set();
          currentDependents.add(pkg.name);
          newDependentsMap.set(dep, currentDependents);
        });
      } else {
        newDependencyMap.set(pkg.name, new Set());
        console.log(`${pkg.name}: no cached info or no dependencies`);
      }
    });
    
    console.log('Setting dependency maps - new size:', newDependencyMap.size, 'at', new Date().toISOString());
    setDependencyMap(newDependencyMap);
    setDependentsMap(newDependentsMap);
    
    console.log(`Dependency maps built: ${newDependencyMap.size} packages`);
    console.log(`Dependents map size: ${newDependentsMap.size}`);
    
    // Debug: Check if maps have any data
    let totalDeps = 0;
    newDependencyMap.forEach((deps, pkg) => {
      totalDeps += deps.size;
    });
    console.log(`Total dependencies across all packages: ${totalDeps}`);
  }, [packageInfoCache]);



  const prefetchAllPackageInfo = useCallback(async (packagesList) => {
    // Prefetch all package info in background with staggered requests
    const prefetchPromises = packagesList.map((pkg, index) => 
      new Promise(async (resolve) => {
        // Stagger requests by 100ms to avoid overwhelming the server
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/packages/${pkg.name}`);
            if (response.ok) {
              const data = await response.json();
              // Cache the package info
              setPackageInfoCache(prevCache => {
                const newCache = new Map(prevCache);
                newCache.set(pkg.name, data);
                return newCache;
              });
              resolve({ packageName: pkg.name, data });
            } else {
              resolve({ packageName: pkg.name, error: 'Failed to fetch' });
            }
          } catch (err) {
            resolve({ packageName: pkg.name, error: err.message });
          }
        }, index * 100);
      })
    );
    
    // Use Promise.allSettled to handle individual failures gracefully
    Promise.allSettled(prefetchPromises).then(results => {
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      // Collect all successful prefetched data
      const prefetchedData = new Map();
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.data) {
          prefetchedData.set(result.value.packageName, result.value.data);
        }
      });
      
      // Build dependency maps directly from prefetched data
      buildDependencyMapsFromData(packagesList, prefetchedData);
    });
  }, []);

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    fetchPackageInfo(pkg.name, true);
  };

  const handleDependencyClick = (packageName) => {
    // Find the package in the current packages list
    const pkg = packages.find(p => p.name === packageName);
    if (pkg) {
      setSelectedPackage(pkg);
      fetchPackageInfo(packageName, true);
    } else {
      // If the package is not in the current list (e.g., it's a dependency but not installed),
      // create a temporary package object and show its info
      const tempPkg = { name: packageName, isInstalled: false };
      setSelectedPackage(tempPkg);
      fetchPackageInfo(packageName, true);
    }
  };

  const handleCloseDialog = () => {
    setSelectedPackage(null);
    setPackageInfo(null);
    setPackageInfoError(null);
  };

  const handleOpenSearchModal = () => {
    setSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setSearchModalOpen(false);
  };

  const handleOpenUpdateUpgradeModal = () => {
    setUpdateUpgradeModalOpen(true);
  };

  const handleCloseUpdateUpgradeModal = () => {
    setUpdateUpgradeModalOpen(false);
  };

  const handleUninstallClick = (pkg) => {
    setSelectedPackageForUninstall(pkg);
    setUninstallModalOpen(true);
  };

  const handleCloseUninstallModal = () => {
    setUninstallModalOpen(false);
    setSelectedPackageForUninstall(null);
  };

  const handleUninstallSuccess = () => {
    const packageName = selectedPackageForUninstall?.name;
    fetchPackages();
    // Clear cache since dependencies might have changed
    // Note: Dependency maps will be rebuilt by prefetchAllPackageInfo
    setPackageInfoCache(new Map());
    showSnackbar(`Successfully uninstalled ${packageName}`, 'success');
  };

  const handleInstallSuccess = (packageName) => {
    fetchPackages();
    // Clear cache since dependencies might have changed
    // Note: Dependency maps will be rebuilt by prefetchAllPackageInfo
    setPackageInfoCache(new Map());
    showSnackbar(`Successfully installed ${packageName}`, 'success');
  };

  const handleFilterChange = (value) => {
    setFilterValue(value);
  };

  const getFilteredPackages = () => {
    if (!filterValue.trim()) {
      return packages;
    }
    
    const filterLower = filterValue.toLowerCase();
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(filterLower) ||
      (pkg.version && pkg.version.toLowerCase().includes(filterLower))
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading packages...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Brewanator
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', py: 4 }}>
        {/* Main Content */}
        <Box sx={{ flex: 1, px: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error: {error}
            </Alert>
          )}

          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Installed Packages
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Chip 
                  label={`${packages.length} packages`} 
                  color="primary" 
                  variant="outlined"
                />
                {lastUpdateTime && (
                  <Chip 
                    label={`Last updated: ${lastUpdateTime}`}
                    color="secondary"
                    variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<UpdateIcon />}
              onClick={handleOpenUpdateUpgradeModal}
              sx={{ minWidth: 140 }}
            >
              Update & Upgrade
            </Button>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleOpenSearchModal}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Box>
        </Box>

        <PackageFilter
          onFilterChange={handleFilterChange}
          filteredCount={getFilteredPackages().length}
          totalCount={packages.length}
        />

                <PackageList 
          packages={getFilteredPackages()} 
          onPackageClick={handlePackageClick}
          onUninstallClick={handleUninstallClick}
          onDependencyClick={handleDependencyClick}
          dependencyMap={dependencyMap}
          dependentsMap={dependentsMap}
        />

        <PackageInfoDialog
          open={selectedPackage !== null}
          onClose={handleCloseDialog}
          selectedPackage={selectedPackage}
          packageInfo={packageInfo}
          packageInfoLoading={packageInfoLoading}
          packageInfoError={packageInfoError}
          onDependencyClick={handleDependencyClick}
        />

                <SearchModal 
          open={searchModalOpen} 
          onClose={handleCloseSearchModal} 
          onPackageClick={handlePackageClick}
          installedPackages={packages}
          onRefreshInstalledPackages={fetchPackages}
          onInstallSuccess={handleInstallSuccess}
          onDependencyClick={handleDependencyClick}
          dependencyMap={dependencyMap}
          dependentsMap={dependentsMap}
        />

                <UpdateUpgradeModal 
          open={updateUpgradeModalOpen} 
          onClose={handleCloseUpdateUpgradeModal}
          onUpdateSuccess={fetchLastUpdateTime}
        />
        
        <UninstallModal
          open={uninstallModalOpen}
          onClose={handleCloseUninstallModal}
          packageName={selectedPackageForUninstall?.name}
          onUninstallSuccess={handleUninstallSuccess}
        />

        </Box>

                        {/* Debug Panel - Cached Packages */}
                <Box sx={{ width: 300, px: 2, borderLeft: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    Debug: Cached Packages
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${packageInfoCache.size} cached`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${dependencyMap.size} deps`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${dependentsMap.size} dependents`}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                    {Array.from(packageInfoCache.keys()).map((packageName) => (
                      <Chip
                        key={packageName}
                        label={packageName}
                        size="small"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                        color="success"
                      />
                    ))}
                    {packageInfoCache.size === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No packages cached yet
                      </Typography>
                    )}
                  </Box>
                </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
