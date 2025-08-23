import React, { useState } from 'react';
import {
  TextField,
  Box,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

function PackageFilter({ onFilterChange, filteredCount, totalCount }) {
  const [filterValue, setFilterValue] = useState('');

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterValue(value);
    onFilterChange(value);
  };

  const handleClearFilter = () => {
    setFilterValue('');
    onFilterChange('');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Filter packages"
          placeholder="Type to filter installed packages..."
          value={filterValue}
          onChange={handleFilterChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filterValue && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearFilter}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {filterValue && (
          <Chip 
            label={`${filteredCount} of ${totalCount}`} 
            color="primary" 
            variant="outlined"
            size="small"
          />
        )}
      </Box>
    </Box>
  );
}

export default PackageFilter;
