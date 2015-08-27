package factory.config;

import factory.impl.FacilityObjectFactory;
import factory.impl.UserObjectFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObjectFactoryConfiguration {

	@Bean
	public UserObjectFactory userManagementObjectFactory() throws Exception {
		return new UserObjectFactory();
	}
	
	@Bean
	public FacilityObjectFactory facilityObjectFactory() throws Exception {
		return new FacilityObjectFactory();
	}

}
