package cn.arorms.hsi.server.properties;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * StorageProperties.java
 * @author Cacciatore
 * @version 1.0 2026-02-21
 */
@Component
@ConfigurationProperties("storage")
public class StorageProperties {
    // Folder location for storing files
    @Value("${application.share.location}")
    private String rootLocation;

    public String getRootLocation() {
        return rootLocation;
    }

//    public String getHsiMatDirectory() {
//        return rootLocation + "/mat/hsi";
//    }
//
//    public String getHsiBinDirectory() {
//        return rootLocation + "/bin/hsi";
//    }
//
//    public String getGtMatDirectory() {
//        return rootLocation + "/mat/gt";
//    }
//
//    public String getGtBinDirectory() {
//        return rootLocation + "/bin/gt";
//    }
}
