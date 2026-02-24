package cn.arorms.hsi.server.configs

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer
import org.springframework.data.redis.serializer.StringRedisSerializer
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

@Configuration
class RedisConfig {

    @Bean
    fun redisTemplate(factory: RedisConnectionFactory): RedisTemplate<String, Any> {
        val template = RedisTemplate<String, Any>()
        template.connectionFactory = factory

        // Key String
        val stringSerializer = StringRedisSerializer()
        template.keySerializer = stringSerializer
        template.hashKeySerializer = stringSerializer

        // Jackson 3 (tools.jackson)
        val mapper = JsonMapper.builder()
            .addModule(KotlinModule.Builder().build())
            .build()

        val serializer = JacksonJsonRedisSerializer(mapper, Any::class.java)

        template.valueSerializer = serializer
        template.hashValueSerializer = serializer

        template.afterPropertiesSet()
        return template
    }
}