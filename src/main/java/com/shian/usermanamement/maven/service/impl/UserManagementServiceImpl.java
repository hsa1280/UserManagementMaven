package com.shian.usermanamement.maven.service.impl;

import com.shian.usermanamement.maven.bean.Facility;
import com.shian.usermanamement.maven.bean.User;
import com.shian.usermanamement.maven.repository.jpa.FacilityRepository;
import com.shian.usermanamement.maven.repository.jpa.UserRepository;
import com.shian.usermanamement.maven.service.IUserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Created by shian_mac on 8/19/15.
 */
@Service
@Repository
public class UserManagementServiceImpl implements IUserManagementService {

    @Autowired
    private UserRepository userRepository;

    /***************************User*******************************/
    @Override
    public User saveUser(User user) {

        return getUserRepository().save( user );


    }

    @Override
    public List<User> getAllUsers() {

        return getUserRepository().findAll();
    }



    @Override
    public List<User> getUsersByFacility( Long facilityId )
    {
        return getUserRepository().findByFacilityId( facilityId );
    }

    @Override
    public List<User> getUsersByFirstName( String firstName ) {

        return getUserRepository().findByFirstName( firstName );
    }

    @Override
    public List<User> getUsersByLastName( String lastName ) {

        return getUserRepository().findByLastName( lastName );
    }

    @Override
    public void deleteUser( Long id ) {

        getUserRepository().delete( id );

    }

    @Override
    public void deleteUsers( List<User> users ) {

        getUserRepository().delete( users );

    }

    @Override
    public User getUser( Long id ) {

        return getUserRepository().findOne( id );
    }

    /***************************Facility*******************************/
    @Autowired
    private FacilityRepository facilityRepository;

    @Override
    public Facility saveFacility( Facility facility ) {

        return getFacilityRepository().save( facility );
    }

    @Override
    public void deleteFacility( Long id ) {

        getFacilityRepository().delete( id );
    }

    @Override
    public void deleteAllFacilities( List<Facility> facilities ) {

        getFacilityRepository().delete( facilities );
    }

    @Override
    public Facility getFacilityById( Long id ) {

        return getFacilityRepository().findOne( id );
    }

    @Override
    public List<Facility> getFacilityByName( String name ) {

        return getFacilityRepository().findByName( name );
    }

    @Override
    public List<Facility> getFacilityByAddress( String name ) {

        return getFacilityRepository().findByAddress( name );
    }



    @Override
    public List<Facility> getAllFacilities() {
        return getFacilityRepository().findAll();
    }

    public FacilityRepository getFacilityRepository() {
        return facilityRepository;
    }

    public void setFacilityRepository( FacilityRepository facilityRepository ) {
        this.facilityRepository = facilityRepository;
    }

    public UserRepository getUserRepository() {
        return userRepository;
    }


    public void setUserRepository( UserRepository userRepository ) {
        this.userRepository = userRepository;
    }


}

