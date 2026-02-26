"""
Dependency injection container for HSI Inference System.
Manages singleton components and provides dependency resolution.
Similar to Spring's ApplicationContext.
"""

import os
from typing import Dict, Any
from functools import lru_cache
import redis
from redis import Redis
from config.settings import settings


class DependencyContainer:
    """
    Dependency injection container that manages all singleton components.
    Provides centralized component management and dependency resolution.
    """
    
    def __init__(self):
        self._components: Dict[str, Any] = {}
    
    def register(self, name: str, component: Any) -> None:
        """
        Register a component in the container.
        
        Args:
            name: Component identifier
            component: Component instance
        """
        self._components[name] = component
    
    def get(self, name: str) -> Any:
        """
        Get a component from the container.
        
        Args:
            name: Component identifier
            
        Returns:
            Component instance or None if not found
        """
        return self._components.get(name)
    
    def __getitem__(self, name: str) -> Any:
        """Support dictionary-like access."""
        component = self.get(name)
        if component is None:
            raise KeyError(f"Component '{name}' not found in container")
        return component
    
    def __contains__(self, name: str) -> bool:
        """Check if component exists in container."""
        return name in self._components


# Global container instance
container = DependencyContainer()


@lru_cache()
def get_redis_client() -> Redis:
    """
    Get Redis client (singleton) based on Server project configuration.
    
    Returns:
        Redis client instance
    """
    redis_config = settings.redis
    
    # Use connection kwargs from RedisConfig
    return redis.Redis(**redis_config.connection_kwargs)


def initialize_container() -> None:
    """
    Initialize the dependency container with all required components.
    This should be called once at application startup.
    """
    # Register configuration
    container.register("settings", settings)
    
    # Register Redis client
    container.register("redis_client", get_redis_client())
    
    # Register services (will be added later)
    # container.register("mat_service", MatService())
    # container.register("inference_service", InferenceService())


# Initialize container on module import
initialize_container()
