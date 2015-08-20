package com.shian.usermanamement.maven.repository.jpa;

import com.shian.usermanamement.maven.bean.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Created by shian_mac on 8/19/15.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    public List<User> findByLastName(String lastName);

    public List<User> findByFirstName(String firstName);

    public List<User> findByEmailAddress(String emailAddress);

    public List<User> findByIsAdmin(boolean isAdmin);

    public List<User> findByFacilityId( Long id );

}
