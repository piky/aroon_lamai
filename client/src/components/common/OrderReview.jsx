import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button, Card, Badge } from "./index";
import { Drawer } from "./Drawer";
import { createOrder } from "../../store/ordersSlice";
import { clearCart } from "../../store/cartSlice";

export function OrderReview({ isOpen, onClose, tableId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, totalItems } = useSelector((state) => state.cart);
  const { loading, error } = useSelector((state) => state.orders);
  const [submitting, setSubmitting] = useState(false);

  const calculateItemTotal = (item) => {
    const modifierTotal = item.modifiers?.reduce(
      (sum, mod) => sum + (mod.price || 0),
      0,
    ) || 0;
    return (item.price + modifierTotal) * item.quantity;
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      const orderData = {
        table_id: parseInt(tableId),
        items: items.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          modifiers: item.modifiers?.map((m) => ({
            modifier_id: m.id,
            name: m.name,
            price: m.price,
          })),
          notes: item.notes,
        })),
      };

      const result = await dispatch(createOrder(orderData));
      if (createOrder.fulfilled.match(result)) {
        dispatch(clearCart());
        onClose();
        navigate("/orders/success", {
          state: { orderId: result.payload.id },
        });
      }
    } catch (err) {
      console.error("Failed to submit order:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Review Order" position="right">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id || item.sessionId} className="p-3">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.quantity}x {item.name}
                      </div>
                      {item.modifiers?.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.modifiers.map((m) => m.name).join(", ")}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                    <div className="text-right font-medium">
                      ${calculateItemTotal(item).toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmitOrder}
                disabled={submitting || loading}
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Submit Order
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Add More Items
              </Button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}