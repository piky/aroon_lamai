import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button, Card, Badge } from "./index";
import { Modal } from "./Modal";

export function ItemCustomizationModal({
  isOpen,
  onClose,
  item,
  onAddToCart,
  loading,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const handleModifierToggle = (modifier) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.id === modifier.id);
      if (exists) {
        return prev.filter((m) => m.id !== modifier.id);
      }
      return [...prev, modifier];
    });
  };

  const calculateTotal = () => {
    const modifierTotal = selectedModifiers.reduce(
      (sum, mod) => sum + (mod.price || 0),
      0,
    );
    return (item.price + modifierTotal) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart({
      menuItem: item,
      quantity,
      modifiers: selectedModifiers,
      notes,
    });
    // Reset state
    setQuantity(1);
    setSelectedModifiers([]);
    setNotes("");
  };

  const modifiers = item.modifiers || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name} size="lg">
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="h-48 w-full rounded-lg object-cover mb-4"
        />
      )}

      {item.description && (
        <p className="text-muted-foreground mb-4">{item.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold">${item.price?.toFixed(2)}</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {modifiers.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Customize</h3>
          <div className="space-y-2">
            {modifiers.map((modifier) => (
              <label
                key={modifier.id}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedModifiers.some((m) => m.id === modifier.id)}
                    onChange={() => handleModifierToggle(modifier)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{modifier.name}</span>
                </div>
                {modifier.price > 0 && (
                  <span className="text-muted-foreground">
                    +${modifier.price.toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-2">Special Instructions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests..."
          className="w-full p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={2}
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium">Total</span>
          <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
        </div>
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={loading}
          size="lg"
        >
          {loading ? "Adding..." : `Add to Order - $${calculateTotal().toFixed(2)}`}
        </Button>
      </div>
    </Modal>
  );
}