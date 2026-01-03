import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { menuAPI } from "../lib/api";

export const fetchMenu = createAsyncThunk(
  "menu/fetchMenu",
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getMenu();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch menu",
      );
    }
  },
);

export const fetchCategories = createAsyncThunk(
  "menu/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchItems = createAsyncThunk(
  "menu/fetchItems",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getItems(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch items",
      );
    }
  },
);

const initialState = {
  categories: [],
  items: [],
  selectedCategory: null,
  searchQuery: "",
  availableOnly: true,
  loading: false,
  error: null,
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setAvailableOnly: (state, action) => {
      state.availableOnly = action.payload;
    },
    clearMenuError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories || [];
        state.items = action.payload.items || [];
        if (action.payload.categories?.length > 0 && !state.selectedCategory) {
          state.selectedCategory = action.payload.categories[0].id;
        }
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        if (action.payload?.length > 0 && !state.selectedCategory) {
          state.selectedCategory = action.payload[0].id;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedCategory,
  setSearchQuery,
  setAvailableOnly,
  clearMenuError,
} = menuSlice.actions;
export default menuSlice.reducer;
