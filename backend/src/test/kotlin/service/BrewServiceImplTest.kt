package service

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class BrewServiceTest {

    @Test
    fun `listPackages should return result object`() {
        val brewService = BrewService()
        val result = brewService.listPackages()
        
        assertNotNull(result)
        assertTrue(result.totalCount >= 0)
        
        if (result.isSuccess) {
            assertEquals(result.packages.size, result.totalCount)
            // If successful, packages should be sorted by name
            val packageNames = result.packages.map { it.name }
            assertEquals(packageNames.sorted(), packageNames)
        } else {
            assertNotNull(result.errorMessage)
            assertTrue(result.packages.isEmpty())
            assertEquals(0, result.totalCount)
        }
    }
}
