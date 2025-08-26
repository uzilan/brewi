// Re-export all services for backward compatibility
export { generalApiService } from './generalApiService';
export { packageCommandsService } from './packageCommandsService';
export { packageInfoService } from './packageInfoService';
export { tldrService } from './tldrService';

// Legacy apiService object for backward compatibility
import { generalApiService } from './generalApiService';
import { packageCommandsService } from './packageCommandsService';
import { packageInfoService } from './packageInfoService';
import { tldrService } from './tldrService';

export const apiService = {
  // Package Info API
  fetchPackageInfo: packageInfoService.fetchPackageInfo,

  // Package Commands API
  fetchPackageCommands: packageCommandsService.fetchPackageCommands,

  // Tldr API
  fetchTldrInfo: tldrService.fetchTldrInfo,

  // General API calls
  fetchPackages: generalApiService.fetchPackages,
  fetchLastUpdateTime: generalApiService.fetchLastUpdateTime,
};
