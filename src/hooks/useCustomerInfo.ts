/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { 
  clearGuestData, 
  saveGuestCustomerInfo, 
  loadGuestCustomerInfo 
} from "@/lib/localStorage";

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  houseOrVillage: string;
  roadOrPostOffice: string;
  blockOrThana: string;
  district: string;
}

const EMPTY_CUSTOMER_INFO: CustomerInfo = {
  name: "",
  phone: "",
  email: "",
  houseOrVillage: "",
  roadOrPostOffice: "",
  blockOrThana: "",
  district: "",
};

export const useCustomerInfo = () => {
  const { user, isAuthed, isHydrated, token } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(EMPTY_CUSTOMER_INFO);
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedAuthUser = useRef(false);
  const previousAuthState = useRef(isAuthed);

  // Clear localStorage guest data when user becomes authenticated
  useEffect(() => {
    if (isAuthed && !previousAuthState.current) {
      // User just logged in/registered - clear all guest data
      clearGuestData();
      hasLoadedAuthUser.current = false;
    }
    previousAuthState.current = isAuthed;
  }, [isAuthed]);

  useEffect(() => {
    if (!isHydrated) return;

    // PRIORITY 1: Load authenticated user data
    if (isAuthed && user && token) {
      // Prevent loading multiple times
      if (hasLoadedAuthUser.current) return;
      
      setIsLoading(true);
      setIsGuest(false);
      
      // Fetch profile from API
      const API = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
      
      fetch(`${API}/customers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.ok && result.data) {
            // ✅ PRIORITY FIX: Use Redux user phone over API phone
            // This ensures the latest phone number from registration/login is used
            const profileData = {
              name: result.data.name || user.name || "",
              phone: user.phone || result.data.phone || "", // ✅ Prioritize Redux user phone
              email: result.data.email || user.email || "",
              houseOrVillage: result.data.address?.houseOrVillage || "",
              roadOrPostOffice: result.data.address?.roadOrPostOffice || "",
              blockOrThana: result.data.address?.blockOrThana || "",
              district: result.data.address?.district || "",
            };
            
            setCustomerInfo(profileData);
          } else {
            // Fallback to user data from Redux
            const fallbackData = {
              name: user.name || "",
              phone: user.phone || "", // ✅ Use Redux user phone
              email: user.email || "",
              houseOrVillage: extractAddressPart(user.address, 0),
              roadOrPostOffice: extractAddressPart(user.address, 1),
              blockOrThana: extractAddressPart(user.address, 2),
              district: extractAddressPart(user.address, 3),
            };
            
            setCustomerInfo(fallbackData);
          }
          hasLoadedAuthUser.current = true;
        })
        .catch((err) => {
          console.warn("Failed to fetch profile, using Redux user data", err);
          // Fallback to user data on error
          const errorFallbackData = {
            name: user.name || "",
            phone: user.phone || "", // ✅ Use Redux user phone
            email: user.email || "",
            houseOrVillage: extractAddressPart(user.address, 0),
            roadOrPostOffice: extractAddressPart(user.address, 1),
            blockOrThana: extractAddressPart(user.address, 2),
            district: extractAddressPart(user.address, 3),
          };
          setCustomerInfo(errorFallbackData);
          hasLoadedAuthUser.current = true;
        })
        .finally(() => {
          setIsLoading(false);
        });
    } 
    // PRIORITY 2: Load guest data ONLY if definitely not authenticated
    else if (isHydrated && !isAuthed && !user && !token) {
      setIsGuest(true);
      
      // Use utility function to load guest data
      const guestData = loadGuestCustomerInfo();
      
      if (guestData) {
        setCustomerInfo({
          name: guestData.name || "",
          phone: guestData.phone || "",
          email: guestData.email || "",
          houseOrVillage: guestData.houseOrVillage || "",
          roadOrPostOffice: guestData.roadOrPostOffice || "",
          blockOrThana: guestData.blockOrThana || "",
          district: guestData.district || "",
        });
      } else {
        // No saved data - reset to empty
        setCustomerInfo(EMPTY_CUSTOMER_INFO);
      }
    }
  }, [user, isAuthed, isHydrated, token]);

  const saveCustomerInfo = (info: CustomerInfo) => {
    setCustomerInfo(info);
    
    // Save to localStorage for guests only
    if (isGuest) {
      saveGuestCustomerInfo(info);
    }
  };

  return {
    customerInfo,
    saveCustomerInfo,
    isGuest,
    isLoggedIn: isAuthed,
    user,
    isLoading,
  };
};

// Helper to extract address parts from a comma-separated string
function extractAddressPart(address: string | undefined, index: number): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  return parts[index] || "";
}
