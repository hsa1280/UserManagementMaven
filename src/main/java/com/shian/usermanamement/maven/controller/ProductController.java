package com.shian.usermanamement.maven.controller;

import com.shian.usermanamement.maven.bean.Product;
import com.shian.usermanamement.maven.service.IUserManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Created by shian_mac on 8/26/15.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController extends AbstractController {

    @RequestMapping(method = RequestMethod.GET)
    @ResponseStatus( HttpStatus.OK )
    public List<Product> getProducts() {

        return getiUserManagementService().getProducts();
    }
}
