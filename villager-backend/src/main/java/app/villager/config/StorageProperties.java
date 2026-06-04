package app.villager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "villager.storage")
public record StorageProperties(
    String supabaseUrl,
    String serviceRoleKey,
    String bucket,
    long maxFileBytes) {

  public String baseUrl() {
    if (supabaseUrl == null || supabaseUrl.isBlank()) {
      return "";
    }
    return supabaseUrl.endsWith("/")
        ? supabaseUrl.substring(0, supabaseUrl.length() - 1)
        : supabaseUrl;
  }

  public boolean isConfigured() {
    return !baseUrl().isBlank() && serviceRoleKey != null && !serviceRoleKey.isBlank();
  }

  public String publicObjectUrl(String objectPath) {
    return baseUrl()
        + "/storage/v1/object/public/"
        + bucket
        + "/"
        + objectPath;
  }
}
