-- Migration: Create menu modifiers table
-- Created: 2024-12-28

CREATE TABLE IF NOT EXISTS menu_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  max_selections INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_modifiers_item ON menu_modifiers(menu_item_id);

-- Trigger for updated_at
CREATE TRIGGER update_menu_modifiers_updated_at
  BEFORE UPDATE ON menu_modifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
