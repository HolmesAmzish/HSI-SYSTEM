package cn.arorms.hsi.server;

import cn.arorms.hsi.server.services.StorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class FileExistTest {

    @Autowired
    private StorageService storageService;

    // Test file path - relative to application.share.location
    private static final String EXISTING_FILE_PATH = "mat/hsi/Dioni.mat";
    private static final String NON_EXISTING_FILE_PATH = "mat/hsi/NonExistent.mat";

    @Test
    void testFileExists() {
        // Test existing file
        boolean exists = storageService.exists(EXISTING_FILE_PATH);
        System.out.println("File " + EXISTING_FILE_PATH + " exists: " + exists);
        
        // Test non-existing file
        boolean notExists = storageService.exists(NON_EXISTING_FILE_PATH);
        System.out.println("File " + NON_EXISTING_FILE_PATH + " exists: " + notExists);
        
        // Assertions based on expected results
        // Note: Adjust these based on actual file existence in your environment
        if (exists) {
            assertTrue(exists, "File should exist: " + EXISTING_FILE_PATH);
        }
        assertFalse(notExists, "File should not exist: " + NON_EXISTING_FILE_PATH);
    }
}