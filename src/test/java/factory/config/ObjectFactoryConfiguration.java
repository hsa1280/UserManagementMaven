package factory.config;

import factory.impl.ProductObjectFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObjectFactoryConfiguration {

	@Bean
	public ProductObjectFactory productObjectFactory() throws  Exception {
		return new ProductObjectFactory();
	}

}
