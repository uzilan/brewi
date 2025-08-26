import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
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
  Chip,
} from '@mui/material';
import { useState } from 'react';

function UninstallModal({ open, onClose, packageName, onUninstallSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUninstall = async () => {
    if (!packageName) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/packages/${encodeURIComponent(packageName)}/uninstall`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.isSuccess && onUninstallSuccess) {
          onUninstallSuccess();
          // Immediately close modal on success
          handleClose();
        }
      } else {
        setError(data.errorMessage || 'Failed to uninstall package');
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

  const formatOutput = output => {
    if (!output) return 'No output available';

    return output.split('\n').map((line, index) => (
      <Typography
        key={index}
        variant='body2'
        component='div'
        sx={{
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '0.875rem',
          lineHeight: 1.4,
        }}
      >
        {line}
      </Typography>
    ));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <DeleteIcon />
          <Typography variant='h6'>Uninstall Package</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!result && !error && !isLoading && (
          <Box>
            <Typography variant='body1' sx={{ mb: 2 }}>
              Are you sure you want to uninstall <strong>{packageName}</strong>?
            </Typography>
            <Alert severity='warning' sx={{ mb: 2 }}>
              This will use the <code>brew uninstall {packageName}</code>{' '}
              command. This action cannot be undone and will remove the package
              and its files from your system.
            </Alert>
          </Box>
        )}

        {isLoading && (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={2}
            py={4}
          >
            <CircularProgress size={60} />
            <Typography variant='h6'>Uninstalling {packageName}...</Typography>
            <Typography variant='body2' color='text.secondary'>
              This may take a few moments. Please wait.
            </Typography>
          </Box>
        )}

        {error && (
          <Box>
            <Alert severity='error' sx={{ mb: 2 }}>
              <Typography variant='body1' fontWeight='bold'>
                Uninstallation Failed
              </Typography>
              <Typography variant='body2'>{error}</Typography>
            </Alert>
          </Box>
        )}

        {result && (
          <Box>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              {result.isSuccess ? (
                <CheckCircleIcon color='success' />
              ) : (
                <ErrorIcon color='error' />
              )}
              <Typography variant='h6'>
                {result.isSuccess
                  ? `Successfully uninstalled ${packageName}`
                  : 'Uninstallation Failed'}
              </Typography>
            </Box>

            {result.isSuccess && (
              <Alert severity='success' sx={{ mb: 2 }}>
                <Typography variant='body2'>
                  The package has been successfully removed from your system.
                </Typography>
              </Alert>
            )}

            <Box display='flex' gap={1} mb={2}>
              <Chip
                label={result.isSuccess ? 'Success' : 'Failed'}
                color={result.isSuccess ? 'success' : 'error'}
                variant='outlined'
              />
            </Box>

            {result.output && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='subtitle2'
                  sx={{ mb: 1, fontWeight: 'bold' }}
                >
                  Command Output:
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 300,
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
              <Alert severity='error' sx={{ mb: 2 }}>
                <Typography variant='body2'>{result.errorMessage}</Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!result && !error && !isLoading && (
          <>
            <Button onClick={handleClose} color='inherit'>
              Cancel
            </Button>
            <Button
              onClick={handleUninstall}
              variant='contained'
              color='error'
              startIcon={<DeleteIcon />}
            >
              Uninstall
            </Button>
          </>
        )}

        {(result || error) && (
          <Button onClick={handleClose} variant='contained'>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default UninstallModal;
