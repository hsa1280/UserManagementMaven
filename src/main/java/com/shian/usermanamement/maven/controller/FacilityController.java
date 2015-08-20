package com.shian.usermanamement.maven.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by shian_mac on 8/19/15.
 */
@RestController
@RequestMapping("/facility")
public class FacilityController {

    @RequestMapping(value = "/{name}", method = RequestMethod.GET)
    public String getHello(@PathVariable("name") String name) {
        return "hello " + name;
    }
}
