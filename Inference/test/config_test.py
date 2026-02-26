#!/usr/bin/env python3
"""
Test script to verify the pydantic configuration system.
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_config_system():
    """Test the configuration system."""
    print("Testing Pydantic Configuration System...")
    print("=" * 50)
    
    try:
        # Import settings
        from config.settings import settings
        
        # Test basic settings
        # print(f"Application: {settings.APP_NAME} v{settings.APP_VERSION}")
        # print(f"Environment: {settings.ENVIRONMENT} (Debug: {settings.DEBUG})")
        print(f"Upload Directory: {settings.UPLOAD_DIR}")
        print(f"Output Directory: {settings.OUTPUT_DIR}")
        # print(f"5. Data Type Output: {settings.DTYPE_OUT}")
        
        # Test Redis configuration
        print(f"Redis Host: {settings.redis.REDIS_HOST}")
        print(f"Redis Port: {settings.redis.REDIS_PORT}")
        print(f"Redis DB: {settings.redis.REDIS_DB}")
        print(f"Redis Timeout: {settings.redis.REDIS_TIMEOUT}s")
        
        # Test Redis connection URL
        print(f"Redis Connection URL: {settings.redis.connection_url}")
        
        # Test Redis message queue configuration
        print(f"Redis Queue (HSI Load): {settings.REDIS_QUEUE_HSI_LOAD}")
        print(f"Redis Queue (HSI Inference): {settings.REDIS_QUEUE_HSI_INFERENCE}")
        print(f"Redis Queue (GT Load): {settings.REDIS_QUEUE_GT_LOAD}")
        
        # Test environment detection
        # print(f"Is Production: {settings.is_production()}")
        # print(f"Is Development: {settings.is_development()}")
        
        # Test dependency container
        from core.dependencies import container
        print(f"Settings in Container: {'settings' in container}")
        print(f"Redis Client in Container: {'redis_client' in container}")
        
        print("\nAll configuration tests passed!")
        return True
        
    except Exception as e:
        print(f"\nConfiguration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_redis_connection():
    """Test Redis connection."""
    print("\nTesting Redis Connection...")
    print("=" * 50)
    
    try:
        from core.dependencies import container
        redis_client = container["redis_client"]
        
        # Test connection
        result = redis_client.ping()
        print(f"Redis Ping: {result}")
        
        if result:
            print("Redis connection successful!")
        else:
            print("Redis connection failed!")
            
        return result
        
    except Exception as e:
        print(f"Redis connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("HSI Inference System - Configuration Test")
    print("=" * 50)
    
    config_ok = test_config_system()
    
    if config_ok:
        # Only test Redis connection if config is OK
        test_redis_connection()
    
    print("\n" + "=" * 50)
    print("Configuration test completed.")
