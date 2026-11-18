package com.nabajaran.api.service;

import com.nabajaran.api.exception.StorageUnavailableException;
import java.net.URI;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class R2GalleryObjectStorage implements GalleryObjectStorage {

    private final ObjectProvider<S3Client> s3ClientProvider;
    private final String bucket;
    private final String publicBaseUrl;

    public R2GalleryObjectStorage(
            ObjectProvider<S3Client> s3ClientProvider,
            @Value("${app.gallery.storage.bucket:}") String bucket,
            @Value("${app.gallery.storage.public-base-url:}") String publicBaseUrl) {
        this.s3ClientProvider = s3ClientProvider;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Override
    public void upload(String key, byte[] contents, String contentType) {
        S3Client s3Client = requireConfiguredClient();
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromBytes(contents));
        } catch (S3Exception | SdkClientException ex) {
            throw new StorageUnavailableException("The image could not be uploaded to object storage.", ex);
        }
    }

    @Override
    public void delete(String key) {
        S3Client s3Client = requireConfiguredClient();
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (S3Exception | SdkClientException ex) {
            throw new StorageUnavailableException("An incomplete image upload could not be cleaned up.", ex);
        }
    }

    @Override
    public String publicUrl(String key) {
        if (publicBaseUrl.isBlank()) {
            throw new StorageUnavailableException("The public image URL base is not configured.");
        }
        try {
            URI base = URI.create(publicBaseUrl);
            if (!"https".equalsIgnoreCase(base.getScheme()) || base.getHost() == null) {
                throw new StorageUnavailableException("The public image URL base must be an HTTPS URL.");
            }
        } catch (IllegalArgumentException ex) {
            throw new StorageUnavailableException("The public image URL base is invalid.", ex);
        }
        return publicBaseUrl.replaceAll("/+$", "") + "/" + key;
    }

    private S3Client requireConfiguredClient() {
        S3Client s3Client = s3ClientProvider.getIfAvailable();
        if (s3Client == null || bucket.isBlank()) {
            throw new StorageUnavailableException("Gallery object storage is not configured.");
        }
        return s3Client;
    }
}
