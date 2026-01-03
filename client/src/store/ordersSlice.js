import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ordersAPI } from "../lib/api";
import {
  saveOrderLocally,
  getLocalOrders,
  deleteLocalOrder,
  syncPendingOrders,
} from "../lib/db";

export const fetchOrders = createAsyncThunk(
  "orders/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order",
      );
    }
  },
);

export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.createOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order",
      );
    }
  },
);

export const createOfflineOrder = createAsyncThunk(
  "orders/createOffline",
  async (orderData) => {
    const localId = await saveOrderLocally(orderData);
    return { ...orderData, localId, offline: true };
  },
);

export const syncOrders = createAsyncThunk("orders/sync", async () => {
  await syncPendingOrders();
  const response = await ordersAPI.getOrders();
  return response.data;
});

export const updateOrder = createAsyncThunk(
  "orders/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateOrder(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order",
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.cancelOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order",
      );
    }
  },
);

export const duplicateOrder = createAsyncThunk(
  "orders/duplicate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.duplicateOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to duplicate order",
      );
    }
  },
);

export const loadLocalOrders = createAsyncThunk(
  "orders/loadLocal",
  async () => {
    const localOrders = await getLocalOrders();
    return localOrders;
  },
);

export const deleteLocalOrderAsync = createAsyncThunk(
  "orders/deleteLocal",
  async (localId) => {
    await deleteLocalOrder(localId);
    return localId;
  },
);

const initialState = {
  orders: [],
  localOrders: [],
  currentOrder: null,
  filters: {
    status: null,
    dateFrom: null,
    dateTo: null,
  },
  loading: false,
  syncing: false,
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: null, dateFrom: null, dateTo: null };
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOfflineOrder.fulfilled, (state, action) => {
        state.localOrders.unshift(action.payload);
      })
      .addCase(syncOrders.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncOrders.fulfilled, (state, action) => {
        state.syncing = false;
        state.orders = action.payload;
        state.localOrders = [];
      })
      .addCase(syncOrders.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(duplicateOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(loadLocalOrders.fulfilled, (state, action) => {
        state.localOrders = action.payload;
      })
      .addCase(deleteLocalOrderAsync.fulfilled, (state, action) => {
        state.localOrders = state.localOrders.filter(
          (o) => o.localId !== action.payload,
        );
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentOrder,
  clearCurrentOrder,
  clearOrdersError,
} = ordersSlice.actions;
export default ordersSlice.reducer;
