package com.shian.usermanamement.maven.repository.jpa;

/**
 * Created by shian_mac on 8/19/15.
 */
import java.util.List;

import com.shian.usermanamement.maven.bean.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    public List<Facility> findByName(String name);

    public List<Facility> findByAddress(String address);
}
