package com.shian.usermanamement.maven.controller;

import com.shian.usermanamement.maven.bean.Facility;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by shian_mac on 8/19/15.
 */
@RestController
@RequestMapping("/facility")
public class FacilityController extends AbstractController{

//    @RequestMapping(value = "/{name}", method = RequestMethod.GET)
//    public String getHello(@PathVariable("name") String name) {
//        return "hello " + name;
//    }

    @RequestMapping(method = RequestMethod.GET)
    @ResponseStatus( HttpStatus.OK )
    public List<Facility> getFacilityList() {

        List<Facility> facilityList = new ArrayList<Facility>();
        for( Facility facility : getiUserManagementService().getAllFacilities() ) {
            if (facility != null) {
                facilityList.add(facility);
            }
        }

        return facilityList;
    }
}
