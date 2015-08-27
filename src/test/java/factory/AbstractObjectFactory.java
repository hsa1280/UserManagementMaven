package factory;

import java.util.ArrayList;
import java.util.List;
import java.util.Collections;
import java.util.Random;

public abstract class AbstractObjectFactory<T> implements IObjectFactory<T> {

	private Random random = new Random();

	protected List<T> persistedObjectList = new ArrayList<T>();

	protected List<T> nonPersistedObjectList = new ArrayList<T>();

	// -------------------------------------------

	/*
	 ************************* Persisted **************************
	 */

	/**
	 */
	@Override
	public void addPersisted( T obj ) {

		T itemToRemove = null;

		// remove the same obj from non-persisted object list

		for( T nonPersistedObj : nonPersistedObjectList ) {

			if( compare( nonPersistedObj, obj ) ) {
				itemToRemove = nonPersistedObj;
			}

		}

		nonPersistedObjectList.remove( itemToRemove );

		// remove the same obj from persisted object list

		for( T persistedObj : persistedObjectList ) {

			if( compare( persistedObj, obj ) ) {
				itemToRemove = persistedObj;
			}

		}

		persistedObjectList.remove( itemToRemove );

		persistedObjectList.add( obj );

	}

	/**
	 * @throws Exception
	 */
	@Override
	public void addAllPersisted( List<T> objList ) {
		if( objList != null ) {
			for( T obj : objList ) {
				addPersisted( obj );
			}
		}
	}

	/**
	 */
	@Override
	public T getPersisted() {

		if( persistedObjectList.size() > 0 ) {
			return persistedObjectList.get( random.nextInt( persistedObjectList.size() ) );
		}

		return null;

	}

	/**
	 * @throws Exception
	 */
	@Override
	public List<T> getPersisted( int num ) throws Exception {

		if( num > persistedObjectList.size() ) {
			throw new Exception( "Number requested is more than what's in the object list." );
		}

		if( num <= 0 ) {
			return new ArrayList<T>();
		}

		Collections.shuffle( persistedObjectList );

		return persistedObjectList.subList( 0, num );

	}

	/**
	 */
	@Override
	public List<T> getAllPersisted() {
		return persistedObjectList;
	}

	/*
	 ************************* Non-Persisted ****************************
	 */

	/**
	 * @throws Exception
	 */
	@Override
	public T getNonPersisted() throws Exception {

		setupNonPersistedList();

		if( nonPersistedObjectList.size() > 0 ) {
			return nonPersistedObjectList.get( random.nextInt( nonPersistedObjectList.size() ) );
		}

		return null;

	}

	/**
	 * @throws Exception
	 */
	@Override
	public List<T> getNonPersisted( int num ) throws Exception {

		setupNonPersistedList();

		if( num > nonPersistedObjectList.size() ) {
			throw new Exception( "Number requested is more than what's in the object list." );
		}

		if( num <= 0 ) {
			return new ArrayList<T>();
		}

		//Collections.shuffle( nonPersistedObjectList );

		/*
		 *  must return a new reference because when calling addPersisted it will loop through this list
		 *  java.util.ConcurrentModificationException will occur if addPersisted is called inside of a loop of this list
		 */
		return new ArrayList<T>( nonPersistedObjectList.subList( 0, num ) );

	}

	/**
	 * @throws Exception
	 */
	@Override
	public List<T> getAllNonPersisted() throws Exception {

		setupNonPersistedList();

		/*
		 *  must return a new reference because when calling addPersisted it will loop through this list
		 *  java.util.ConcurrentModificationException will occur if addPersisted is called inside of a loop of this list
		 */
		return new ArrayList<T>( nonPersistedObjectList );

	}

	protected abstract void setupNonPersistedList() throws Exception;

	/**
	 *
	 * @param obj1
	 * @param obj2
	 * @return
	 */
	protected abstract boolean compare( T obj1, T obj2 );

	// -------------------------------------------

	protected Random getRandom() {
		return random;
	}

}