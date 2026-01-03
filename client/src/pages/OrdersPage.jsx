import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Clock, DollarSign } from "lucide-react";
import { Layout } from "../components/layout";
import { Card, Badge, Spinner, EmptyState, Button } from "../components/common";
import { fetchOrders, loadLocalOrders } from "../store/ordersSlice";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, localOrders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(loadLocalOrders());
  }, [dispatch]);

  const allOrders = [...localOrders, ...orders];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "preparing":
        return "secondary";
      case "ready":
        return "success";
      case "served":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading && allOrders.length === 0) {
    return (
      <Layout title="Orders">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Orders">
      {allOrders.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No orders"
          description="Orders will appear here once created."
          action={<Button onClick={() => navigate("/")}>Go to Tables</Button>}
        />
      ) : (
        <div className="space-y-4">
          {localOrders.length > 0 && (
            <div className="rounded-lg border border-warning-500/50 bg-warning-500/10 p-3">
              <p className="text-sm font-medium text-warning-500">
                {localOrders.length} offline order
                {localOrders.length > 1 ? "s" : ""} pending sync
              </p>
            </div>
          )}

          {allOrders.map((order) => (
            <Card
              key={order.localId || order.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/orders/${order.localId || order.id}`)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      Table {order.tableNumber || order.table_id}
                    </span>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    {order.offline && <Badge variant="warning">Offline</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(order.createdAt)}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${(order.totalAmount || order.total)?.toFixed(2)}
                  </span>
                </div>

                {order.items?.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i}>
                        {item.quantity}x {item.name}
                        {i < Math.min(order.items.length, 3) - 1 && ", "}
                      </span>
                    ))}
                    {order.items.length > 3 &&
                      ` +${order.items.length - 3} more`}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
