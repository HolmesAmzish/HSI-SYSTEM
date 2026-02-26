from core.dependencies import container
from handlers.hsi_load_handler import HsiLoadHandler

settings = container["settings"]
OUTPUT_DIR: str = settings.OUTPUT_DIR
HSI_MAT_PATH: str = "C:\\Development\\repositories\\HSI-SYSTEM\\SharedData\\uploads\\WHU_Hi_HongHu.mat"

if __name__ == "__main__":
    print(HsiLoadHandler.load_mat_to_bin(HSI_MAT_PATH, OUTPUT_DIR))