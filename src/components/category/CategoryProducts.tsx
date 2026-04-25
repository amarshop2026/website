/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";
import {
  useGetProductsPaginatedQuery,
  useLazyGetProductsPaginatedQuery,
} from "@/services/catalog.api";

type Props = {
  initialProducts: Product[];
  initialMeta?: { page: number; pages: number; total: number; limit: number };
  categorySlug?: string;
  subcategorySlug?: string;
};

const LIMIT = 24;

export default function CategoryProducts({
  initialProducts,
  initialMeta,
  categorySlug,
  subcategorySlug,
}: Props) {
  const queryArg = {
    ...(categorySlug ? { category: categorySlug } : {}),
    ...(subcategorySlug ? { subcategory: subcategorySlug } : {}),
    inStock: "true" as const,
    limit: LIMIT,
    page: 1,
  };

  // Use RTK for page 1 (keeps cache warm; skip if we already have SSR data)
  const { data: page1Data } = useGetProductsPaginatedQuery(queryArg, {
    skip: initialProducts.length > 0,
  });

  const [trigger, { isFetching }] = useLazyGetProductsPaginatedQuery();

  const [items, setItems] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(initialMeta?.page ?? 1);
  const [pages, setPages] = useState(initialMeta?.pages ?? 1);
  const [hasMore, setHasMore] = useState(
    initialMeta ? initialMeta.page < initialMeta.pages : initialProducts.length >= LIMIT
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // If SSR had no products, seed from RTK page-1 result
  useEffect(() => {
    if (!page1Data || initialProducts.length > 0) return;
    setItems(page1Data.items ?? []);
    setPage(page1Data.page ?? 1);
    setPages(page1Data.pages ?? 1);
    setHasMore((page1Data.page ?? 1) < (page1Data.pages ?? 1));
  }, [page1Data, initialProducts.length]);

  // Reset when slug changes
  useEffect(() => {
    setItems(initialProducts);
    setPage(initialMeta?.page ?? 1);
    setPages(initialMeta?.pages ?? 1);
    setHasMore(
      initialMeta ? initialMeta.page < initialMeta.pages : initialProducts.length >= LIMIT
    );
    setLoadError(null);
  }, [categorySlug, subcategorySlug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMore() {
    if (isFetching || !hasMore) return;
    setLoadError(null);
    try {
      const nextPage = page + 1;
      const res = await trigger({ ...queryArg, page: nextPage }).unwrap();
      const nextItems = res.items ?? [];
      if (nextItems.length === 0) {
        setHasMore(false);
        return;
      }
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p._id));
        return [...prev, ...nextItems.filter((p: any) => !ids.has(p._id))];
      });
      setPage(res.page ?? nextPage);
      setPages(res.pages ?? pages);
      setHasMore((res.page ?? nextPage) < (res.pages ?? pages));
    } catch (err: any) {
      console.error("loadMore error", err);
      setLoadError("Failed to load more products");
    }
  }

  // IntersectionObserver — auto-trigger loadMore
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) loadMore();
      },
      { threshold: 0.1 }
    );
    const el = observerTarget.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, isFetching, page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {items.length > 0 ? (
          items.map((p) => (
            <div key={p._id} className="min-w-0">
              <ProductCard product={p} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No products found
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={observerTarget} className="flex flex-col items-center mt-6 gap-2">
        {loadError && <div className="text-sm text-red-600">{loadError}</div>}
        {isFetching && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading more products...</p>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="text-sm text-gray-500">No more products</div>
        )}
      </div>
    </div>
  );
}
