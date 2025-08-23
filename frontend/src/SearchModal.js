import React, { useState } from 'react';
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

function SearchModal({ open, onClose, onPackageClick }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

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

  const parseSearchResults = (searchData) => {
    if (!searchData || !searchData.isSuccess || !searchData.output) {
      return [];
    }
    
    return searchData.output
      .split('\n')
      .filter(line => line.trim())
      .map(name => ({ name: name.trim(), version: null }));
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
        <Box sx={{ mb: 3 }}>
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Search packages"
                placeholder="Enter package name (e.g., python, git, node)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={searchLoading}
                size="small"
                autoFocus
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
    </Dialog>
  );
}

export default SearchModal;
