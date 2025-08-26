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
import useUIStore from './stores/uiStore';
import UninstallModal from './UninstallModal';
import UpdateUpgradeModal from './UpdateUpgradeModal';

function App() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [packageDependencies, setPackageDependencies] = useState({});
  const [packageDependents, setPackageDependents] = useState({});
  const [packageDescriptions, setPackageDescriptions] = useState({});
  const [hoveredPackage, setHoveredPackage] = useState(null);
  const [dependenciesLoading, setDependenciesLoading] = useState(false);

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

  // Destructure UI store functions at component level
  const { setTldrInfo, setTldrLoading, setTldrError } = useUIStore();

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

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const packagesWithInstalledFlag = await apiService.fetchPackages();
      setPackages(packagesWithInstalledFlag);

      // Start pre-populating dependency information in the background
      // This won't block the UI from showing packages
      setTimeout(() => {
        prePopulateDependencies(packagesWithInstalledFlag);
      }, 1000); // Wait 1 second after packages load
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const prePopulateDependencies = async packagesList => {
    setDependenciesLoading(true);

    // Process in small batches to avoid overwhelming the backend
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < packagesList.length; i += batchSize) {
      batches.push(packagesList.slice(i, i + batchSize));
    }

    // Process batches with delays to be gentle on the backend
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(async pkg => {
          try {
            const result = await apiService.fetchPackageInfo(pkg.name, false); // Don't show in UI
            if (result && result.isSuccess) {
              return {
                name: pkg.name,
                dependencies: result.dependencies || [],
                dependents: result.dependents || [],
                description: result.description || '',
              };
            }
          } catch (err) {
            // Silently fail for individual packages
            // Failed to fetch dependencies for ${pkg.name}
          }
          return null;
        })
      );

      // Update state with batch results
      const validResults = batchResults.filter(result => result !== null);
      if (validResults.length > 0) {
        setPackageDependencies(prev => {
          const newDeps = { ...prev };
          validResults.forEach(result => {
            newDeps[result.name] = {
              dependencies: result.dependencies,
              dependents: result.dependents,
            };
          });
          return newDeps;
        });

        // Store descriptions
        setPackageDescriptions(prev => {
          const newDescriptions = { ...prev };
          validResults.forEach(result => {
            if (result.description) {
              newDescriptions[result.name] = result.description;
            }
          });
          return newDescriptions;
        });

        // Build reverse map immediately after this batch
        setTimeout(() => {
          buildReverseDependencyMap();
        }, 100);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setDependenciesLoading(false);
  };

  const buildReverseDependencyMap = () => {
    const reverseMap = {};

    // Initialize empty arrays for all packages
    Object.keys(packageDependencies).forEach(pkgName => {
      reverseMap[pkgName] = [];
    });

    // Build the reverse map by cross-referencing dependencies
    Object.entries(packageDependencies).forEach(([pkgName, depsData]) => {
      if (depsData.dependencies) {
        depsData.dependencies.forEach(depName => {
          if (reverseMap[depName]) {
            reverseMap[depName].push(pkgName);
          }
        });
      }
    });

    setPackageDependents(reverseMap);
  };

  // UI store state monitoring removed for cleaner output

  const fetchTldrInfo = useCallback(async (command, showInUI = true) => {
    return apiService.fetchTldrInfo(command, showInUI);
  }, []);

  const fetchPackageInfo = useCallback(async (packageName, showInUI = true) => {
    const result = await apiService.fetchPackageInfo(packageName, showInUI);

    // Store dependency information for hover highlighting
    if (result && result.isSuccess) {
      setPackageDependencies(prev => {
        const newDeps = {
          ...prev,
          [packageName]: {
            dependencies: result.dependencies || [],
            dependents: result.dependents || [],
          },
        };

        // Update the reverse dependency map
        setTimeout(() => {
          updateReverseDependencyMap(newDeps);
        }, 100);

        return newDeps;
      });

      // Store description if available
      if (result.description) {
        setPackageDescriptions(prev => ({
          ...prev,
          [packageName]: result.description,
        }));
      }
    }

    return result;
  }, []);

  const updateReverseDependencyMap = depsData => {
    const reverseMap = { ...packageDependents };

    // Initialize empty arrays for new packages
    Object.keys(depsData).forEach(pkgName => {
      if (!reverseMap[pkgName]) {
        reverseMap[pkgName] = [];
      }
    });

    // Build the reverse map by cross-referencing dependencies
    Object.entries(depsData).forEach(([pkgName, depsInfo]) => {
      if (depsInfo.dependencies) {
        depsInfo.dependencies.forEach(depName => {
          if (reverseMap[depName] && !reverseMap[depName].includes(pkgName)) {
            reverseMap[depName].push(pkgName);
          }
        });
      }
    });

    setPackageDependents(reverseMap);
  };

  const handleRefresh = async () => {
    await fetchPackages();
    await fetchLastUpdateTime();
  };

  const handlePackageClick = pkg => {
    setSelectedPackage(pkg);
    fetchPackageInfo(pkg.name, true);
    // Also fetch package commands
    apiService.fetchPackageCommands(pkg.name, true);
  };

  const handleDependencyClick = packageName => {
    // Find the package in the current packages list
    const pkg = packages.find(p => p.name === packageName);
    if (pkg) {
      setSelectedPackage(pkg);
      fetchPackageInfo(packageName, true);
      // Also fetch package commands
      apiService.fetchPackageCommands(packageName, true);
    } else {
      // If the package is not in the current list (e.g., it's a dependency but not installed),
      // create a temporary package object and show its info
      const tempPkg = { name: packageName, isInstalled: false };
      setSelectedPackage(tempPkg);
      fetchPackageInfo(packageName, true);
      // Also fetch package commands
      apiService.fetchPackageCommands(packageName, true);
    }
  };

  const handlePackageHover = packageName => {
    setHoveredPackage(packageName);
  };

  const handlePackageLeave = () => {
    setHoveredPackage(null);
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
    showSnackbar(`Successfully uninstalled ${packageName}`, 'success');
  };

  const handleInstallSuccess = packageName => {
    fetchPackages();
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
            Brewi
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
            onPackageHover={handlePackageHover}
            onPackageLeave={handlePackageLeave}
            hoveredPackage={hoveredPackage}
            packageDependencies={packageDependencies}
            packageDependents={packageDependents}
            packageDescriptions={packageDescriptions}
            dependenciesLoading={dependenciesLoading}
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
            onPackageHover={handlePackageHover}
            onPackageLeave={handlePackageLeave}
            hoveredPackage={hoveredPackage}
            packageDependencies={packageDependencies}
            packageDependents={packageDependents}
            packageDescriptions={packageDescriptions}
            dependenciesLoading={dependenciesLoading}
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
