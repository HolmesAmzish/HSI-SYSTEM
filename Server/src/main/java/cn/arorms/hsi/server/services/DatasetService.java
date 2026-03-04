package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.repositories.DatasetRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DatasetService {

    private final DatasetRepository datasetRepository;

    public DatasetService(DatasetRepository datasetRepository) {
        this.datasetRepository = datasetRepository;
    }

    public List<Dataset> getAllDatasets(Sort sort) {
        return datasetRepository.findAll(sort);
    }

    public Dataset getDatasetById(Long id) {
        return datasetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dataset not found with ID: " + id));
    }

    public Dataset createDataset(Dataset dataset) {
        return datasetRepository.save(dataset);
    }

    public Dataset updateDataset(Long id, Dataset dataset) {
        Dataset existing = getDatasetById(id);
        existing.setName(dataset.getName());
        existing.setDescription(dataset.getDescription());
        return datasetRepository.save(dataset);
    }

    public void processMqLoadResult(Long id, int height, int width, int bands) {
        Dataset existing = getDatasetById(id);
        existing.setHeight(height);
        existing.setWidth(width);
        existing.setBands(bands);
        datasetRepository.save(existing);
    }

    public void deleteDataset(Long id) {
        if (!datasetRepository.existsById(id)) {
            throw new NoSuchElementException("Dataset not found with ID: " + id);
        }
        datasetRepository.deleteById(id);
    }
}