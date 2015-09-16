package service;

import java.lang.reflect.Method;
import com.shian.usermanamement.maven.bean.Product;
import dataprovider.UserManagementDataProvider;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;


public class UserManagementTest extends UserManagementDataProvider {
	
	@BeforeMethod( alwaysRun = true )
	public void beforeMethod( Method m )
	{
		System.out.println( "****************** Starting test: " + m.getName() + "*************************" );
	}
	
	@AfterMethod( alwaysRun = true )
	public void afterMethod( Method m )
	{
		System.out.println( "****************** Finished test: " + m.getName() + "*************************" );
		System.out.println();
	}

	/***********************************Product test cases****************************************/
	@Test(dataProvider ="getProducts")
	public void TestGetProducts(Product product) {
		Product savedProduct = getiUserManagementService().saveProduct(product);
		Assert.assertNotNull(savedProduct);
	}
	
}
