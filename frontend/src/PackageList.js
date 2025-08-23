import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

function PackageList({ packages, onPackageClick }) {
  if (packages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No packages found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {packages.map((pkg, index) => (
        <Grid key={index} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => onPackageClick(pkg)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {pkg.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Version: {pkg.version || 'N/A'}
                  </Typography>
                </Box>
                <InfoIcon color="action" sx={{ ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default PackageList;
