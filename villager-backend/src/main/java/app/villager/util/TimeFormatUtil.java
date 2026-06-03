package app.villager.util;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public final class TimeFormatUtil {

  private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");
  private static final DateTimeFormatter DATE =
      DateTimeFormatter.ofPattern("yyyy. M. d.").withZone(KOREA);

  private TimeFormatUtil() {}

  public static String relative(Instant instant) {
    if (instant == null) {
      return "";
    }
    long hours = ChronoUnit.HOURS.between(instant, Instant.now());
    if (hours < 1) {
      return "방금 전";
    }
    if (hours < 24) {
      return hours + "시간 전";
    }
    long days = hours / 24;
    if (days < 7) {
      return days + "일 전";
    }
    return DATE.format(instant);
  }

  public static String iso(Instant instant) {
    return instant == null ? null : instant.toString();
  }
}
