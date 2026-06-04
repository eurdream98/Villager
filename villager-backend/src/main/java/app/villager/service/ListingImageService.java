package app.villager.service;

import app.villager.config.StorageProperties;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ListingImageService {

  private static final int MAX_FILES = 10;
  private static final Set<String> ALLOWED_EXT =
      Set.of("jpg", "jpeg", "png", "webp", "gif", "heic", "heif");

  private final StorageProperties storageProperties;
  private final SupabaseStorageService supabaseStorageService;

  public ListingImageService(
      StorageProperties storageProperties, SupabaseStorageService supabaseStorageService) {
    this.storageProperties = storageProperties;
    this.supabaseStorageService = supabaseStorageService;
  }

  public List<String> upload(UUID userId, MultipartFile[] files) {
    if (files == null || files.length == 0) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "업로드할 사진이 없습니다.");
    }
    if (files.length > MAX_FILES) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "사진은 최대 " + MAX_FILES + "장까지 등록할 수 있습니다.");
    }

    List<String> urls = new ArrayList<>();
    for (MultipartFile file : files) {
      if (file == null || file.isEmpty()) {
        continue;
      }
      if (file.getSize() > storageProperties.maxFileBytes()) {
        throw new BusinessException(
            HttpStatus.BAD_REQUEST,
            "사진 크기는 " + (storageProperties.maxFileBytes() / 1024 / 1024) + "MB 이하여야 합니다.");
      }

      String ext = extension(file);
      String objectPath = userId + "/" + UUID.randomUUID() + "." + ext;
      urls.add(supabaseStorageService.uploadListingImage(objectPath, file));
    }

    if (urls.isEmpty()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "업로드할 사진이 없습니다.");
    }
    return urls;
  }

  private static String extension(MultipartFile file) {
    String original = file.getOriginalFilename();
    if (original != null && original.contains(".")) {
      String ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
      if (ALLOWED_EXT.contains(ext)) {
        return "jpeg".equals(ext) ? "jpg" : ext;
      }
    }
    String contentType = file.getContentType();
    if (contentType != null) {
      return switch (contentType.toLowerCase(Locale.ROOT)) {
        case "image/jpeg" -> "jpg";
        case "image/png" -> "png";
        case "image/webp" -> "webp";
        case "image/gif" -> "gif";
        case "image/heic", "image/heif" -> "heic";
        default -> throw new BusinessException(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 형식입니다.");
      };
    }
    throw new BusinessException(HttpStatus.BAD_REQUEST, "지원하지 않는 이미지 형식입니다.");
  }
}
