CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE, -- A subscription might be linked to a specific license
    plan_type VARCHAR(100), -- e.g., basic, premium, monthly, yearly
    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'inactive' NOT NULL, -- e.g., active, canceled, past_due, trialing
    payment_provider_subscription_id VARCHAR(255) UNIQUE, -- To store Stripe/PayPal subscription ID
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_license_id ON subscriptions(license_id);

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
