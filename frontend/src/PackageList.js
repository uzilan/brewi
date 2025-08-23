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
import { CheckCircle as CheckCircleIcon, Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';

function PackageList({ packages, onPackageClick, onInstallClick, onUninstallClick, onDependencyClick, dependencyMap, dependentsMap }) {
  const getDependencies = (packageName) => {
    return dependencyMap?.get(packageName) || new Set();
  };

  const getDependents = (packageName) => {
    return dependentsMap?.get(packageName) || new Set();
  };

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
      {packages.map((pkg, index) => {
        const dependencies = getDependencies(pkg.name);
        const dependents = getDependents(pkg.name);
        
        return (
          <Grid key={index} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
            <Card 
              onClick={() => onPackageClick(pkg)}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                cursor: 'pointer',
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Version: {pkg.version || 'N/A'}
                    </Typography>

                    {/* Dependencies Section */}
                    {dependencies.size > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Dependencies ({dependencies.size}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {Array.from(dependencies).slice(0, 3).map((dep, idx) => (
                            <Chip
                              key={idx}
                              label={dep}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 18,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDependencyClick) {
                                  onDependencyClick(dep);
                                }
                              }}
                            />
                          ))}
                          {dependencies.size > 3 && (
                            <Chip
                              label={`+${dependencies.size - 3} more`}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Dependents Section */}
                    {dependents.size > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Dependents ({dependents.size}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {Array.from(dependents).slice(0, 3).map((dep, idx) => (
                            <Chip
                              key={idx}
                              label={dep}
                              size="small"
                              variant="outlined"
                              color="secondary"
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: 18,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'secondary.light',
                                  color: 'secondary.contrastText'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDependencyClick) {
                                  onDependencyClick(dep);
                                }
                              }}
                            />
                          ))}
                          {dependents.size > 3 && (
                            <Chip
                              label={`+${dependents.size - 3} more`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* No dependencies/dependents message */}
                    {dependencies.size === 0 && dependents.size === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No dependencies or dependents
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUninstallClick(pkg);
                        }}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 1,
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'error.contrastText'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default PackageList;
