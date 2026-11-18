package com.nabajaran.api.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class GalleryStorageConfiguration {

    @Bean
    @ConditionalOnProperty(name = "app.gallery.storage.enabled", havingValue = "true")
    S3Client galleryS3Client(
            @Value("${app.gallery.storage.endpoint:}") String endpoint,
            @Value("${app.gallery.storage.region:auto}") String region,
            @Value("${app.gallery.storage.access-key-id:}") String accessKeyId,
            @Value("${app.gallery.storage.secret-access-key:}") String secretAccessKey) {
        if (endpoint.isBlank() || region.isBlank() || accessKeyId.isBlank() || secretAccessKey.isBlank()) {
            throw new IllegalStateException(
                    "Gallery storage is enabled but its R2 endpoint, region, or credentials are missing.");
        }
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }
}
