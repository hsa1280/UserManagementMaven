package com.shian.usermanamement.maven.config;

import org.hibernate.jpa.HibernatePersistenceProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.nativejdbc.CommonsDbcpNativeJdbcExtractor;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.Database;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Properties;

/**
 * Created by shian_mac on 8/19/15.
 */
@Configuration
@EnableJpaRepositories( "com.shian.usermanamement.maven.repository.jpa" )
@EnableTransactionManagement
@ComponentScan( basePackages = {
        "com.shian.usermanamement.maven.service"
})
@Import( value = {
        DatasourceConfig.class,
})
public class ServiceConfig {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @Bean
    public JdbcTemplate jdbcTemplate() {

        JdbcTemplate jdbcTemplate = new JdbcTemplate();

        jdbcTemplate.setDataSource( this.dataSource );

        return jdbcTemplate;

    }

    @Bean
    public PlatformTransactionManager transactionManager() {

        JpaTransactionManager jpaTransactionManager = new JpaTransactionManager();

        jpaTransactionManager.setEntityManagerFactory( entityManagerFactory().getObject() );

        return jpaTransactionManager;

    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {

//        HibernateJpaVendorAdapter jpaVendorAdapter = new HibernateJpaVendorAdapter();
//
//        jpaVendorAdapter.setDatabase( Database.MYSQL );
//        jpaVendorAdapter.setGenerateDdl( false );

        Properties properties = new Properties();

        for(String property : new String[]{"hibernate.dialect", "hibernate.hbm2ddl.auto", "hibernate.ejb.naming_strategy"}) {
            properties.setProperty(property, this.environment.getProperty(property));
        }
        LocalContainerEntityManagerFactoryBean entityManagerFactoryBean = new LocalContainerEntityManagerFactoryBean();
        entityManagerFactoryBean.setPackagesToScan("com.shian.usermanamement.maven.bean");

        entityManagerFactoryBean.setPersistenceProvider( new HibernatePersistenceProvider() );
        entityManagerFactoryBean.setDataSource( this.dataSource );

//        entityManagerFactoryBean.setJpaVendorAdapter( jpaVendorAdapter );
        entityManagerFactoryBean.setJpaProperties(properties);
        entityManagerFactoryBean.afterPropertiesSet();

        return entityManagerFactoryBean;

    }

}

