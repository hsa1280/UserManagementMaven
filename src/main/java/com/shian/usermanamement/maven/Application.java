package com.shian.usermanamement.maven;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.orm.jpa.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * Created by shian_mac on 8/19/15.
 */
@EnableAutoConfiguration
@ComponentScan("com.shian.usermanamement.maven")
@Configuration
@EntityScan(basePackages="com.shian.usermanamement.maven.bean")
public class Application {

    public static Logger log = LoggerFactory.getLogger(Application.class.getCanonicalName());

    public static void main(String[] args) {
        log.info("Starting application");
        SpringApplication.run(Application.class, args);
    }
}
