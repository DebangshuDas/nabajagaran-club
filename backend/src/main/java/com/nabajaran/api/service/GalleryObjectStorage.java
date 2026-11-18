package com.nabajaran.api.service;

public interface GalleryObjectStorage {

    void upload(String key, byte[] contents, String contentType);

    void delete(String key);

    String publicUrl(String key);
}
