package com.shian.usermanamement.maven.service;

import com.shian.usermanamement.maven.bean.Facility;
import com.shian.usermanamement.maven.bean.Product;
import com.shian.usermanamement.maven.bean.User;

import java.util.List;

/**
 * Created by shian_mac on 8/19/15.
 */
public interface IUserManagementService {

    //******************User************************************

    public User saveUser(User user);

    public void deleteUser(Long id);

    public void deleteUsers( List<User> users );

    public User getUser(Long id);

    public List<User> getUsersByFirstName(String firstName);

    public List<User> getUsersByLastName( String lastName );

    public List<User> getUsersByFacility( Long facilityId );

    public List<User> getAllUsers();

    //******************Facility************************************

    public Facility saveFacility(Facility facility);

    public void deleteFacility(Long id);

    public void deleteAllFacilities(List<Facility> facilities);

    public Facility getFacilityById(Long id);

    public List<Facility> getFacilityByName(String name);

    public List<Facility> getFacilityByAddress(String name);

    public List<Facility> getAllFacilities();

    //******************Product************************************
    public List<Product> getProducts();
    public Product saveProduct(Product product);

}

