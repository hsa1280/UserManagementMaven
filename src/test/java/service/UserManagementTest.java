package service;

import java.lang.reflect.Method;
import java.util.List;

import com.shian.usermanamement.maven.bean.Facility;
import com.shian.usermanamement.maven.bean.Product;
import com.shian.usermanamement.maven.bean.User;
import dataprovider.UserManagementDataProvider;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
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

//	/***********************************User test cases****************************************/
//
//	@Test(dataProvider = "saveAndGetUser" , groups = { "saveAndGetUser" }, dependsOnGroups = {"saveAndGetFacility"})
//	public void TestSaveAndGetUser(User user){
//
//		System.out.println(user.getFirstName() + ", " + user.getLastName() + ", " + user.getEmailAddress());
//
//		User savedObj = iUserManagementService.saveUser(user);
//
//		Assert.assertNotNull( savedObj );
//
//		savedObj = iUserManagementService.getUser(savedObj.getId());
//
//		Assert.assertNotNull( savedObj );
//
//		userObjectFactory.addPersisted(savedObj);
//
//		Assert.assertNotNull( savedObj.getId() );
//		Assert.assertEquals( savedObj.getEmailAddress(), user.getEmailAddress() );
//		Assert.assertEquals( savedObj.getFirstName(), user.getFirstName() );
//		Assert.assertEquals( savedObj.getLastName(), user.getLastName() );
//		Assert.assertEquals( savedObj.isAdmin(), user.isAdmin() );
//
//		Assert.assertNotNull( savedObj.getFacility() );
//		Assert.assertEquals(savedObj.getFacility().getId(), user.getFacility().getId());
//	}
//
//	@Test(dataProvider = "getUsersByFacility", groups = {"getUsersByFacility"}, dependsOnGroups = {"saveAndGetUser"})
//	public void TestGetUserByFacilityId( Long facilityId ) {
//
//		List<User> users = iUserManagementService.getUsersByFacility(facilityId);
//
//		Assert.assertNotNull( users );
//		Assert.assertTrue( users.size() > 0 );
//
//		for ( User user : users ) {
//			System.out.println(user.getEmailAddress() + ", " + user.getFirstName() + ", " + user.getLastName());
//		}
//
//	}
//
//	@Test( dataProvider = "getUsersByFirstName", groups = { "getUsersByFirstName" } , dependsOnGroups = { "saveAndGetUser" })
//	public void TestGetUsersByFirstName(String firstName){
//
//		List<User> result = iUserManagementService.getUsersByFirstName(firstName);
//
//		Assert.assertNotNull( result );
//
//		Assert.assertTrue( result.size() > 0 );
//
//	}
//
//	@Test(dataProvider = "getUsersByLastName", groups = {"getUsersByLastName"}, dependsOnGroups = {"saveAndGetUser"})
//	public void TestGetUsersByLastName(String lastName) {
//
//		List<User> result = iUserManagementService.getUsersByLastName(lastName);
//
//		Assert.assertNotNull( result );
//
//		Assert.assertTrue(result.size() > 0);
//	}
//
//	@Test(dataProvider = "getUserById", groups = {"getUserById"}, dependsOnGroups = {"saveAndGetUser"})
//	public void TestGetUserById(Long id){
//
//		User user = iUserManagementService.getUser( id );
//
//		Assert.assertNotNull(user);
//
//	}
//
//	/***********************************Facility test cases****************************************/
//
//	@Test(dataProvider = "saveAndGetFacility" , groups = { "saveAndGetFacility" })
//	public void TestsaveAndGetFacility(Facility facility){
//
//		System.out.println(facility.getName() + ", " + facility.getAddress());
//
//		Facility savedObj = iUserManagementService.saveFacility( facility );
//
//		Assert.assertNotNull( savedObj );
//
//		savedObj = iUserManagementService.getFacilityById( savedObj.getId() );
//
//		Assert.assertNotNull( savedObj );
//
//		facilityObjectFactory.addPersisted(savedObj);
//
//		Assert.assertNotNull( savedObj.getId() );
//		Assert.assertEquals( savedObj.getAddress(), facility.getAddress() );
//		Assert.assertEquals(savedObj.getName(), facility.getName());
//
//	}
//
//	@Test(dataProvider = "getFacilityById", groups = {"getFacilityById"}, dependsOnGroups = {"saveAndGetFacility"})
//	public void TestGetFacilityById(Long id) {
//		Facility facility = iUserManagementService.getFacilityById(id);
//
//		Assert.assertNotNull(facility);
//	}
//
//	@Test(dataProvider = "getFacilityByName", groups = {"getFacilityByName"}, dependsOnGroups = {"saveAndGetFacility"})
//	public void TestGetFacilityByName(String name){
//
//		List<Facility> facility = iUserManagementService.getFacilityByName(name);
//
//		Assert.assertNotNull( facility );
//
//		Assert.assertTrue( facility.size() > 0 );
//	}
//
//	@Test(dataProvider = "getFacilityByAddress", groups = {"getFacilityByAddress"}, dependsOnGroups = {"saveAndGetFacility"})
//	public void TestGetFacilityByAddress(String address) {
//
//		List<Facility> facility = iUserManagementService.getFacilityByAddress( address );
//
//		Assert.assertNotNull( facility );
//
//		Assert.assertTrue(facility.size() > 0);
//	}

	/***********************************Product test cases****************************************/
	@Test(dataProvider ="getProducts")
	public void TestGetProducts(Product product) {
		Product savedProduct = getiUserManagementService().saveProduct(product);
		Assert.assertNotNull(savedProduct);
	}
	
	@AfterClass
	public void afterClass() {

		//deleteAllData();

	}
	
}
