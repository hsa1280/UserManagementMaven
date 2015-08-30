package com.shian.usermanamement.maven.config;

import com.mysql.jdbc.jdbc2.optional.MysqlDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import javax.sql.DataSource;

/**
 * Created by shian_mac on 8/19/15.
 */
@Configuration
@PropertySource("classpath:application.properties")
public class DatasourceConfig {

//    private String url = "jdbc:mysql://localhost:3306/mysql";
//    private String userName = "root";
//    private String passWord = "root";
    @Value( "${db.url}" )
    private String url;
    @Value("${db.userName}")
    private String userName;
    @Value("${db.passWord}")
    private String passWord;

    @Bean
    public DataSource dataSource() throws Exception {

        MysqlDataSource dataSource = new MysqlDataSource();
        dataSource.setURL(this.url);
        dataSource.setPassword(this.passWord);
        dataSource.setUser(this.userName);

        return dataSource;

    }

}

