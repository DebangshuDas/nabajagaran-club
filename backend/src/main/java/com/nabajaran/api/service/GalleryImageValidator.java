package com.nabajaran.api.service;

import com.nabajaran.api.exception.BadRequestException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class GalleryImageValidator {

    public static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    public static final int MAX_FILES_PER_UPLOAD = 10;
    private static final long MAX_IMAGE_PIXELS = 30_000_000L;

    public ValidatedGalleryImage validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Each uploaded image must contain image data.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Each image must be no larger than 10 MiB.");
        }

        byte[] contents;
        try {
            contents = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("An uploaded image could not be read.");
        }

        String contentType;
        String extension;
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(contents))) {
            if (input == null) {
                throw new BadRequestException("Only JPEG and PNG images are permitted.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new BadRequestException("Only JPEG and PNG images are permitted.");
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName();
                if ("jpeg".equalsIgnoreCase(format) || "jpg".equalsIgnoreCase(format)) {
                    contentType = "image/jpeg";
                    extension = "jpg";
                } else if ("png".equalsIgnoreCase(format)) {
                    contentType = "image/png";
                    extension = "png";
                } else {
                    throw new BadRequestException("Only JPEG and PNG images are permitted.");
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new BadRequestException("Image dimensions are too large.");
                }
                BufferedImage decoded = reader.read(0);
                if (decoded == null) {
                    throw new BadRequestException("The uploaded file is not a valid image.");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException ex) {
            if (ex instanceof BadRequestException badRequestException) {
                throw badRequestException;
            }
            throw new BadRequestException("The uploaded file is not a valid image.");
        }

        return new ValidatedGalleryImage(contents, contentType, extension, titleFromFilename(file.getOriginalFilename()));
    }

    private String titleFromFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return null;
        }
        String filename = originalFilename.replace('\\', '/');
        filename = filename.substring(filename.lastIndexOf('/') + 1);
        int extensionIndex = filename.lastIndexOf('.');
        if (extensionIndex > 0) {
            filename = filename.substring(0, extensionIndex);
        }
        String title = filename.replaceAll("[\\p{Cntrl}]", " ").trim();
        return title.isEmpty() ? null : title.substring(0, Math.min(title.length(), 200));
    }
}
