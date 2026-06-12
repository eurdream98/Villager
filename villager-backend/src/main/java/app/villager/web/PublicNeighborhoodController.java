package app.villager.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.villager.dto.NeighborhoodDto;
import app.villager.dto.ResolveNeighborhoodRequest;
import app.villager.service.NeighborhoodService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/neighborhoods")
public class PublicNeighborhoodController {
    private final NeighborhoodService neighborhoodService;

    public PublicNeighborhoodController(NeighborhoodService neighborhoodService){
        this.neighborhoodService = neighborhoodService;
    }

    @PostMapping("/resolve")
    NeighborhoodDto   resolve(@Valid @RequestBody ResolveNeighborhoodRequest request){
        return neighborhoodService.resolve(request.name(),request.latitude(),request.longitude());
    }
}
