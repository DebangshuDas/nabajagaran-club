package com.nabajaran.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Year;

public record ClubProfileUpdateRequest(
        @NotBlank(message = "Club name is required.")
        @Size(max = 150, message = "Club name must be 150 characters or fewer.")
        String clubName,
        @Size(max = 200, message = "Tagline must be 200 characters or fewer.")
        String tagline,
        @Size(max = 10000, message = "Description must be 10,000 characters or fewer.")
        String description,
        @Size(max = 10000, message = "Mission must be 10,000 characters or fewer.")
        String mission,
        @Min(value = 1800, message = "Founding year must be 1800 or later.")
        @Max(value = 9999, message = "Founding year must be a valid year.")
        Integer foundedYear,
        @Size(max = 255, message = "Address must be 255 characters or fewer.")
        String address,
        @Size(max = 100, message = "City must be 100 characters or fewer.")
        String city,
        @Size(max = 100, message = "State must be 100 characters or fewer.")
        String state,
        @Size(max = 100, message = "Country must be 100 characters or fewer.")
        String country,
        @Size(max = 20, message = "Postal code must be 20 characters or fewer.")
        String postalCode,
        @Email(message = "Email must be a valid email address.")
        @Size(max = 150, message = "Email must be 150 characters or fewer.")
        String email,
        @Size(max = 50, message = "Phone number must be 50 characters or fewer.")
        String phone,
        @Size(max = 255, message = "Website URL must be 255 characters or fewer.")
        String website,
        @Size(max = 255, message = "Facebook URL must be 255 characters or fewer.")
        String facebookUrl,
        @Size(max = 255, message = "Instagram URL must be 255 characters or fewer.")
        String instagramUrl
) {
    @AssertTrue(message = "Founding year cannot be in the future.")
    public boolean isFoundingYearNotInFuture() {
        return foundedYear == null || foundedYear <= Year.now().getValue();
    }

    @AssertTrue(message = "Website must be a valid HTTP or HTTPS URL.")
    public boolean isWebsiteValid() {
        return isHttpUrl(website);
    }

    @AssertTrue(message = "Facebook URL must be a valid HTTP or HTTPS URL.")
    public boolean isFacebookUrlValid() {
        return isHttpUrl(facebookUrl);
    }

    @AssertTrue(message = "Instagram URL must be a valid HTTP or HTTPS URL.")
    public boolean isInstagramUrlValid() {
        return isHttpUrl(instagramUrl);
    }

    private static boolean isHttpUrl(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme();
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (URISyntaxException exception) {
            return false;
        }
    }
}
