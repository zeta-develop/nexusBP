CREATE TABLE IF NOT EXISTS license_product_access (
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (license_id, product_id), -- Composite primary key
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lpa_license_id ON license_product_access(license_id);
CREATE INDEX IF NOT EXISTS idx_lpa_product_id ON license_product_access(product_id);
