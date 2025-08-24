import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Button,
} from '@mui/material';
import React, { useState } from 'react';

function PackageList({
  packages,
  onPackageClick,
  onInstallClick,
  onUninstallClick,
  onDependencyClick,
  dependencyMap,
  dependentsMap,
  packageInfoCache,
}) {
  const [hoveredPackage, setHoveredPackage] = useState(null);
  const getDependencies = packageName => {
    return dependencyMap?.get(packageName) || new Set();
  };

  const getDependents = packageName => {
    return dependentsMap?.get(packageName) || new Set();
  };

  const getHighlightInfo = packageName => {
    if (!hoveredPackage) return null;

    const hoveredDependencies = getDependencies(hoveredPackage);
    const hoveredDependents = getDependents(hoveredPackage);

    // Check if this package is a dependency of the hovered package
    if (hoveredDependencies.has(packageName)) {
      return { type: 'dependency', color: 'rgba(25, 118, 210, 0.08)' };
    }

    // Check if this package is a dependent of the hovered package
    if (hoveredDependents.has(packageName)) {
      return { type: 'dependent', color: 'rgba(156, 39, 176, 0.08)' };
    }

    return null;
  };

  if (packages.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6' color='text.secondary'>
          No packages found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)',
        },
        gap: 2,
      }}
    >
      {packages.map((pkg, index) => {
        const dependencies = getDependencies(pkg.name);
        const dependents = getDependents(pkg.name);
        const highlightInfo = getHighlightInfo(pkg.name);
        const cachedInfo = packageInfoCache?.get(pkg.name);
        const description = cachedInfo?.description;

        return (
          <Card
            key={index}
            onClick={() => onPackageClick(pkg)}
            onMouseEnter={() => setHoveredPackage(pkg.name)}
            onMouseLeave={() => setHoveredPackage(null)}
            sx={{
              height: '100%',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              backgroundColor: highlightInfo
                ? highlightInfo.color
                : 'background.paper',
              border: highlightInfo
                ? `1px solid ${highlightInfo.type === 'dependency' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(156, 39, 176, 0.3)'}`
                : '1px solid transparent',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant='subtitle1'
                      component='h3'
                      sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                    >
                      {pkg.name}
                    </Typography>
                    {pkg.isInstalled && (
                      <Chip
                        label='Installed'
                        size='small'
                        color='success'
                        icon={<CheckCircleIcon />}
                        sx={{ fontSize: '0.7rem', height: 18 }}
                      />
                    )}
                  </Box>
                  {description && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{
                        fontSize: '0.65rem',
                        mb: 1,
                        lineHeight: 1.2,
                        display: 'block',
                      }}
                    >
                      {description}
                    </Typography>
                  )}
                  {pkg.version && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        mb: 0.5,
                        display: 'block',
                      }}
                    >
                      Version: {pkg.version}
                    </Typography>
                  )}

                  {/* Dependencies Section */}
                  {dependencies.size > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                      >
                        Dependencies ({dependencies.size}):
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.3,
                          mt: 0.3,
                        }}
                      >
                        {Array.from(dependencies)
                          .slice(0, 3)
                          .map((dep, idx) => (
                            <Chip
                              key={idx}
                              label={dep}
                              size='small'
                              variant='outlined'
                              color='primary'
                              sx={{
                                fontSize: '0.65rem',
                                height: 16,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'primary.contrastText',
                                },
                              }}
                              onClick={e => {
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
                            size='small'
                            variant='outlined'
                            color='primary'
                            sx={{ fontSize: '0.65rem', height: 16 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Dependents Section */}
                  {dependents.size > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                      >
                        Dependents ({dependents.size}):
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.3,
                          mt: 0.3,
                        }}
                      >
                        {Array.from(dependents)
                          .slice(0, 3)
                          .map((dep, idx) => (
                            <Chip
                              key={idx}
                              label={dep}
                              size='small'
                              variant='outlined'
                              color='secondary'
                              sx={{
                                fontSize: '0.7rem',
                                height: 18,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'secondary.light',
                                  color: 'secondary.contrastText',
                                },
                              }}
                              onClick={e => {
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
                            size='small'
                            variant='outlined'
                            color='secondary'
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!pkg.isInstalled && onInstallClick && (
                    <Button
                      size='small'
                      variant='contained'
                      startIcon={<DownloadIcon />}
                      onClick={e => {
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
                      size='small'
                      variant='text'
                      onClick={e => {
                        e.stopPropagation();
                        onUninstallClick(pkg);
                      }}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'error.contrastText',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default PackageList;
