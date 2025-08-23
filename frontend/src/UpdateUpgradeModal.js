import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

function UpdateUpgradeModal({ open, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdateAndUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/packages/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.errorMessage || 'Failed to update and upgrade Homebrew');
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
          <UpdateIcon />
          <Typography variant="h6">Update and Upgrade Homebrew</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!result && !error && !isLoading && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will update Homebrew itself and then upgrade all installed packages. 
              This process may take several minutes.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              The update will fetch the latest package information, and the upgrade will 
              update all outdated packages to their latest versions.
            </Alert>
          </Box>
        )}

        {isLoading && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6">Updating and Upgrading...</Typography>
            <Typography variant="body2" color="text.secondary">
              This may take several minutes. Please wait.
            </Typography>
          </Box>
        )}

        {error && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">Error</Typography>
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
                {result.isSuccess ? 'Update and Upgrade Completed' : 'Update and Upgrade Failed'}
              </Typography>
            </Box>

            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={`Exit Code: ${result.exitCode}`}
                color={result.exitCode === 0 ? 'success' : 'error'}
                size="small"
              />
              <Chip 
                label={result.isSuccess ? 'Success' : 'Failed'}
                color={result.isSuccess ? 'success' : 'error'}
                size="small"
              />
            </Box>

            {result.output && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Command Output:
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
          <Button onClick={handleUpdateAndUpgrade} variant="contained" color="primary">
            Start Update & Upgrade
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">
          {result || error ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UpdateUpgradeModal;
