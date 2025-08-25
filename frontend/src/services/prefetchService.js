import useCacheStore from '../stores/cacheStore';

export const prefetchService = {
  async prefetchAllPackageInfo(packagesList) {
    const cacheStore = useCacheStore.getState();

    // Initialize dependency maps
    cacheStore.initializeDependencyMaps(packagesList);

    // Prefetch all package info in background with staggered requests
    const prefetchPromises = packagesList.map(
      (pkg, index) =>
        new Promise((resolve, reject) => {
          // Stagger requests by 100ms to avoid overwhelming the server
          setTimeout(async () => {
            try {
              // Add timeout protection for package info fetch
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

              try {
                const response = await fetch(`/api/packages/${pkg.name}`, {
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Cache the package info
                cacheStore.setPackageInfo(pkg.name, data);

                // Update dependency maps
                if (data.dependencies) {
                  cacheStore.setDependencyMap(pkg.name, data.dependencies);

                  // Update dependents map for each dependency
                  data.dependencies.forEach(dep => {
                    cacheStore.addDependent(dep, pkg.name);
                  });
                }

                // Also fetch and cache commands for this package with timeout
                let commandsData = null;
                try {
                  const commandsController = new AbortController();
                  const commandsTimeoutId = setTimeout(
                    () => commandsController.abort(),
                    30000
                  );

                  const commandsResponse = await fetch(
                    `/api/packages/${pkg.name}/commands`,
                    { signal: commandsController.signal }
                  );
                  clearTimeout(commandsTimeoutId);

                  if (!commandsResponse.ok) {
                    throw new Error(
                      `HTTP error! status: ${commandsResponse.status}`
                    );
                  }

                  commandsData = await commandsResponse.json();
                  cacheStore.setPackageCommands(pkg.name, commandsData);
                } catch (commandsErr) {
                  console.error(
                    `Error prefetching commands for ${pkg.name}:`,
                    commandsErr
                  );
                  // Don't fail the entire prefetch for commands errors
                }

                // Tldr prefetching disabled due to consistent timeouts
                // Will be fetched on-demand when user clicks on commands

                resolve({ packageName: pkg.name, data });
              } catch (fetchErr) {
                clearTimeout(timeoutId);
                if (fetchErr.name === 'AbortError') {
                  reject(new Error(`Timeout: ${pkg.name}`));
                } else {
                  reject(new Error(`${pkg.name}: ${fetchErr.message}`));
                }
              }
            } catch (err) {
              reject(new Error(`${pkg.name}: ${err.message}`));
            }
          }, index * 100);
        })
    );

    // Use Promise.allSettled to handle individual failures gracefully
    Promise.allSettled(prefetchPromises).then(results => {
      const successful = results.filter(
        result => result.status === 'fulfilled'
      ).length;
      const failed = results.filter(
        result => result.status === 'rejected'
      ).length;

      if (failed > 0) {
        console.error(`Prefetch errors: ${successful}/${successful + failed}`);
        // Log the specific errors
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`${packagesList[index].name}:`, result.reason);
          }
        });
      }
    });
  },
};
