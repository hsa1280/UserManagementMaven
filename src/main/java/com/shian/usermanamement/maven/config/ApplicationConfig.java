package com.shian.usermanamement.maven.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;

/**
 * Created by shian_mac on 8/19/15.
 */
@Configuration
public class ApplicationConfig {

    /**
     * http://www.javacodegeeks.com/2013/07/spring-bean-and-propertyplaceholderconfigurer.html
     *
     * @return
     */
    @Bean
    public static PropertySourcesPlaceholderConfigurer placeholderConfigurer() {
        return new PropertySourcesPlaceholderConfigurer();
    }

}
