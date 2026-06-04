package app.villager.service;

import app.villager.config.StorageProperties;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupabaseStorageService {

  private final StorageProperties storageProperties;
  private final RestClient restClient;

  public SupabaseStorageService(StorageProperties storageProperties) {
    this.storageProperties = storageProperties;
    this.restClient = RestClient.create();
  }

  public String uploadListingImage(String objectPath, MultipartFile file) {
    requireConfigured();

    byte[] body;
    try {
      body = file.getBytes();
    } catch (IOException ex) {
      throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "사진을 읽을 수 없습니다.");
    }

    String contentType = file.getContentType();
    if (contentType == null || contentType.isBlank()) {
      contentType = contentTypeForPath(objectPath);
    }

    URI uploadUri = URI.create(
        storageProperties.baseUrl()
            + "/storage/v1/object/"
            + storageProperties.bucket()
            + "/"
            + objectPath);

    try {
      restClient
          .post()
          .uri(uploadUri)
          .header("Authorization", "Bearer " + storageProperties.serviceRoleKey())
          .header("apikey", storageProperties.serviceRoleKey())
          .header("x-upsert", "false")
          .contentType(MediaType.parseMediaType(contentType))
          .body(body)
          .retrieve()
          .toBodilessEntity();
    } catch (RestClientResponseException ex) {
      String detail = ex.getResponseBodyAsString();
      if (detail != null && detail.contains("Bucket not found")) {
        throw new BusinessException(
            HttpStatus.BAD_GATEWAY,
            "Storage 버킷 '"
                + storageProperties.bucket()
                + "' 이 없습니다. supabase/listing-images-storage.sql 을 실행하세요.");
      }
      throw new BusinessException(
          HttpStatus.BAD_GATEWAY,
          "Supabase Storage 업로드 실패: " + ex.getStatusCode().value());
    } catch (Exception ex) {
      throw new BusinessException(HttpStatus.BAD_GATEWAY, "Supabase Storage 업로드에 실패했습니다.");
    }

    return storageProperties.publicObjectUrl(objectPath);
  }

  private void requireConfigured() {
    if (!storageProperties.isConfigured()) {
      throw new BusinessException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Supabase Storage가 설정되지 않았습니다. application-local.yml 에 "
              + "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 넣으세요.");
    }
  }

  private static String contentTypeForPath(String objectPath) {
    String ext = objectPath.contains(".")
        ? objectPath.substring(objectPath.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT)
        : "jpg";
    return switch (ext) {
      case "png" -> "image/png";
      case "webp" -> "image/webp";
      case "gif" -> "image/gif";
      case "heic", "heif" -> "image/heic";
      default -> "image/jpeg";
    };
  }
}
