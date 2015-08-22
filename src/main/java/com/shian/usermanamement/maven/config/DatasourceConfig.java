package com.shian.usermanamement.maven.config;

import com.mysql.jdbc.jdbc2.optional.MysqlDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Created by shian_mac on 8/19/15.
 */
@Configuration
public class DatasourceConfig {

    @Value( "${db.url}" )
    private String url;
    @Value("${db.userName}")
    private String userName;
    @Value("${db.passWord}")
    private String passWord;

//	@Bean
//	public PoolDataSourceBeanPostProcessor poolDataSourceBeanPostProcessor() {
//		return new PoolDataSourceBeanPostProcessor();
//	}

    @Bean
    public DataSource dataSource() throws Exception {

        MysqlDataSource dataSource = new MysqlDataSource();
        dataSource.setURL(this.url);
        dataSource.setPassword(this.passWord);
        dataSource.setUser(this.userName);

        return dataSource;

    }

}

