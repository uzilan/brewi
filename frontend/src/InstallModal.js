import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

function InstallModal({ open, onClose, packageName, onInstallSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInstall = async () => {
    if (!packageName) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/packages/${encodeURIComponent(packageName)}/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.isSuccess && onInstallSuccess) {
          onInstallSuccess(packageName);
        }
      } else {
        setError(data.errorMessage || 'Failed to install package');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  const formatOutput = (output) => {
    if (!output) return 'No output available';
    
    return output.split('\n').map((line, index) => (
      <Typography key={index} variant="body2" component="div" sx={{ 
        fontFamily: 'monospace', 
        whiteSpace: 'pre-wrap',
        fontSize: '0.875rem',
        lineHeight: 1.4,
      }}>
        {line}
      </Typography>
    ));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DownloadIcon />
          <Typography variant="h6">Install Package</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!result && !error && !isLoading && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to install <strong>{packageName}</strong>?
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will use the <code>brew install {packageName}</code> command. 
              The installation may take several minutes depending on the package size and dependencies.
            </Alert>
          </Box>
        )}

        {isLoading && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6">Installing {packageName}...</Typography>
            <Typography variant="body2" color="text.secondary">
              This may take several minutes. Please wait.
            </Typography>
          </Box>
        )}

        {error && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">Installation Failed</Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          </Box>
        )}

        {result && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {result.isSuccess ? (
                <CheckCircleIcon color="success" />
              ) : (
                <ErrorIcon color="error" />
              )}
              <Typography variant="h6">
                {result.isSuccess ? 'Installation Completed' : 'Installation Failed'}
              </Typography>
            </Box>

            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={result.isSuccess ? 'Success' : 'Failed'}
                color={result.isSuccess ? 'success' : 'error'}
                size="small"
              />
            </Box>

            {result.output && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Installation Output:
                </Typography>
                <Box 
                  sx={{ 
                    bgcolor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1,
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  {formatOutput(result.output)}
                </Box>
              </Box>
            )}

            {result.errorMessage && (
              <Box mt={2}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'error.main' }}>
                  Error Message:
                </Typography>
                <Alert severity="error">
                  <Typography variant="body2">{result.errorMessage}</Typography>
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!isLoading && !result && !error && (
          <Button onClick={handleInstall} variant="contained" color="primary">
            Install {packageName}
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">
          {result || error ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InstallModal;
