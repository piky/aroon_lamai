import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { Button, Card } from "./index";
import { fetchOrders } from "../../store/ordersSlice";

export function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate("/orders");
    }
  }, [orderId, navigate]);

  const order = orders.find((o) => o.id === orderId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-success-500/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-success-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Order Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your order has been sent to the kitchen.
        </p>

        {order && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Table {order.tableNumber || order.table_id}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Order #{order.id}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => navigate("/orders")}
            disabled={loading}
          >
            View Orders
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Back to Tables
          </Button>
        </div>
      </Card>
    </div>
  );
}