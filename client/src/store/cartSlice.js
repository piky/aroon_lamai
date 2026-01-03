import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartService } from "../lib/db";

export const loadCartFromDB = createAsyncThunk(
  "cart/loadFromDB",
  async (sessionId = "default") => {
    const cart = await cartService.getCart(sessionId);
    return cart;
  },
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({
    menuItem,
    quantity = 1,
    modifiers = [],
    notes = "",
    sessionId = "default",
  }) => {
    const cartItem = {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      image: menuItem.image,
      quantity,
      modifiers,
      notes,
      sessionId,
    };

    await cartService.addItem(cartItem);
    const cart = await cartService.getCart(sessionId);
    const totalItems = await cartService.getItemCount(sessionId);

    return { cart, totalItems };
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/update",
  async ({ id, quantity, sessionId = "default" }) => {
    await cartService.updateQuantity(id, quantity);
    const cart = await cartService.getCart(sessionId);
    const totalItems = await cartService.getItemCount(sessionId);

    return { cart, totalItems };
  },
);

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async ({ id, sessionId = "default" }) => {
    await cartService.removeItem(id);
    const cart = await cartService.getCart(sessionId);
    const totalItems = await cartService.getItemCount(sessionId);

    return { cart, totalItems };
  },
);

export const clearCart = createAsyncThunk(
  "cart/clear",
  async (sessionId = "default") => {
    await cartService.clearCart(sessionId);
    return [];
  },
);

const calculateTotal = (cart) => {
  return cart.reduce((sum, item) => {
    const modifierTotal =
      item.modifiers?.reduce((mSum, mod) => mSum + (mod.price || 0), 0) || 0;
    return sum + (item.price + modifierTotal) * item.quantity;
  }, 0);
};

const initialState = {
  items: [],
  sessionId: "default",
  totalItems: 0,
  totalAmount: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    clearCartState: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartFromDB.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadCartFromDB.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.totalItems = action.payload.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        state.totalAmount = calculateTotal(action.payload);
      })
      .addCase(loadCartFromDB.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.cart;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = calculateTotal(action.payload.cart);
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.cart;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = calculateTotal(action.payload.cart);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.cart;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = calculateTotal(action.payload.cart);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      });
  },
});

export const { setSessionId, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
