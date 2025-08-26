import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
} from '@mui/material';

function PackageList({
  packages,
  onPackageClick,
  onInstallClick,
  onUninstallClick,
  onPackageHover,
  onPackageLeave,
  hoveredPackage,
  packageDependencies,
  packageDependents,
  packageDescriptions,
  dependenciesLoading,
}) {
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
    <Box>
      {dependenciesLoading && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant='caption' color='text.secondary'>
            Loading dependency information for hover highlighting...
          </Typography>
        </Box>
      )}
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
          // Determine if this package should be highlighted based on hover state
          const isHighlighted =
            hoveredPackage &&
            hoveredPackage !== pkg.name &&
            ((packageDependencies[hoveredPackage] &&
              packageDependencies[hoveredPackage].dependencies.includes(
                pkg.name
              )) ||
              (packageDependents[hoveredPackage] &&
                packageDependents[hoveredPackage].includes(pkg.name)));

          const isHovered = hoveredPackage === pkg.name;

          return (
            <Card
              key={index}
              onClick={() => onPackageClick(pkg)}
              onMouseEnter={() => onPackageHover && onPackageHover(pkg.name)}
              onMouseLeave={() => onPackageLeave && onPackageLeave()}
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                opacity: isHighlighted ? 0.3 : 1,
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? 3 : 1,
                border: isHighlighted
                  ? '2px solid #1976d2'
                  : '2px solid transparent',
                backgroundColor: isHighlighted
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'inherit',
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
                    {(packageDescriptions[pkg.name] || pkg.description) && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{
                          fontSize: '0.7rem',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {packageDescriptions[pkg.name] || pkg.description}
                      </Typography>
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
    </Box>
  );
}

export default PackageList;
