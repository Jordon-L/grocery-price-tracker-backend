CREATE TABLE locations(
  id SERIAL PRIMARY KEY,
  location VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE products(
  id SERIAL PRIMARY KEY,    
  name VARCHAR(50) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  product_sku VARCHAR(25) NOT NULL UNIQUE
);

CREATE TABLE prices(
  id SERIAL PRIMARY KEY,
  product_id SERIAL REFERENCES products(id),
  location_id SERIAL REFERENCES locations(id),
  date DATE NOT NULL,
  price NUMERIC(5, 2) NOT NULL,
  unit VARCHAR(3) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  last_updated DATE NOT NULL
);


CREATE TABLE api_keys(
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  hash_key VARCHAR(60) NOT NULL
);


INSERT INTO locations(location)
VALUES ('Grandview'), ('Burnaby'), 
('Seymour'), ('Real Canadian Superstore Marine Drive'), 
('Richmond'), ('Coquitlam'), ('Delta'), ('Surrey');

ALTER TABLE prices
ADD CONSTRAINT prices_unique UNIQUE (product_id, location_id, date);

CREATE OR REPLACE FUNCTION prevent_duplicate_price()
RETURNS TRIGGER AS $$
DECLARE
  latest_price NUMERIC(5, 2);
  latest_date DATE;
BEGIN
  SELECT price, date INTO latest_price, latest_date
  FROM prices
  WHERE product_id = NEW.product_id
  AND location_id = NEW.location_id
  ORDER BY date DESC
  LIMIT 1;

  IF latest_price = NEW.price THEN
    -- Update the existing row with the latest date
    UPDATE prices
    SET last_updated = NEW.last_updated
    WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id
    AND date = latest_date;
    RETURN NULL;
  ELSIF latest_date = NEW.date THEN
    -- Update the price if date is same
    UPDATE prices
    SET price = NEW.price, last_updated = NEW.last_updated
    WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id
    AND date = latest_date;
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_price_trigger
BEFORE INSERT ON prices
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_price();