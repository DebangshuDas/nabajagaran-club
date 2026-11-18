package com.nabajaran.api.service;

public record ValidatedGalleryImage(
        byte[] contents,
        String contentType,
        String extension,
        String title
) {
}
