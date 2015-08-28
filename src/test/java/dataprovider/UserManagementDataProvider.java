package dataprovider;

import java.util.List;

import com.shian.usermanamement.maven.bean.Product;
import com.shian.usermanamement.maven.config.ApplicationConfig;
import com.shian.usermanamement.maven.config.ServiceConfig;
import com.shian.usermanamement.maven.service.IUserManagementService;
import factory.config.ObjectFactoryConfiguration;
import factory.impl.ProductObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.testng.AbstractTestNGSpringContextTests;
import org.testng.annotations.DataProvider;

@ContextConfiguration(
	classes = {
		ObjectFactoryConfiguration.class,
		ApplicationConfig.class,
		ServiceConfig.class
	}
)
public class UserManagementDataProvider extends AbstractTestNGSpringContextTests{

	@Qualifier("userManagementServiceImpl")
	@Autowired
	private IUserManagementService iUserManagementService;

	@Autowired
	private ProductObjectFactory productObjectFactory;

	//******************Product************************************
	@DataProvider(name="getProducts")
	public Object[][] getProducts() throws Exception {

		List<Product> productList = null;
		if (productObjectFactory != null) {
			productList = productObjectFactory.getNonPersisted(10);
		}
		return objectListToObjectArray(productList);
	}

	protected <T> Object[][] objectListToObjectArray( List<T> objectList ) {

		Object[][] objArray = null;

		if( objectList != null ) {

			objArray = new Object[objectList.size()][1];

			int i = 0;

			for( T obj : objectList ) {

				objArray[i][0] = obj;

				i++;

			}

		}

		return objArray;

	}

	public ProductObjectFactory getProductObjectFactory() {
		return productObjectFactory;
	}

	public void setProductObjectFactory(ProductObjectFactory productObjectFactory) {
		this.productObjectFactory = productObjectFactory;
	}

	public IUserManagementService getiUserManagementService() {
		return iUserManagementService;
	}

	public void setiUserManagementService(IUserManagementService iUserManagementService) {
		this.iUserManagementService = iUserManagementService;
	}
}
