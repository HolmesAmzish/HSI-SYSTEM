package cn.arorms.hsi.server.services;


import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.exceptions.StorageException;
import cn.arorms.hsi.server.exceptions.StorageFileNotFoundException;
import cn.arorms.hsi.server.properties.StorageProperties;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.Objects;
import java.util.stream.Stream;

@Service
public class StorageService {

    private final Path rootLocation;

    public StorageService(StorageProperties properties) {
        if (properties.getRootLocation().trim().isEmpty()) {
            throw new StorageException("File upload location can not be Empty.");
        }
        this.rootLocation = Paths.get(properties.getRootLocation());
    }

    /**
     * Default method to store file in root location of config
     * Reserved interface
     * @param file multipart file
     */
    public String store(MultipartFile file) {
        return store(file, rootLocation);
    }

    /**
     * Primary file store method, the path determined by file type
     * @param file multipart file
     * @param fileType mat or bin file of hsi and gt
     * @return relative path to the file
     */
    public String store(MultipartFile file, FileType fileType) {

        Path targetDir = rootLocation.resolve(fileType.getPath());
        return store(file, targetDir);
    }

    /**
     * Basic method
     * @param file multipart file
     * @param targetDirectory absolute directory
     * @return the absolute path of file
     */
    public String store(MultipartFile file, Path targetDirectory) {
        if (file.isEmpty()) {
            throw new StorageException("Failed to store empty file.");
        }

//        try {
//            Files.createDirectories(targetDirectory);
//        } catch (IOException e) {
//            throw new StorageException("Could not create directory: " + targetDirectory, e);
//        }

        Path destinationFile = targetDirectory
                .resolve(Paths.get(Objects.requireNonNull(file.getOriginalFilename())))
                .normalize()
                .toAbsolutePath();

        if (!destinationFile.getParent().equals(targetDirectory.toAbsolutePath())) {
            throw new StorageException("Cannot store file outside target directory: " + targetDirectory);
        }

        if (!destinationFile.startsWith(rootLocation.toAbsolutePath())) {
            throw new StorageException("Cannot store file outside root directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return rootLocation.toAbsolutePath().relativize(destinationFile)
//            return destinationFile
                    .toString().replace('\\', '/');
        } catch (IOException e) {
            throw new StorageException("Failed to store file.", e);
        }
    }

//    public Stream<Path> loadAll() {
//        try {
//            return Files.walk(this.rootLocation, 1)
//                    .filter(path -> !path.equals(this.rootLocation))
//                    .map(this.rootLocation::relativize);
//        }
//        catch (IOException e) {
//            throw new StorageException("Failed to read stored files", e);
//        }
//
//    }

    public Path load(String filename) {
        return rootLocation.resolve(filename);
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = load(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            }
            else {
                throw new StorageFileNotFoundException(
                        "Could not read file: " + filename);

            }
        }
        catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + filename, e);
        }
    }

    /**
     * Load a file as Resource by relative path and file type.
     * @param relativePath relative path to the file (e.g., "bin/hsi/Dioni.bin")
     * @param fileType file type enum (HSI_BIN, HSI_MAT, etc.)
     * @return Resource for streaming
     */
    public Resource loadAsResource(String relativePath, FileType fileType) {
        try {
            // Resolve the full path: rootLocation/fileType.getPath()/filename
            Path filePath = rootLocation.resolve(fileType.getPath())
                    .resolve(Paths.get(relativePath).getFileName())
                    .normalize()
                    .toAbsolutePath();
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new StorageFileNotFoundException(
                        "Could not read file: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + relativePath, e);
        }
    }



    public void deleteAll() {
        FileSystemUtils.deleteRecursively(rootLocation.toFile());
    }

    public void init() {
        try {
            Files.createDirectories(rootLocation);
        }
        catch (IOException e) {
            throw new StorageException("Could not initialize storage", e);
        }
    }

    // TODO: Check file duplication before storage
    public String calculateHeaderHash(MultipartFile file) throws Exception {
        long fileSize = file.getSize();
        // Get header content of file for 1MB
        int bufferSize = (int) Math.min(fileSize, 1048576);
        byte[] buffer = new byte[bufferSize];

        try (InputStream is = file.getInputStream()) {
            is.read(buffer, 0, bufferSize);
        }

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(buffer);
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * Check whether the file exists
     * @param relativePath relative path to the file
     * @return if the file exists
     */
    public Boolean exists(String relativePath) {
        if (relativePath == null) {
            return false;
        }
        try {
            Path filepath = this.rootLocation.resolve(relativePath);
            return Files.exists(filepath);
        } catch (Exception e) {
            return false;
        }
    }
}
