/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useCustomerOrders.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { Order } from "@/types/order";
import { useAuth } from "./useAuth";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface UseCustomerOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  currentPhone: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function useCustomerOrders(): UseCustomerOrdersResult {
  const { isAuthed, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch phone from profile API if logged in
  useEffect(() => {
    if (isAuthed && token) {
      fetch(`${API}/customers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.ok && result.data?.phone) {
            setCurrentPhone(result.data.phone);
            // Store in localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("customer_phone", result.data.phone);
            }
          }
        })
        .catch(() => {});
    } else {
      // Fallback to localStorage for guests
      try {
        if (typeof window !== "undefined") {
          const phone = localStorage.getItem("customer_phone");
          setCurrentPhone(phone);
        }
      } catch (e) {
        setCurrentPhone(null);
      }
    }
  }, [isAuthed, token]);

  const fetchOrders = useCallback(async () => {
    // cancel previous
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (!currentPhone) {
      setOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API}/customer/orders?phone=${encodeURIComponent(currentPhone)}&page=${page}&limit=10`;

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
      });

      if (ac.signal.aborted) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to load orders (${res.status}) ${txt}`);
      }

      const json = await res.json().catch(() => ({}));
      
      if (!json || json.ok === false) {
        throw new Error(json?.message || "Failed to load orders");
      }

      const ordersList: Order[] = Array.isArray(json?.data?.items)
        ? json.data.items
        : [];
      
      setOrders(ordersList);
      setTotalPages(json?.data?.pages || 1);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("useCustomerOrders error:", e);
      setError(e?.message || "Failed to load your orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPhone, page]);

  useEffect(() => {
    fetchOrders();
    return () => abortRef.current?.abort();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    currentPhone,
    page,
    totalPages,
    setPage,
  };
}
