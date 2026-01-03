import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus } from "lucide-react";
import { Layout } from "../components/layout";
import {
  Card,
  Button,
  Input,
  Badge,
  Spinner,
  EmptyState,
} from "../components/common";
import {
  fetchMenu,
  setSelectedCategory,
  setSearchQuery,
} from "../store/menuSlice";

export default function MenuPage() {
  const dispatch = useDispatch();
  const { categories, items, selectedCategory, searchQuery, loading } =
    useSelector((state) => state.menu);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = item.available !== false;
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const handleSearch = (e) => {
    setLocalSearch(e.target.value);
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      dispatch(setSearchQuery(e.target.value));
    }, 300);
  };

  if (loading && items.length === 0) {
    return (
      <Layout title="Menu">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Menu" showBottomNav={false}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={localSearch}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => dispatch(setSelectedCategory(null))}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => dispatch(setSelectedCategory(category.id))}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No items found"
            description={
              searchQuery
                ? "Try a different search term"
                : "No menu items available"
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="font-bold text-primary">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    {item.available === false && (
                      <Badge variant="secondary">Unavailable</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.available === false}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
