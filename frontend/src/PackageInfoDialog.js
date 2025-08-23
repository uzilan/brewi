import React from 'react';
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
  Grid
} from '@mui/material';

function PackageInfoDialog({ 
  open, 
  onClose, 
  selectedPackage, 
  packageInfo, 
  packageInfoLoading, 
  packageInfoError 
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedPackage?.name} - Package Information
          </Typography>
          <Button onClick={onClose} color="inherit">
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
          <Alert severity="error">
            Error loading package information: {packageInfoError}
          </Alert>
        ) : packageInfo ? (
          <Box>
            {/* Dependencies Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Dependencies
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {packageInfo.dependencies && packageInfo.dependencies.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {packageInfo.dependencies.map((dep, index) => (
                    <Chip 
                      key={index} 
                      label={dep} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No dependencies
                </Typography>
              )}
            </Paper>

            {/* Dependents Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Dependents (Packages that depend on this)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {packageInfo.dependents && packageInfo.dependents.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {packageInfo.dependents.map((dep, index) => (
                    <Chip 
                      key={index} 
                      label={dep} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No packages depend on this
                </Typography>
              )}
            </Paper>

            {/* Command Output Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Command Output
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box 
                component="pre" 
                sx={{ 
                  backgroundColor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {packageInfo.output || 'No output available'}
              </Box>
            </Paper>
            
            {packageInfo.errorMessage && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Error Message
                </Typography>
                <Typography variant="body2" color="error">
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
