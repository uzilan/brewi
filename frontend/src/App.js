import React, { useState, useEffect } from 'react';
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
  Chip
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
      setPackages(data.packages || []);
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
  };

  const fetchPackageInfo = async (packageName) => {
    try {
      setPackageInfoLoading(true);
      setPackageInfoError(null);
      const response = await fetch(`/api/packages/${packageName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPackageInfo(data);
    } catch (err) {
      setPackageInfoError(err.message);
      console.error('Error fetching package info:', err);
    } finally {
      setPackageInfoLoading(false);
    }
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    fetchPackageInfo(pkg.name);
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
    fetchPackages();
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
        />

        <PackageInfoDialog
          open={selectedPackage !== null}
          onClose={handleCloseDialog}
          selectedPackage={selectedPackage}
          packageInfo={packageInfo}
          packageInfoLoading={packageInfoLoading}
          packageInfoError={packageInfoError}
        />

                <SearchModal 
          open={searchModalOpen} 
          onClose={handleCloseSearchModal} 
          onPackageClick={handlePackageClick}
          installedPackages={packages}
          onRefreshInstalledPackages={fetchPackages}
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
      </Container>
    </Box>
  );
}

export default App;
