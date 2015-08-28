package factory.impl;

import com.shian.usermanamement.maven.bean.Product;
import factory.AbstractObjectFactory;

/**
 * Created by shian on 8/27/15.
 */
public class ProductObjectFactory extends AbstractObjectFactory<Product> {

    @Override
    protected void setupNonPersistedList() throws Exception {

        if( nonPersistedObjectList.size() == 0 ) {
            nonPersistedObjectList.add(new Product("Kayak", "A boat for one person", 275.00, "Watersports"));
            nonPersistedObjectList.add(new Product("Lifejacket", "Protective and fashionable", 48.95, "Watersports"));
            nonPersistedObjectList.add(new Product("Soccer Ball", "FIFA-approved size and weight", 19.5, "Soccer"));
            nonPersistedObjectList.add(new Product("Corner Flags", "Give your playing field a professional touch", 34.95, "Soccer"));
            nonPersistedObjectList.add(new Product("Stadium", "Flat-packed 35,000-seat stadium", 79500.00, "Soccer"));
            nonPersistedObjectList.add(new Product("Thinking Cap", "Improve your brain efficiency by 75%", 16, "Chess"));
            nonPersistedObjectList.add(new Product("Unsteady Chair", "Secretly give your opponent a disadvantage", 29.95, "Chess"));
            nonPersistedObjectList.add(new Product("Human Chess Board", "A fun game for the family", 75, "Chess"));
            nonPersistedObjectList.add(new Product("Bling-Bling King", "Gold-plated, diamond-studded King", 1200, "Chess"));

        }
    }

    @Override
    protected boolean compare( Product obj1, Product obj2 ) {
        // TODO Auto-generated method stub
        return obj1.getId() == obj2.getId();
    }

}
