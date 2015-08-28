package com.shian.usermanamement.maven.config;

import org.hibernate.jpa.HibernatePersistenceProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
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

    @Bean
    public JdbcTemplate jdbcTemplate() {

        JdbcTemplate jdbcTemplate = new JdbcTemplate();

        jdbcTemplate.setDataSource( this.dataSource );
        jdbcTemplate.setNativeJdbcExtractor( nativeJdbcExtractor() );

        return jdbcTemplate;

    }

    @Bean
    @Lazy
    public CommonsDbcpNativeJdbcExtractor nativeJdbcExtractor() {
        return new CommonsDbcpNativeJdbcExtractor();
    }

    @Bean
    public PlatformTransactionManager transactionManager() {

        JpaTransactionManager jpaTransactionManager = new JpaTransactionManager();

        jpaTransactionManager.setEntityManagerFactory( entityManagerFactory().getObject() );

        return jpaTransactionManager;

    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {

        LocalContainerEntityManagerFactoryBean entityManagerFactoryBean = new LocalContainerEntityManagerFactoryBean();

        entityManagerFactoryBean.setPersistenceProvider( new HibernatePersistenceProvider() );
        entityManagerFactoryBean.setDataSource( this.dataSource );

        HibernateJpaVendorAdapter jpaVendorAdapter = new HibernateJpaVendorAdapter();

        jpaVendorAdapter.setDatabase( Database.MYSQL );
        jpaVendorAdapter.setGenerateDdl( false );

        entityManagerFactoryBean.setJpaVendorAdapter( jpaVendorAdapter );

        return entityManagerFactoryBean;

    }

}

