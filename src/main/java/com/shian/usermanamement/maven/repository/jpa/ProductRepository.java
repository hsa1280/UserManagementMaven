package com.shian.usermanamement.maven.repository.jpa;

import com.shian.usermanamement.maven.bean.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Created by shian_mac on 8/26/15.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    public List<Product> findAll();
}
