import {
  LocalHospital as DoctorIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
import { useState } from 'react';

function DoctorModal({ open, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunDoctor = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/packages/doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.errorMessage || 'Failed to run brew doctor');
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

    return output.split('\n').map(line => (
      <Typography
        key={line}
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

  const getSeverity = () => {
    if (!result) return 'info';
    if (result.isSuccess) {
      // Check if the output contains any warning indicators
      const output = result.output?.toLowerCase() || '';
      if (
        output.includes('warning') ||
        output.includes('issue') ||
        output.includes('problem')
      ) {
        return 'warning';
      }
      return 'success';
    }
    return 'error';
  };

  const getIcon = () => {
    if (!result) return <DoctorIcon />;
    if (result.isSuccess) {
      const severity = getSeverity();
      return severity === 'success' ? <CheckCircleIcon /> : <WarningIcon />;
    }
    return <ErrorIcon />;
  };

  const getTitle = () => {
    if (!result) return 'Run Brew Doctor';
    if (result.isSuccess) {
      const severity = getSeverity();
      return severity === 'success'
        ? 'System Check Passed'
        : 'System Check Completed';
    }
    return 'System Check Failed';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          {getIcon()}
          <Typography variant='h6'>{getTitle()}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!result && !error && !isLoading && (
          <Box>
            <Typography variant='body1' sx={{ mb: 2 }}>
              This will run <code>brew doctor</code> to diagnose and fix common
              issues with your Homebrew installation. This process may take
              several minutes.
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>
              Brew doctor will check for:
            </Alert>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant='body2' component='div' sx={{ mb: 1 }}>
                • System configuration issues
              </Typography>
              <Typography variant='body2' component='div' sx={{ mb: 1 }}>
                • Permission problems
              </Typography>
              <Typography variant='body2' component='div' sx={{ mb: 1 }}>
                • Outdated packages and dependencies
              </Typography>
              <Typography variant='body2' component='div' sx={{ mb: 1 }}>
                • Missing or broken symlinks
              </Typography>
              <Typography variant='body2' component='div'>
                • General Homebrew health status
              </Typography>
            </Box>
          </Box>
        )}

        {isLoading && (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant='h6'>Running brew doctor...</Typography>
            <Typography variant='body2' color='text.secondary'>
              This may take several minutes. Please wait.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Chip
                label={result.isSuccess ? 'Success' : 'Failed'}
                color={result.isSuccess ? 'success' : 'error'}
                variant='outlined'
                sx={{ mr: 1 }}
              />
              {result.exitCode !== undefined && (
                <Chip
                  label={`Exit Code: ${result.exitCode}`}
                  variant='outlined'
                  size='small'
                />
              )}
            </Box>

            <Alert severity={getSeverity()} sx={{ mb: 2 }}>
              {result.isSuccess
                ? 'Brew doctor completed successfully. Check the output below for any warnings or recommendations.'
                : 'Brew doctor encountered issues. Check the output below for details.'}
            </Alert>

            <Typography variant='h6' sx={{ mb: 1, fontFamily: 'monospace' }}>
              Output:
            </Typography>
            <Box
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'grey.300',
              }}
            >
              {formatOutput(result.output)}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!result && !error && !isLoading && (
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
        )}
        {!result && !error && !isLoading && (
          <Button
            onClick={handleRunDoctor}
            variant='contained'
            color='primary'
            startIcon={<DoctorIcon />}
          >
            Run Doctor
          </Button>
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

export default DoctorModal;
