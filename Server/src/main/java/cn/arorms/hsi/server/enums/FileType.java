package cn.arorms.hsi.server.enums;

/**
 * Enumeration of file types with their associated storage paths.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
public enum FileType {
    HSI_MAT("mat/hsi"),
    HSI_BIN("bin/hsi"),
    GT_MAT("mat/gt"),
    GT_BIN("bin/gt");

    private final String path;

    FileType(String path) {
        this.path = path;
    }

    public String getPath() {
        return path;
    }
}