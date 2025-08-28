import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import { useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import InstallModal from './InstallModal';

function PackageInfoDialog({
  open,
  onClose,
  selectedPackage,
  packageInfo,
  packageInfoLoading,
  packageInfoError,
  packageCommands,
  packageCommandsLoading,
  packageCommandsError,
  tldrInfo,
  tldrLoading,
  tldrError,
  onDependencyClick,
  onCommandClick,
  onInstallSuccess,
}) {
  // Install modal state
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Refs for scrolling to sections
  const packageInfoRef = useRef(null);
  const dependenciesRef = useRef(null);
  const dependentsRef = useRef(null);
  const commandsRef = useRef(null);
  const documentationRef = useRef(null);

  const scrollToSection = ref => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInstallClick = () => {
    setInstallModalOpen(true);
  };

  const handleInstallSuccess = packageName => {
    setInstallModalOpen(false);
    if (onInstallSuccess) {
      onInstallSuccess(packageName);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>
            {selectedPackage?.name} - Package Information
          </Typography>
          <Button onClick={onClose} color='inherit'>
            ×
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {packageInfoError ? (
          <Alert severity='error'>
            Error loading package information: {packageInfoError}
          </Alert>
        ) : packageInfo || packageCommands ? (
          <Box sx={{ position: 'relative' }}>
            {/* Install Button for Uninstalled Packages */}
            {packageInfo && !selectedPackage?.isInstalled && (
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  float: 'right',
                  zIndex: 1,
                  ml: 2,
                  mb: 2,
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  size='small'
                  onClick={handleInstallClick}
                >
                  Install
                </Button>
              </Box>
            )}

            {/* Table of Contents for Installed Packages */}
            {packageInfo && selectedPackage?.isInstalled && (
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  float: 'right',
                  zIndex: 1,
                  backgroundColor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  minWidth: '120px',
                  boxShadow: 1,
                  ml: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ fontWeight: 'bold', mb: 0.5 }}
                >
                  Contents
                </Typography>
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                >
                  <Typography
                    variant='caption'
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => scrollToSection(packageInfoRef)}
                  >
                    Package Information
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => scrollToSection(dependenciesRef)}
                  >
                    Dependencies
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => scrollToSection(dependentsRef)}
                  >
                    Dependents
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => scrollToSection(commandsRef)}
                  >
                    Commands
                  </Typography>
                  {(tldrInfo || tldrLoading || tldrError) && (
                    <Typography
                      variant='caption'
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' },
                      }}
                      onClick={() => scrollToSection(documentationRef)}
                    >
                      Documentation
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {/* Show loading indicator if both are still loading */}
            {packageInfoLoading &&
              !packageInfo &&
              packageCommandsLoading &&
              !packageCommands && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

            {/* Package Information Section - shown for both installed and uninstalled packages */}
            {packageInfo && (
              <Paper ref={packageInfoRef} sx={{ p: 2, mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom>
                  Package Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  <SyntaxHighlighter
                    language='bash'
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                    showLineNumbers={false}
                  >
                    {packageInfo.output || 'No package information available'}
                  </SyntaxHighlighter>
                </Box>
              </Paper>
            )}
            {/* Dependencies Section */}
            {packageInfo && selectedPackage?.isInstalled && (
              <Paper ref={dependenciesRef} sx={{ p: 2, mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom>
                  Dependencies
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {packageInfo.dependencies &&
                packageInfo.dependencies.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {packageInfo.dependencies.map(dep => (
                      <Chip
                        key={dep}
                        label={dep}
                        size='small'
                        variant='outlined'
                        color='primary'
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                          },
                        }}
                        onClick={() => {
                          if (onDependencyClick) {
                            onDependencyClick(dep);
                          }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No dependencies
                  </Typography>
                )}
              </Paper>
            )}

            {/* Dependents Section */}
            {packageInfo && selectedPackage?.isInstalled && (
              <Paper ref={dependentsRef} sx={{ p: 2, mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom>
                  Dependents (Packages that depend on this)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {packageInfo.dependents && packageInfo.dependents.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {packageInfo.dependents.map(dep => (
                      <Chip
                        key={dep}
                        label={dep}
                        size='small'
                        variant='outlined'
                        color='secondary'
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText',
                          },
                        }}
                        onClick={() => {
                          if (onDependencyClick) {
                            onDependencyClick(dep);
                          }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No packages depend on this
                  </Typography>
                )}
              </Paper>
            )}

            {/* Commands Section */}
            {selectedPackage?.isInstalled && (
              <Paper ref={commandsRef} sx={{ p: 2, mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom>
                  Available Commands
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {packageCommandsLoading ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : packageCommandsError ? (
                  <Alert severity='error' sx={{ mb: 1 }}>
                    Error loading commands: {packageCommandsError}
                  </Alert>
                ) : packageCommands &&
                  packageCommands.commands &&
                  packageCommands.commands.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {packageCommands.commands.map(command => (
                      <Tooltip
                        key={command}
                        title={`Click to see documentation for ${command}`}
                        arrow
                      >
                        <Chip
                          label={command}
                          size='small'
                          variant={
                            tldrInfo && tldrInfo.command === command
                              ? 'filled'
                              : 'outlined'
                          }
                          color={
                            tldrInfo && tldrInfo.command === command
                              ? 'primary'
                              : 'success'
                          }
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor:
                              tldrInfo && tldrInfo.command === command
                                ? 'primary.main'
                                : 'success.light',
                            color:
                              tldrInfo && tldrInfo.command === command
                                ? 'primary.contrastText'
                                : 'success.contrastText',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor:
                                tldrInfo && tldrInfo.command === command
                                  ? 'primary.dark'
                                  : 'success.main',
                            },
                          }}
                          onClick={() => {
                            if (onCommandClick) {
                              onCommandClick(command);
                            }
                            // Scroll to documentation section after a short delay to allow tldr info to load
                            setTimeout(() => {
                              scrollToSection(documentationRef);
                            }, 100);
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                ) : packageCommands && packageCommands.isSuccess === false ? (
                  <Typography variant='body2' color='text.secondary'>
                    {packageCommands.errorMessage || 'Failed to load commands'}
                  </Typography>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No commands available
                  </Typography>
                )}
              </Paper>
            )}

            {/* Tldr Documentation Section */}
            {selectedPackage?.isInstalled &&
              (tldrInfo || tldrLoading || tldrError) && (
                <Paper ref={documentationRef} sx={{ p: 2, mb: 2 }}>
                  <Typography variant='subtitle1' gutterBottom>
                    Command Documentation (tldr)
                    {tldrInfo && tldrInfo.command && (
                      <Typography
                        component='span'
                        variant='body2'
                        color='primary'
                        sx={{ ml: 1, fontWeight: 'normal' }}
                      >
                        - {tldrInfo.command}
                      </Typography>
                    )}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {tldrLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : tldrError ? (
                    <Alert severity='error' sx={{ mb: 1 }}>
                      Error loading documentation: {tldrError}
                    </Alert>
                  ) : tldrInfo ? (
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <SyntaxHighlighter
                        language='bash'
                        style={oneDark}
                        customStyle={{
                          margin: 0,
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                        }}
                        showLineNumbers={false}
                      >
                        {tldrInfo.output || 'No documentation available'}
                      </SyntaxHighlighter>
                    </Box>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      Click on a command above to see its documentation
                    </Typography>
                  )}
                </Paper>
              )}

            {packageInfo && packageInfo.errorMessage && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                >
                  Error Message
                </Typography>
                <Typography variant='body2' color='error'>
                  {packageInfo.errorMessage}
                </Typography>
              </Paper>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
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

export default PackageInfoDialog;
