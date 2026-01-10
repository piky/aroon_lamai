import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, ShoppingCart, RefreshCw } from "lucide-react";
import { Layout } from "../components/layout";
import {
  Card,
  Button,
  Input,
  Badge,
  Spinner,
  EmptyState,
} from "../components/common";
import { ItemCustomizationModal } from "../components/common/ItemCustomizationModal";
import { OrderReview } from "../components/common/OrderReview";
import {
  fetchMenu,
  setSelectedCategory,
  setSearchQuery,
} from "../store/menuSlice";
import { addToCart } from "../store/cartSlice";

export default function MenuPage() {
  const dispatch = useDispatch();
  const { categories, items, selectedCategory, searchQuery, loading } =
    useSelector((state) => state.menu);
  const { totalItems } = useSelector((state) => state.cart);
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("tableId");

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMenu());
    setRefreshing(false);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowCustomization(true);
  };

  const handleAddToCart = async (customization) => {
    setAddingToCart(true);
    try {
      await dispatch(addToCart(customization));
      setShowCustomization(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(false);
    }
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
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={localSearch}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
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
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => item.available !== false && handleItemClick(item)}
              >
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
                    {item.available !== false && (
                      <Button size="sm" variant="outline">
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80">
          <Button
            className="w-full shadow-lg"
            size="lg"
            onClick={() => setShowReview(true)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            View Cart ({totalItems} items)
          </Button>
        </div>
      )}

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        isOpen={showCustomization}
        onClose={() => {
          setShowCustomization(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onAddToCart={handleAddToCart}
        loading={addingToCart}
      />

      {/* Order Review Drawer */}
      <OrderReview
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        tableId={tableId}
      />
    </Layout>
  );
}
