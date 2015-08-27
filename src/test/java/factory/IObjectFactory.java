package factory;

import java.util.List;

public interface IObjectFactory<T> {

	/*
	 ************************* Persisted **************************
	 */

	/**
	 * Add an object to this factory for the 'get' calls
	 * @throws Exception
	 */
	public void addPersisted(T obj);

	/**
	 * Add the entire list to this factory for the 'get' calls
	 * @throws Exception
	 */
	public void addAllPersisted(List<T> objList);

	/**
	 * @return a random persisted element from it's list that have been added to this factory
	 *
	 * @see #add(Object)
	 * @see #addAll(List)
	 */
	public T getPersisted();

	/**
	 * @return num number of persisted items from it's list that have been added to this factory
	 *
	 * @param num
	 * @return
	 * @throws Exception
	 */
	public List<T> getPersisted(int num) throws Exception;

	/**
	 * @return all persisted elements that have been added to this factory
	 *
	 * @see #add(Object)
	 * @see #addAll(List)
	 */
	public List<T> getAllPersisted();

	/*
	 ************************* Non-Persisted ****************************
	 */

	/**
	 * @return a random non-persisted element from it's list that have been added to this factory
	 */
	public T getNonPersisted() throws Exception;

	/**
	 * @return num number of non-persisted items from it's list that have been added to this factory
	 *
	 * @param num
	 * @return
	 * @throws Exception
	 */
	public List<T> getNonPersisted(int num) throws Exception;

	/**
	 * @return all non-persisted elements that have been added to this factory
	 *
	 * @see #add(Object)
	 * @see #addAll(List)
	 */
	public List<T> getAllNonPersisted() throws Exception;

}