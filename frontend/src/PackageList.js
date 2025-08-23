import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Button
} from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckCircleIcon, Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';

function PackageList({ packages, onPackageClick, onInstallClick, onUninstallClick }) {
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
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
                               <CardContent>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <Box sx={{ flex: 1 }}>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                           <Typography variant="h6" component="h3">
                             {pkg.name}
                           </Typography>
                           {pkg.isInstalled && (
                             <Chip
                               label="Installed"
                               size="small"
                               color="success"
                               icon={<CheckCircleIcon />}
                               sx={{ fontSize: '0.75rem', height: 20 }}
                             />
                           )}
                         </Box>
                         <Typography variant="body2" color="text.secondary">
                           Version: {pkg.version || 'N/A'}
                         </Typography>
                       </Box>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                         <Button
                           size="small"
                           startIcon={<InfoIcon />}
                           onClick={(e) => {
                             e.stopPropagation();
                             onPackageClick(pkg);
                           }}
                           sx={{ minWidth: 'auto', px: 1 }}
                         >
                           Info
                         </Button>
                         {!pkg.isInstalled && onInstallClick && (
                           <Button
                             size="small"
                             variant="contained"
                             startIcon={<DownloadIcon />}
                             onClick={(e) => {
                               e.stopPropagation();
                               onInstallClick(pkg);
                             }}
                             sx={{ minWidth: 'auto', px: 1 }}
                           >
                             Install
                           </Button>
                         )}
                         {pkg.isInstalled && onUninstallClick && (
                           <Button
                             size="small"
                             variant="contained"
                             color="error"
                             startIcon={<DeleteIcon />}
                             onClick={(e) => {
                               e.stopPropagation();
                               onUninstallClick(pkg);
                             }}
                             sx={{ minWidth: 'auto', px: 1 }}
                           >
                             Uninstall
                           </Button>
                         )}
                       </Box>
                     </Box>
                   </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default PackageList;
