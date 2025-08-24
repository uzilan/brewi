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
  Grid,
} from '@mui/material';
import React from 'react';

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
  onDependencyClick,
}) {
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
        {packageInfoLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : packageInfoError ? (
          <Alert severity='error'>
            Error loading package information: {packageInfoError}
          </Alert>
        ) : packageInfo ? (
          <Box>
            {/* Dependencies Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                Dependencies
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {packageInfo.dependencies &&
              packageInfo.dependencies.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {packageInfo.dependencies.map((dep, index) => (
                    <Chip
                      key={index}
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

            {/* Dependents Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                Dependents (Packages that depend on this)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {packageInfo.dependents && packageInfo.dependents.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {packageInfo.dependents.map((dep, index) => (
                    <Chip
                      key={index}
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

            {/* Commands Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                Available Commands
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {packageCommandsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
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
                  {packageCommands.commands.map((command, index) => (
                    <Chip
                      key={index}
                      label={command}
                      size='small'
                      variant='filled'
                      color='success'
                      sx={{
                        fontFamily: 'monospace',
                        backgroundColor: 'success.light',
                        color: 'success.contrastText',
                        '&:hover': {
                          backgroundColor: 'success.main',
                        },
                      }}
                    />
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

            {/* Command Output Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' gutterBottom>
                Command Output
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                component='pre'
                sx={{
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {packageInfo.output || 'No output available'}
              </Box>
            </Paper>

            {packageInfo.errorMessage && (
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
    </Dialog>
  );
}

export default PackageInfoDialog;
