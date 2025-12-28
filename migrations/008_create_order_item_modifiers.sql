-- Migration: Create order item modifiers table (pivot table)
-- Created: 2024-12-28

CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES menu_modifiers(id),
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_item_modifiers_item ON order_item_modifiers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_item_modifiers_modifier ON order_item_modifiers(modifier_id);
