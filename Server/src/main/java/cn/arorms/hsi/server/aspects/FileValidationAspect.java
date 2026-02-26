package cn.arorms.hsi.server.aspects;

import cn.arorms.hsi.server.annotations.ValidFile;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Aspect
@Component
public class FileValidationAspect {

    @Before("@annotation(validFile)")
    public void validateFile(JoinPoint joinPoint, ValidFile validFile) {
        Object[] args = joinPoint.getArgs();

        for (Object arg : args) {
            if (arg instanceof MultipartFile file) {

                if (file.isEmpty()) {
                    throw new IllegalArgumentException("Uploading file should not be empty");
                }

                if (file.getOriginalFilename() == null) {
                    throw new IllegalArgumentException("Filename shouldn't be empty");
                }

                if (validFile.maxSize() != -1 && file.getSize() > validFile.maxSize()) {
                    throw new IllegalArgumentException("Reached max file size");
                }
            }
        }
    }
}