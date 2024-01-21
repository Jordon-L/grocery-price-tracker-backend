CREATE TABLE locations(
  id INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE products(
  id INT AUTO_INCREMENT PRIMARY KEY,    
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  product_sku VARCHAR(25) NOT NULL UNIQUE,
  link VARCHAR(255) DEFAULT NULL
);

CREATE TABLE prices(
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  date DATE NOT NULL,
  price NUMERIC(5, 2) NOT NULL,
  unit VARCHAR(3) NOT NULL,
  tag VARCHAR(10) NOT NULL,
  last_updated DATE NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE api_keys(
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  hash_key VARCHAR(60) NOT NULL
);

INSERT INTO locations(location)
VALUES ('Grandview'), ('Burnaby'), 
('Seymour'), ('Real Canadian Superstore Marine Drive'), 
('Richmond'), ('Coquitlam'), ('Delta'), ('Surrey');

ALTER TABLE prices
ADD CONSTRAINT prices_unique UNIQUE (product_id, location_id, date, tag);

DELIMITER //

CREATE PROCEDURE insert_or_update_price(
    IN p_product_id INT,
    IN p_location_id INT,
    IN p_date DATE,
    IN p_price DECIMAL(5, 2),
    IN p_unit VARCHAR(3),
    IN p_tag VARCHAR(10),
    IN p_last_updated DATE
)
BEGIN
    DECLARE existing_id INT;

    SELECT id INTO existing_id FROM prices
    WHERE product_id = p_product_id
      AND location_id = p_location_id
      AND date = p_date
      AND tag = p_tag
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
        UPDATE prices
        SET price = p_price, last_updated = p_last_updated
        WHERE id = existing_id;
    ELSE
        INSERT INTO prices(product_id, location_id, date, price, unit, tag, last_updated)
        VALUES (p_product_id, p_location_id, p_date, p_price, p_unit, p_tag, p_last_updated);
    END IF;
END //

DELIMITER ;