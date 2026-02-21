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
    @Value("${app.upload.location}")
    private String location;

    public String getLocation() {
        return location;
    }

    public void setLocation() {
        this.location = location;
    }
}
