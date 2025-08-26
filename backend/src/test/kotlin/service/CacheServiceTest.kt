package service

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CacheServiceTest {
    @Test
    fun `test basic cache operations`() {
        val cacheService = CacheService()

        // Test set and get
        cacheService.set("test-key", "test-value")
        val result = cacheService.get<String>("test-key")
        assertEquals("test-value", result)

        // Test cache miss
        val missingResult = cacheService.get<String>("missing-key")
        assertNull(missingResult)

        // Test remove
        cacheService.remove("test-key")
        val removedResult = cacheService.get<String>("test-key")
        assertNull(removedResult)

        // Test clear
        cacheService.set("key1", "value1")
        cacheService.set("key2", "value2")
        cacheService.clear()
        assertNull(cacheService.get<String>("key1"))
        assertNull(cacheService.get<String>("key2"))
    }

    @Test
    fun `test cache statistics`() {
        val cacheService = CacheService()

        // Add some entries
        cacheService.set("key1", "value1")
        cacheService.set("key2", "value2")
        cacheService.set("key3", "value3")

        // Get some entries to generate hits
        cacheService.get<String>("key1")
        cacheService.get<String>("key2")
        cacheService.get<String>("missing-key") // This should be a miss

        val stats = cacheService.getStats()
        assertTrue(stats.totalEntries >= 3)
        assertTrue(stats.hitCount >= 2)
        assertTrue(stats.missCount >= 1)
        assertTrue(stats.hitRate > 0.0)
    }

    @Test
    fun `test cache with TTL`() {
        val cacheService = CacheService()

        // Test set with TTL
        cacheService.set("ttl-key", "ttl-value", 1) // 1 second TTL
        val result = cacheService.get<String>("ttl-key")
        assertEquals("ttl-value", result)

        // Note: We can't easily test expiration in a unit test without waiting
        // The TTL functionality is handled by Caffeine internally
    }

    @Test
    fun `test cache cleanup`() {
        val cacheService = CacheService()

        // Add some entries
        cacheService.set("key1", "value1")
        cacheService.set("key2", "value2")

        // Cleanup should not affect valid entries
        cacheService.cleanup()
        assertEquals("value1", cacheService.get<String>("key1"))
        assertEquals("value2", cacheService.get<String>("key2"))
    }
}
