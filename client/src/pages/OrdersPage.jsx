import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Clock, DollarSign, RefreshCw } from "lucide-react";
import { Layout } from "../components/layout";
import { Card, Badge, Spinner, EmptyState, Button } from "../components/common";
import { fetchOrders, loadLocalOrders } from "../store/ordersSlice";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, localOrders, loading } = useSelector((state) => state.orders);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(loadLocalOrders());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchOrders());
      await dispatch(loadLocalOrders());
    } finally {
      setRefreshing(false);
    }
  };

  const handleTouchStart = (e) => {
    pullStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      if (currentY > pullStartY.current) {
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      handleRefresh();
      setIsPulling(false);
    }
  };

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
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="fixed top-0 left-0 right-0 z-10 flex justify-center py-2 bg-background/80 backdrop-blur-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {allOrders.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No orders"
          description="Orders will appear here once created."
          action={<Button onClick={() => navigate("/")}>Go to Tables</Button>}
        />
      ) : (
        <div
          className="space-y-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {refreshing && (
            <div className="flex items-center justify-center py-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Refreshing...</span>
            </div>
          )}

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
