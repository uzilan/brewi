package service

import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import com.github.benmanes.caffeine.cache.stats.CacheStats
import org.slf4j.LoggerFactory
import java.time.Duration
import java.util.concurrent.TimeUnit

/**
 * Caffeine-based cache service with TTL support
 */
class CacheService {
    private val logger = LoggerFactory.getLogger(CacheService::class.java)
    private val cache: Cache<String, Any>

    init {
        // Initialize Caffeine cache with configuration
        cache =
            Caffeine.newBuilder()
                .maximumSize(1000) // Maximum 1000 entries
                .expireAfterWrite(Duration.ofHours(1)) // Default TTL of 1 hour
                .recordStats() // Enable statistics
                .build()

        logger.info("Caffeine cache initialized with max size 1000 and default TTL 1 hour")
    }

    /**
     * Get a value from cache
     */
    @Suppress("UNCHECKED_CAST")
    fun <T> get(key: String): T? {
        val value = cache.getIfPresent(key)
        if (value != null) {
            logger.debug("Cache hit for key: $key")
        } else {
            logger.debug("Cache miss for key: $key")
        }
        return value as T?
    }

    /**
     * Store a value in cache with TTL in seconds
     */
    fun <T> set(
        key: String,
        value: T,
        ttlSeconds: Long,
    ) {
        cache.put(key, value as Any)
        logger.debug("Cached value for key: $key with TTL: ${ttlSeconds}s")
    }

    /**
     * Store a value in cache using default TTL
     */
    fun <T> set(
        key: String,
        value: T,
    ) {
        cache.put(key, value as Any)
        logger.debug("Cached value for key: $key with default TTL")
    }

    /**
     * Remove a value from cache
     */
    fun remove(key: String) {
        cache.invalidate(key)
        logger.debug("Removed cache entry for key: $key")
    }

    /**
     * Clear all cache entries
     */
    fun clear() {
        val size = cache.estimatedSize()
        cache.invalidateAll()
        logger.info("Cleared cache with approximately $size entries")
    }

    /**
     * Get cache statistics
     */
    fun getStats(): service.CacheStats {
        val stats = cache.stats()
        val estimatedSize = cache.estimatedSize()

        return service.CacheStats(
            totalEntries = estimatedSize.toInt(),
            validEntries = estimatedSize.toInt(),
            expiredEntries = 0, // Caffeine automatically removes expired entries
            hitCount = stats.hitCount(),
            missCount = stats.missCount(),
            hitRate = stats.hitRate(),
        )
    }

    /**
     * Clean up expired entries (Caffeine does this automatically)
     */
    fun cleanup() {
        cache.cleanUp()
        logger.debug("Cache cleanup completed")
    }

    /**
     * Get cache with custom configuration
     */
    fun getCacheWithConfig(
        maxSize: Long = 1000,
        ttlSeconds: Long = 3600,
    ): Cache<String, Any> {
        return Caffeine.newBuilder()
            .maximumSize(maxSize)
            .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
            .recordStats()
            .build()
    }
}

/**
 * Cache statistics
 */
data class CacheStats(
    val totalEntries: Int,
    val validEntries: Int,
    val expiredEntries: Int,
    val hitCount: Long = 0,
    val missCount: Long = 0,
    val hitRate: Double = 0.0,
)
