/**
 * Utility functions for managing customer-related localStorage
 * Centralized to prevent data leakage between different user sessions
 */

// Customer info interface
export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  houseOrVillage?: string;
  roadOrPostOffice?: string;
  blockOrThana?: string;
  district?: string;
}

// Keys used for customer data in localStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  CUSTOMER_PHONE: "customer_phone",
  CHECKOUT_CUSTOMER: "checkout_customer",
  ORDER_CUSTOMER: "order_customer",
  CUSTOMER: "customer",
  SHIPPING_INFO: "shipping_info",
  GUEST_CUSTOMER_INFO: "guest_customer_info",
} as const;

/**
 * Clear all customer-related data from localStorage
 * Use this when user logs out or when a new user logs in
 */
export const clearAllCustomerData = (): void => {
  if (typeof window === "undefined") return;

  const keysToRemove = Object.values(STORAGE_KEYS);

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from localStorage`, e);
    }
  });

};

/**
 * Clear only guest-related data (not auth tokens)
 * Use this when a guest user logs in or registers
 */
export const clearGuestData = (): void => {
  if (typeof window === "undefined") return;

  const guestKeys = [
    STORAGE_KEYS.CUSTOMER_PHONE,
    STORAGE_KEYS.CHECKOUT_CUSTOMER,
    STORAGE_KEYS.ORDER_CUSTOMER,
    STORAGE_KEYS.CUSTOMER,
    STORAGE_KEYS.SHIPPING_INFO,
    STORAGE_KEYS.GUEST_CUSTOMER_INFO,
  ];

  guestKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from localStorage`, e);
    }
  });

};

/**
 * Check if user is authenticated by checking for access token
 */
export const isUserAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  } catch (e) {
    console.warn("Failed to check authentication status", e);
    return false;
  }
};

/**
 * Save guest customer info (only if user is not authenticated)
 */
export const saveGuestCustomerInfo = (customerInfo: CustomerInfo): void => {
  if (typeof window === "undefined") return;
  
  // Don't save if user is authenticated
  if (isUserAuthenticated()) {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEYS.CHECKOUT_CUSTOMER,
      JSON.stringify(customerInfo)
    );
    if (customerInfo.phone) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PHONE, customerInfo.phone);
    }
  } catch (e) {
    console.warn("Failed to save guest customer info", e);
  }
};

/**
 * Load guest customer info (only if user is not authenticated)
 */
export const loadGuestCustomerInfo = (): CustomerInfo | null => {
  if (typeof window === "undefined") return null;
  
  // Don't load if user is authenticated
  if (isUserAuthenticated()) {
    return null;
  }

  try {
    const savedCustomer = localStorage.getItem(STORAGE_KEYS.CHECKOUT_CUSTOMER);
    const savedPhone = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PHONE);

    if (savedCustomer) {
      const parsed = JSON.parse(savedCustomer) as CustomerInfo;
      return {
        ...parsed,
        phone: parsed.phone || savedPhone || "",
      };
    } else if (savedPhone) {
      return { phone: savedPhone };
    }

    return null;
  } catch (e) {
    console.warn("Failed to load guest customer info", e);
    return null;
  }
};
