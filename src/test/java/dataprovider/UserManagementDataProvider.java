package dataprovider;

import java.util.List;

import com.shian.usermanamement.maven.bean.Facility;
import com.shian.usermanamement.maven.bean.Product;
import com.shian.usermanamement.maven.bean.User;
import com.shian.usermanamement.maven.config.ApplicationConfig;
import com.shian.usermanamement.maven.config.ServiceConfig;
import com.shian.usermanamement.maven.service.IUserManagementService;
import factory.config.ObjectFactoryConfiguration;
import factory.impl.FacilityObjectFactory;
import factory.impl.ProductObjectFactory;
import factory.impl.UserObjectFactory;
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
	protected IUserManagementService iUserManagementService;

	@Autowired
	protected ProductObjectFactory productObjectFactory;

	@Autowired
	protected UserObjectFactory userObjectFactory;

	@Autowired
	protected FacilityObjectFactory facilityObjectFactory;

	//******************Facility************************************

	@DataProvider(name = "saveAndGetFacility")
	public Object[][] saveFacility() throws Exception{
		return objectListToObjectArray(facilityObjectFactory.getAllNonPersisted());
	}

	@DataProvider( name = "getFacilityById")
	public Object[][] getFacilityById() throws Exception{

		List<Facility> facility = facilityObjectFactory.getPersisted( 1 );

		return new Object[][] {
				new Object[] { facility.get( 0 ).getId() }
		};
	}

	@DataProvider( name = "getFacilityByName")
	public Object[][] getFacilityByName() throws Exception{

		List<Facility> facility = facilityObjectFactory.getPersisted( 1 );

		return new Object[][] {
				new Object[] { facility.get( 0 ).getName() }
		};
	}

	@DataProvider( name = "getFacilityByAddress")
	public Object[][] getFacilityByAddress() throws Exception{

		List<Facility> facility = facilityObjectFactory.getPersisted( 1 );

		return new Object[][] {
				new Object[] { facility.get( 0 ).getAddress() }
		};
	}

	@DataProvider( name = "deleteFacilityById")
	public Object[][] deleteFacilityById() throws Exception{

		List<Facility> facility = facilityObjectFactory.getPersisted( 1 );

		return new Object[][] {
				new Object[] { facility.get( 0 ).getId() }
		};
	}

	//******************User************************************

	@DataProvider( name = "saveAndGetUser")
	public Object[][] saveUser() throws Exception{
		return objectListToObjectArray(userObjectFactory.getAllNonPersisted());
	}

	@DataProvider( name = "getUsersByFirstName")
	public Object[][] getByFirstName() throws Exception{

		List<User> users =  userObjectFactory.getPersisted(1);

		return new Object[][] {
				new Object[] { users.get( 0 ).getFirstName() }
		};
	}

	@DataProvider( name = "getUsersByFacility")
	public Object[][] getUsersByFacility() throws Exception{

		User user =  userObjectFactory.getPersisted();

		return new Object[][] {
				new Object[] { user.getFacility().getId() }
		};
	}

	@DataProvider(name = "getUsersByLastName")
	public Object[][] getByLasttName() throws Exception{

		List<User> users = userObjectFactory.getPersisted(1);

		return new Object[][] {
				new Object[] { users.get( 0 ).getLastName() }
		};
	}

	@DataProvider(name = "getUserById")
	public Object[][] getUserById() throws Exception {

		List<User> users = userObjectFactory.getPersisted(1);

		return new Object[][] {
				new Object[] { users.get( 0 ).getId() }
		};
	}

	@DataProvider(name = "deleteUserById")
	public Object[][] deleteUser() throws Exception {

		List<User> users = userObjectFactory.getPersisted(1);

		return new Object[][] {
				new Object[] { users.get( 0 ).getId() }
		};
	}

	@DataProvider(name = "userEmailAddress")
	public Object[][] getByEmailAddress() throws Exception{

		return objectListToObjectArray(userObjectFactory.getNonPersisted(1));
	}

	@DataProvider(name = "userIsAdmin")
	public Object[][] getByIsAdmin() throws Exception{

		return objectListToObjectArray( userObjectFactory.getNonPersisted(1) );
	}


	//******************Product************************************
	@DataProvider(name="getProducts")
	public Object[][] getProducts() throws Exception {

		List<Product> productList = null;
		if (productObjectFactory != null) {
			productList = productObjectFactory.getNonPersisted(9);
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
