package factory.impl;
import java.util.List;

import com.shian.usermanamement.maven.bean.Facility;
import com.shian.usermanamement.maven.bean.User;
import factory.AbstractObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class UserObjectFactory extends AbstractObjectFactory<User> {
	
	@Autowired
	private FacilityObjectFactory facilityObjectFactory;

	@Override
	protected void setupNonPersistedList() throws Exception {
		
		if( nonPersistedObjectList.size() == 0 ) {

			List<Facility> facilities = getFacilityObjectFactory().getPersisted( 3 );
			
			nonPersistedObjectList.add( new User( "shian", "huang", "shian.huang@fotlinc.com", true, facilities.get( 0 ) ) );
			nonPersistedObjectList.add( new User( "hua", "wang", "hua.wang@fotlinc.com", true, facilities.get( 0 ) ));
			nonPersistedObjectList.add( new User( "jin", "li", "jin.li@fotlinc.com", true, facilities.get( 0 ) ) );

		}
		
	}
	
	@Override
	protected boolean compare( User obj1, User obj2 ) {

		return obj1.getId() == obj2.getId();
		
	}
	
	public FacilityObjectFactory getFacilityObjectFactory() {
		return facilityObjectFactory;
	}

	public void setFacilityObjectFactory( FacilityObjectFactory facilityObjectFactory ) {
		this.facilityObjectFactory = facilityObjectFactory;
	}
	
}
