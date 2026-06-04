package app.villager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import app.villager.config.StorageProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(StorageProperties.class)
public class VillagerBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(VillagerBackendApplication.class, args);
  }
}
