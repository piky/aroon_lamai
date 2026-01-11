import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "lucide-react";
import { Layout } from "../components/layout";
import { Card, Button, Badge, Spinner, EmptyState } from "../components/common";
import { tablesAPI } from "../lib/api";

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await tablesAPI.getTables();
        setTables(response.data.data);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success";
      case "occupied":
        return "warning";
      case "reserved":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "occupied":
        return "Occupied";
      case "reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Layout title="Tables">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tables">
      {tables.length === 0 ? (
        <EmptyState
          icon={Table}
          title="No tables"
          description="No tables have been configured yet."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => navigate(`/order/new?tableId=${table.id}`)}
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-border p-4 transition-all hover:border-primary hover:bg-accent"
            >
              <div className="mb-2 rounded-full bg-muted p-3">
                <Table className="h-6 w-6" />
              </div>
              <span className="text-lg font-bold">Table {table.table_number || table.number}</span>
              <Badge variant={getStatusColor(table.status)} className="mt-2">
                {getStatusText(table.status)}
              </Badge>
              {table.capacity && (
                <span className="mt-1 text-xs text-muted-foreground">
                  {table.capacity} seats
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
