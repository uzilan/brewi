import React, { useState, useEffect, useRef } from 'react';
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
  Chip
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import PackageList from './PackageList';
import InstallModal from './InstallModal';

function SearchModal({ open, onClose, onPackageClick, installedPackages = [], onRefreshInstalledPackages }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearchLoading(true);
      setSearchError(null);
      const response = await fetch(`/api/packages/search/${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
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
    onClose();
  };

  const handleInstallClick = (pkg) => {
    setSelectedPackage(pkg);
    setInstallModalOpen(true);
  };

  const refreshSearchResults = async () => {
    if (!query.trim()) return;

    try {
      setSearchLoading(true);
      setSearchError(null);
      const response = await fetch(`/api/packages/search/${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message);
      console.error('Error refreshing search results:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInstallSuccess = () => {
    // Refresh the search results to update the installed status
    if (query.trim()) {
      refreshSearchResults();
    }
    // Also refresh the installed packages list from parent
    if (onRefreshInstalledPackages) {
      onRefreshInstalledPackages();
    }
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

  const parseSearchResults = (searchData) => {
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
        return { 
          name: packageName, 
          version: null,
          isInstalled 
        };
      });
  };

  const handlePackageClick = (pkg) => {
    onPackageClick(pkg);
    handleClose(); // Close the search modal when a package is selected
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Search Packages
          </Typography>
          <Button onClick={handleClose} color="inherit">
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
                label="Search packages"
                placeholder="Enter package name (e.g., python, git, node)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={searchLoading}
                size="small"
                autoFocus
                variant="outlined"
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
                    }
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
                type="submit"
                variant="contained"
                startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                disabled={searchLoading || !query.trim()}
                sx={{ minWidth: 120 }}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </form>

          {searchError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {searchError}
            </Alert>
          )}
        </Box>

        {searchResults && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Search Results
              </Typography>
              <Chip 
                label={`${parseSearchResults(searchResults).length} packages found`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            {parseSearchResults(searchResults).length > 0 ? (
              <PackageList 
                packages={parseSearchResults(searchResults)} 
                onPackageClick={handlePackageClick}
                onInstallClick={handleInstallClick}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No packages found for "{query}"
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
