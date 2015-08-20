package com.shian.usermanamement.maven.controller;

import com.shian.usermanamement.maven.service.IUserManagementService;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;


public abstract class AbstractController {

	protected final Logger logger = Logger.getLogger( getClass() );
	
	@Autowired
	private IUserManagementService iUserManagementService;

	public IUserManagementService getiUserManagementService() {
		return iUserManagementService;
	}

	public void setiUserManagementService( IUserManagementService iUserManagementService ) {
		this.iUserManagementService = iUserManagementService;
	}
}
