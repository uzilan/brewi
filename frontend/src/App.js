import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Update as UpdateIcon,
  LocalHospital as DoctorIcon,
} from '@mui/icons-material';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  AppBar,
  Toolbar,
  Chip,
  Snackbar,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import DoctorModal from './DoctorModal';
import PackageFilter from './PackageFilter';
import PackageInfoDialog from './PackageInfoDialog';
import PackageList from './PackageList';
import SearchModal from './SearchModal';
import { apiService } from './services/apiService';
import useCacheStore from './stores/cacheStore';
import useUIStore from './stores/uiStore';
import UninstallModal from './UninstallModal';
import UpdateUpgradeModal from './UpdateUpgradeModal';

function App() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Zustand stores
  const {
    packageInfo,
    packageInfoLoading,
    packageInfoError,
    packageCommands,
    packageCommandsLoading,
    packageCommandsError,
    tldrInfo,
    tldrLoading,
    tldrError,
    selectedPackage,
    searchModalOpen,
    updateUpgradeModalOpen,
    uninstallModalOpen,
    doctorModalOpen,
    selectedPackageForUninstall,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    setSelectedPackage,
    setSearchModalOpen,
    setUpdateUpgradeModalOpen,
    setUninstallModalOpen,
    setDoctorModalOpen,
    setSelectedPackageForUninstall,
    showSnackbar,
    hideSnackbar,
    clearDialogState,
  } = useUIStore();

  const { dependencyMap, dependentsMap, clearAllCaches, packageInfoCache } =
    useCacheStore();

  // Destructure UI store functions at component level
  const {
    setPackageInfo,
    setPackageInfoLoading,
    setPackageInfoError,
    setPackageCommands,
    setPackageCommandsLoading,
    setPackageCommandsError,
    setTldrInfo,
    setTldrLoading,
    setTldrError,
  } = useUIStore();

  const fetchLastUpdateTime = useCallback(async () => {
    try {
      const updateTime = await apiService.fetchLastUpdateTime();
      if (updateTime) {
        setLastUpdateTime(updateTime);
      }
    } catch (err) {
      // Error fetching last update time
    }
  }, []);

  const prefetchAllPackageInfo = useCallback(
    async (packagesList, onPackageCached = null) => {
      return apiService.prefetchAllPackageInfo(packagesList, onPackageCached);
    },
    []
  );

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const packagesWithInstalledFlag = await apiService.fetchPackages();
      setPackages(packagesWithInstalledFlag);

      // Background prefetching disabled - using modal-based prefetching instead
      // if (packagesWithInstalledFlag.length > 0) {
      //   prefetchAllPackageInfo(packagesWithInstalledFlag);
      // }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if currently selected package has been cached and update UI
  useEffect(() => {
    if (!selectedPackage || (!packageInfoLoading && !packageCommandsLoading)) {
      return;
    }

    const packageName = selectedPackage.name;
    const pollInterval = 500; // Poll every 500ms
    const maxPollTime = 30000; // Stop polling after 30 seconds
    let pollCount = 0;
    const maxPolls = maxPollTime / pollInterval;

    const checkCache = () => {
      const cacheStore = useCacheStore.getState();
      let foundData = false;

      // Check if package info is now cached
      if (packageInfoLoading && cacheStore.hasPackageInfo(packageName)) {
        const cachedInfo = cacheStore.getPackageInfo(packageName);
        const enhancedInfo = {
          ...cachedInfo,
          dependents: Array.from(cacheStore.getDependents(packageName)),
        };
        setPackageInfo(enhancedInfo);
        setPackageInfoLoading(false);
        setPackageInfoError(null);
        foundData = true;
      }

      // Check if package commands are now cached
      if (
        packageCommandsLoading &&
        cacheStore.hasPackageCommands(packageName)
      ) {
        const cachedCommands = cacheStore.getPackageCommands(packageName);
        setPackageCommands(cachedCommands);
        setPackageCommandsLoading(false);
        setPackageCommandsError(null);
        foundData = true;
      }

      // If we found data or exceeded max polls, stop polling
      if (foundData || pollCount >= maxPolls) {
        return;
      }

      pollCount++;
      setTimeout(checkCache, pollInterval);
    };

    // Start polling
    checkCache();
  }, [
    selectedPackage,
    packageInfoLoading,
    packageCommandsLoading,
    setPackageInfo,
    setPackageInfoLoading,
    setPackageInfoError,
    setPackageCommands,
    setPackageCommandsLoading,
    setPackageCommandsError,
  ]);

  // UI store state monitoring removed for cleaner output

  const fetchTldrInfo = useCallback(async (command, showInUI = true) => {
    return apiService.fetchTldrInfo(command, showInUI);
  }, []);

  const fetchPackageInfo = useCallback(
    async (packageName, showInUI = true) => {
      const cacheStore = useCacheStore.getState();

      // Start fetching commands immediately (don't wait for package info)
      if (showInUI) {
        // Check cache first for commands
        if (cacheStore.hasPackageCommands(packageName)) {
          const cachedCommands = cacheStore.getPackageCommands(packageName);
          setPackageCommands(cachedCommands);

          // Prefetch tldr for cached commands if not already cached
          if (
            cachedCommands &&
            cachedCommands.commands &&
            cachedCommands.commands.length > 0
          ) {
            const commandsToPrefetch = cachedCommands.commands.slice(0, 3);
            commandsToPrefetch.forEach((command, index) => {
              // Check if tldr is already cached
              if (!cacheStore.hasTldrInfo(command)) {
                setTimeout(() => {
                  apiService.fetchTldrInfo(command, false).catch(err => {
                    console.error(
                      `Tldr prefetch failed for ${command}:`,
                      err.message
                    );
                  });
                }, index * 500); // 500ms delay between each tldr request
              }
            });
          }
        } else {
          // Set loading state for commands
          setPackageCommandsLoading(true);
          setPackageCommandsError(null);

          // Fetch commands in background with timeout protection
          const commandsController = new AbortController();
          const commandsTimeoutId = setTimeout(
            () => commandsController.abort(),
            30000
          ); // 30 second timeout

          fetch(`/api/packages/${packageName}/commands`, {
            signal: commandsController.signal,
          })
            .then(response => {
              clearTimeout(commandsTimeoutId);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              cacheStore.setPackageCommands(packageName, data);
              setPackageCommands(data);

              // Prefetch tldr for the first 3 commands of this package
              if (data && data.commands && data.commands.length > 0) {
                const commandsToPrefetch = data.commands.slice(0, 3);
                commandsToPrefetch.forEach((command, index) => {
                  // Add small delay between requests to avoid overwhelming the server
                  setTimeout(() => {
                    apiService.fetchTldrInfo(command, false).catch(err => {
                      console.error(
                        `Tldr prefetch failed for ${command}:`,
                        err.message
                      );
                    });
                  }, index * 500); // 500ms delay between each tldr request
                });
              }
            })
            .catch(err => {
              clearTimeout(commandsTimeoutId);
              if (err.name === 'AbortError') {
                setPackageCommandsError('Commands timed out');
              } else {
                setPackageCommandsError(err.message);
              }
              console.error('Error fetching package commands:', err);
            })
            .finally(() => {
              setPackageCommandsLoading(false);
            });
        }
      }

      // Check cache first for package info
      let packageInfo;
      if (cacheStore.hasPackageInfo(packageName)) {
        packageInfo = cacheStore.getPackageInfo(packageName);
        if (showInUI) {
          const enhancedInfo = {
            ...packageInfo,
            dependents: Array.from(cacheStore.getDependents(packageName)),
          };
          setPackageInfo(enhancedInfo);
        }
      } else {
        try {
          if (showInUI) {
            setPackageInfoLoading(true);
            setPackageInfoError(null);
          }
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          // Add a "slow request" indicator after 5 seconds
          const slowRequestId = setTimeout(() => {
            // Request is taking longer than expected
          }, 5000);

          try {
            const response = await fetch(`/api/packages/${packageName}`, {
              signal: controller.signal,
            });
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            packageInfo = await response.json();
            clearTimeout(slowRequestId);
          } catch (error) {
            clearTimeout(timeoutId);
            clearTimeout(slowRequestId);
            if (error.name === 'AbortError') {
              throw new Error('Request timed out');
            }
            throw error;
          }

          // Cache the package info
          cacheStore.setPackageInfo(packageName, packageInfo);

          // Update dependency maps
          if (packageInfo.dependencies) {
            cacheStore.setDependencyMap(packageName, packageInfo.dependencies);
            packageInfo.dependencies.forEach(dep => {
              cacheStore.addDependent(dep, packageName);
            });
          }

          if (showInUI) {
            const enhancedInfo = {
              ...packageInfo,
              dependents: Array.from(cacheStore.getDependents(packageName)),
            };
            setPackageInfo(enhancedInfo);
          }
        } catch (err) {
          if (showInUI) {
            setPackageInfoError(err.message);
          }
          console.error('Error fetching package info:', err);
          throw err;
        } finally {
          if (showInUI) {
            setPackageInfoLoading(false);
          }
        }
      }

      return packageInfo;
    },
    [
      setPackageInfo,
      setPackageInfoLoading,
      setPackageInfoError,
      setPackageCommands,
      setPackageCommandsLoading,
      setPackageCommandsError,
    ]
  );

  const handleRefresh = async () => {
    await fetchPackages();
    await fetchLastUpdateTime();
    // Clear cache since package information might have changed
    // Note: Dependency maps will be rebuilt by prefetchAllPackageInfo
    clearAllCaches();
  };

  const handlePackageClick = pkg => {
    setSelectedPackage(pkg);
    fetchPackageInfo(pkg.name, true);
    // Commands will be fetched automatically by fetchPackageInfo
  };

  const handleDependencyClick = packageName => {
    // Find the package in the current packages list
    const pkg = packages.find(p => p.name === packageName);
    if (pkg) {
      setSelectedPackage(pkg);
      fetchPackageInfo(packageName, true);
      // Commands will be fetched automatically by fetchPackageInfo
    } else {
      // If the package is not in the current list (e.g., it's a dependency but not installed),
      // create a temporary package object and show its info
      const tempPkg = { name: packageName, isInstalled: false };
      setSelectedPackage(tempPkg);
      fetchPackageInfo(packageName, true);
      // Commands will be fetched automatically by fetchPackageInfo
    }
  };

  const handleCommandClick = command => {
    // If the same command is already loaded, clear the tldr info (toggle off)
    if (tldrInfo && tldrInfo.command === command) {
      setTldrInfo(null);
      setTldrLoading(false);
      setTldrError(null);
    } else {
      // Otherwise, fetch the tldr info for the new command
      fetchTldrInfo(command, true);
    }
  };

  const handleCloseDialog = () => {
    clearDialogState();
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

  const handleOpenDoctorModal = () => {
    setDoctorModalOpen(true);
  };

  const handleCloseDoctorModal = () => {
    setDoctorModalOpen(false);
  };

  const handleUninstallClick = pkg => {
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
    clearAllCaches();
    showSnackbar(`Successfully uninstalled ${packageName}`, 'success');
  };

  const handleInstallSuccess = packageName => {
    fetchPackages();
    // Clear cache since dependencies might have changed
    // Note: Dependency maps will be rebuilt by prefetchAllPackageInfo
    clearAllCaches();
    showSnackbar(`Successfully installed ${packageName}`, 'success');
  };

  const handleFilterChange = value => {
    setFilterValue(value);
  };

  const getFilteredPackages = () => {
    if (!filterValue.trim()) {
      return packages;
    }

    const filterLower = filterValue.toLowerCase();
    return packages.filter(
      pkg =>
        pkg.name.toLowerCase().includes(filterLower) ||
        (pkg.version && pkg.version.toLowerCase().includes(filterLower))
    );
  };

  useEffect(() => {
    fetchPackages();
    fetchLastUpdateTime();
  }, [fetchPackages, fetchLastUpdateTime]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Loading packages...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Brewanator
          </Typography>
          <Button
            color='inherit'
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
            <Alert severity='error' sx={{ mb: 3 }}>
              Error: {error}
            </Alert>
          )}

          <Box
            sx={{
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant='h4' component='h1' gutterBottom>
                Installed Packages
              </Typography>
              <Box display='flex' gap={1} alignItems='center'>
                <Chip
                  label={`${packages.length} packages`}
                  color='primary'
                  variant='outlined'
                />
                {lastUpdateTime && (
                  <Chip
                    label={`Last updated: ${lastUpdateTime}`}
                    color='secondary'
                    variant='outlined'
                    size='small'
                  />
                )}
              </Box>
            </Box>
            <Box display='flex' gap={1}>
              <Button
                variant='outlined'
                color='primary'
                startIcon={<UpdateIcon />}
                onClick={handleOpenUpdateUpgradeModal}
                sx={{ minWidth: 140 }}
              >
                Update & Upgrade
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<DoctorIcon />}
                onClick={handleOpenDoctorModal}
                sx={{ minWidth: 120 }}
              >
                Doctor
              </Button>
              <Button
                variant='contained'
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
            packageInfoCache={packageInfoCache}
          />

          <PackageInfoDialog
            open={selectedPackage !== null}
            onClose={handleCloseDialog}
            selectedPackage={selectedPackage}
            packageInfo={packageInfo}
            packageInfoLoading={packageInfoLoading}
            packageInfoError={packageInfoError}
            packageCommands={packageCommands}
            packageCommandsLoading={packageCommandsLoading}
            packageCommandsError={packageCommandsError}
            tldrInfo={tldrInfo}
            tldrLoading={tldrLoading}
            tldrError={tldrError}
            onDependencyClick={handleDependencyClick}
            onCommandClick={handleCommandClick}
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

          <DoctorModal
            open={doctorModalOpen}
            onClose={handleCloseDoctorModal}
          />
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={hideSnackbar}
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
