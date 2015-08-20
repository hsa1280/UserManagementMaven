package com.shian.usermanamement.maven.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

/**
 * Created by shian_mac on 8/19/15.
 */
@Configuration
@EnableWebMvc
@ComponentScan( "com.shian.usermanamement.maven.controller" )
public class WebApplicationConfig extends WebMvcConfigurerAdapter {

//	@Bean
//	public InternalResourceViewResolver internalViewResourceResolver() {
//
//		InternalResourceViewResolver resolver = new InternalResourceViewResolver();
//
//		resolver.setPrefix( "/WEB-INF/jsp/" );
//		resolver.setSuffix( ".jsp" );
//
//		return resolver;
//
//	}

    @Override
    public void addResourceHandlers(final ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/resources/**").addResourceLocations("/resources/");
    }

    @Bean
    public InternalResourceViewResolver internalViewResourceResolver() {

        InternalResourceViewResolver resolver = new InternalResourceViewResolver();

        resolver.setPrefix( "/html/" );
        resolver.setSuffix( ".html" );

        return resolver;

    }

}

