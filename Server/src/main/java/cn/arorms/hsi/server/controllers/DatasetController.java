package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.services.DatasetService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @GetMapping
    public List<Dataset> getAllDatasets(
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder) {
        Sort.Direction direction = Sort.Direction.fromString(sortOrder);
        return datasetService.getAllDatasets(Sort.by(direction, sortBy));
    }

    @GetMapping("/{id}")
    public Dataset getDatasetById(@PathVariable Long id) {
        return datasetService.getDatasetById(id);
    }

    @PostMapping
    public Dataset createDataset(@RequestBody Dataset dataset) {
        return datasetService.createDataset(dataset);
    }

    @PutMapping("/{id}")
    public Dataset updateDataset(@PathVariable Long id, @RequestBody Dataset dataset) {
        return datasetService.updateDataset(id, dataset);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDataset(@PathVariable Long id) {
        datasetService.deleteDataset(id);
        return ResponseEntity.noContent().build();
    }
}