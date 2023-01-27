

CREATE TABLE items(
  id SERIAL PRIMARY KEY,
  product_sku VARCHAR(25) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  last_checked DATE NOT NULL
);

CREATE TABLE prices(
  id SERIAL PRIMARY KEY,
  product_sku VARCHAR(25) references items(product_sku),
  date DATE NOT NULL,
  price NUMERIC(3, 2) NOT NULL,
  unit VARCHAR(3) NOT NULL,
  tag VARCHAR(10) NOT NULL
);





