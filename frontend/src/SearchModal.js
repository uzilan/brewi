import { Search as SearchIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';

import InstallModal from './InstallModal';
import PackageList from './PackageList';

function SearchModal({
  open,
  onClose,
  onPackageClick,
  installedPackages = [],
  onRefreshInstalledPackages,
  onInstallSuccess,
  onDependencyClick,
  onPackageHover,
  onPackageLeave,
  hoveredPackage,
  packageDependencies,
  packageDependents,
  packageDescriptions,
  dependenciesLoading,
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageInfoMap, setPackageInfoMap] = useState({});
  const [packageInfoLoading, setPackageInfoLoading] = useState({});
  const inputRef = useRef(null);

  const handleSearch = async e => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearchLoading(true);
      setSearchError(null);
      const response = await fetch(
        `/api/packages/search/${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
      
      // Fetch package info for non-installed packages in search results
      if (data && data.isSuccess && data.output) {
        const packageNames = data.output
          .split('\n')
          .filter(line => line.trim())
          .map(name => name.trim());
        
        // Fetch package info for non-installed packages
        packageNames.forEach(packageName => {
          const isInstalled = installedPackages.some(pkg => pkg.name === packageName);
          if (!isInstalled && !packageInfoMap[packageName] && !packageInfoLoading[packageName]) {
            fetchPackageInfo(packageName);
          }
        });
      }
    } catch (err) {
      setSearchError(err.message);
      console.error('Error searching packages:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setSearchResults(null);
    setSearchError(null);
    setPackageInfoMap({});
    setPackageInfoLoading({});
    onClose();
  };

  const handleInstallClick = pkg => {
    setSelectedPackage(pkg);
    setInstallModalOpen(true);
  };

  const fetchPackageInfo = async (packageName) => {
    if (packageInfoLoading[packageName] || packageInfoMap[packageName]) {
      return; // Already loading or loaded
    }

    setPackageInfoLoading(prev => ({ ...prev, [packageName]: true }));

    try {
      const response = await fetch(`/api/packages/${packageName}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.isSuccess) {
          setPackageInfoMap(prev => ({
            ...prev,
            [packageName]: {
              description: data.description || data.output?.split('\n')[1] || '',
              output: data.output || ''
            }
          }));
        }
      }
    } catch (err) {
      console.error(`Error fetching package info for ${packageName}:`, err);
    } finally {
      setPackageInfoLoading(prev => ({ ...prev, [packageName]: false }));
    }
  };

  const handleInstallSuccess = packageName => {
    // Refresh the installed packages list from parent
    if (onRefreshInstalledPackages) {
      onRefreshInstalledPackages();
    }
    // Call parent install success handler
    if (onInstallSuccess) {
      onInstallSuccess(packageName);
    }
    // Close the search modal and return to main view
    handleClose();
  };

  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    // Clear search results when query is cleared
    if (!query.trim()) {
      setSearchResults(null);
      setSearchError(null);
    }
  }, [query]);

  const parseSearchResults = searchData => {
    if (!searchData || !searchData.isSuccess || !searchData.output) {
      return [];
    }

    const installedPackageNames = installedPackages.map(pkg => pkg.name);

    return searchData.output
      .split('\n')
      .filter(line => line.trim())
      .map(name => {
        const packageName = name.trim();
        const isInstalled = installedPackageNames.includes(packageName);
        const packageInfo = packageInfoMap[packageName];
        
        return {
          name: packageName,
          version: null,
          isInstalled,
          description: packageInfo?.description || null,
        };
      });
  };

  const handlePackageClick = pkg => {
    onPackageClick(pkg);
    // Don't close the search modal - let the user return to search results
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>Search Packages</Typography>
          <Button onClick={handleClose} color='inherit'>
            ×
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, pt: 1 }}>
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label='Search packages'
                placeholder='Enter package name (e.g., python, git, node)'
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={searchLoading}
                size='small'
                // autoFocus
                variant='outlined'
                inputRef={inputRef}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    transform: 'translate(14px, 16px) scale(1)',
                    '&.Mui-focused': {
                      fontSize: '0.75rem',
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                    '&.MuiFormLabel-filled': {
                      fontSize: '0.75rem',
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.87)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <Button
                type='submit'
                variant='contained'
                startIcon={
                  searchLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SearchIcon />
                  )
                }
                disabled={searchLoading || !query.trim()}
                sx={{ minWidth: 120 }}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </form>

          {searchError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {searchError}
            </Alert>
          )}
        </Box>

        {searchResults && query.trim() && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='h6'>Search Results</Typography>
              <Chip
                label={`${parseSearchResults(searchResults).length} packages found`}
                color='primary'
                variant='outlined'
              />
            </Box>

            {parseSearchResults(searchResults).length > 0 ? (
              <PackageList
                packages={parseSearchResults(searchResults)}
                onPackageClick={handlePackageClick}
                onInstallClick={handleInstallClick}
                onDependencyClick={onDependencyClick}
                onPackageHover={onPackageHover}
                onPackageLeave={onPackageLeave}
                hoveredPackage={hoveredPackage}
                packageDependencies={packageDependencies}
                packageDependents={packageDependents}
                packageDescriptions={packageDescriptions}
                dependenciesLoading={dependenciesLoading}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='h6' color='text.secondary'>
                  No packages found for &quot;{query}&quot;
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>

      <InstallModal
        open={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        packageName={selectedPackage?.name}
        onInstallSuccess={handleInstallSuccess}
      />
    </Dialog>
  );
}

export default SearchModal;
