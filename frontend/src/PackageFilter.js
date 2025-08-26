import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  TextField,
  Box,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import { useState } from 'react';

function PackageFilter({ onFilterChange, filteredCount, totalCount }) {
  const [filterValue, setFilterValue] = useState('');

  const handleFilterChange = e => {
    const value = e.target.value;
    setFilterValue(value);
    onFilterChange(value);
  };

  const handleClearFilter = () => {
    setFilterValue('');
    onFilterChange('');
  };

  return (
    <Box sx={{ mb: 3, pt: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          placeholder='Type to filter installed packages...'
          value={filterValue}
          onChange={handleFilterChange}
          size='small'
          variant='outlined'
          sx={{
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
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon color='action' />
              </InputAdornment>
            ),
            endAdornment: filterValue && (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={handleClearFilter} edge='end'>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {filterValue && (
          <Chip
            label={`${filteredCount} of ${totalCount}`}
            color='primary'
            variant='outlined'
            size='small'
          />
        )}
      </Box>
    </Box>
  );
}

export default PackageFilter;
