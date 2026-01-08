import Dexie from "dexie";

export const db = new Dexie("WaitstaffAppDB");

db.version(1).stores({
  orders: "++id, localId, serverId, status, tableId, createdAt",
  cartItems: "++id, sessionId, menuItemId, quantity",
  pendingSync: "++id, type, data, timestamp",
  menuCache: "++id, category, updatedAt",
  settings: "key",
});

export const clearAllData = async () => {
  await db.orders.clear();
  await db.cartItems.clear();
  await db.pendingSync.clear();
  await db.menuCache.clear();
};

export const syncPendingOrders = async () => {
  const pending = await db.pendingSync.where("type").equals("order").toArray();

  for (const item of pending) {
    try {
      const { data } = item;
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(data),
        },
      );

      await db.pendingSync.delete(item.id);
    } catch (error) {
      console.error("Failed to sync order:", error);
    }
  }
};

export const saveOrderLocally = async (order) => {
  const localId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderWithLocalId = {
    ...order,
    localId,
    createdAt: new Date().toISOString(),
  };

  await db.orders.add(orderWithLocalId);

  await db.pendingSync.add({
    type: "order",
    data: order,
    timestamp: new Date().toISOString(),
  });

  return localId;
};

export const getLocalOrders = async () => {
  return await db.orders.orderBy("createdAt").reverse().toArray();
};

export const updateLocalOrder = async (localId, updates) => {
  await db.orders.where("localId").equals(localId).update(updates);
};

export const deleteLocalOrder = async (localId) => {
  await db.orders.where("localId").equals(localId).delete();
};

export const cartService = {
  addItem: async (item) => {
    const existing = await db.cartItems
      .where({
        menuItemId: item.menuItemId,
        sessionId: item.sessionId,
      })
      .first();

    if (existing) {
      await db.cartItems.update(existing.id, {
        quantity: existing.quantity + item.quantity,
        modifiers: item.modifiers || existing.modifiers,
        notes: item.notes || existing.notes,
      });
    } else {
      await db.cartItems.add({
        ...item,
        sessionId: item.sessionId || "default",
        addedAt: new Date().toISOString(),
      });
    }
  },

  updateQuantity: async (id, quantity) => {
    if (quantity <= 0) {
      await db.cartItems.delete(id);
    } else {
      await db.cartItems.update(id, { quantity });
    }
  },

  removeItem: async (id) => {
    await db.cartItems.delete(id);
  },

  getCart: async (sessionId = "default") => {
    return await db.cartItems.where("sessionId").equals(sessionId).toArray();
  },

  clearCart: async (sessionId = "default") => {
    await db.cartItems.where("sessionId").equals(sessionId).delete();
  },

  getItemCount: async (sessionId = "default") => {
    const items = await db.cartItems
      .where("sessionId")
      .equals(sessionId)
      .toArray();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
};

export const settingsService = {
  get: async (key, defaultValue = null) => {
    const setting = await db.settings.get(key);
    return setting?.value ?? defaultValue;
  },

  set: async (key, value) => {
    await db.settings.put({ key, value });
  },

  getDarkMode: async () => {
    const stored = await db.settings.get("darkMode");
    if (stored !== undefined) {
      return stored.value;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  },

  setDarkMode: async (value) => {
    await db.settings.put({ key: "darkMode", value });
  },
};
