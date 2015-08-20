package com.shian.usermanamement.maven.bean;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

/**
 * Created by shian_mac on 8/19/15.
 */
@Entity(name = "facility")
public class Facility {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String address;

    public Facility( String name, String address ) {

        super();

        this.name = name;
        this.address = address;

    }

    public Facility() {
        super();
    }

    public Long getId() {
        return id;
    }

    public void setId( Long id ) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName( String name ) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress( String address ) {
        this.address = address;
    }

    @Override
    public String toString() {
        return "Facility [id=" + id + ", name=" + name + ", address=" + address + "]";
    }


}

