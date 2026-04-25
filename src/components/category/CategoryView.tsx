/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/category/CategoryView.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryHeroSlider from "./CategoryHeroSlider";
import CategoryProducts from "./CategoryProducts";
import {
  fetchProducts,
  fetchCategories,
  fetchSubcategories,
} from "@/services/catalog";
import type { Product, Category } from "@/types";
import { Grid3x3 } from "lucide-react";

export const revalidate = 30;

interface CategoryViewProps {
  slug: string;
  isSubcategory?: boolean;
}

function extractMeta(raw: any) {
  const items: Product[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  return {
    items,
    meta: {
      page: Number(raw?.page ?? 1),
      pages: Number(raw?.pages ?? 1),
      total: Number(raw?.total ?? items.length),
      limit: Number(raw?.limit ?? 24),
    },
  };
}

export default async function CategoryView({ slug, isSubcategory = false }: CategoryViewProps) {
  if (isSubcategory) {
    const [subcategoriesRes, productsRes] = await Promise.all([
      fetchSubcategories().catch(() => ({ ok: true, data: [] })),
      fetchProducts({ subcategory: slug, limit: 24, inStock: "true" }).catch(() => ({
        ok: true,
        data: { items: [] as Product[], page: 1, pages: 1, total: 0, limit: 24 },
      })),
    ]);

    const subcategories = subcategoriesRes?.data || [];
    const activeSubcategory = subcategories.find((s: any) => s.slug === slug);

    const { items: initialProducts, meta: initialMeta } = extractMeta(
      (productsRes as any)?.data
    );

    const title = (activeSubcategory as any)?.name ?? decodeURIComponent(slug);
    const banners = (activeSubcategory as any)?.images?.length
      ? (activeSubcategory as any).images.map((image: string, index: number) => ({
          _id: `${(activeSubcategory as any)._id}-${index}`,
          title: title,
          image: image,
        }))
      : [];

    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8 py-8 md:py-12 pt-20 space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#167389] text-white rounded-xl">
                <Grid3x3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-800 truncate">
                  {title}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {initialMeta.total} products
                </p>
              </div>
            </div>
          </div>

          <section>
            <CategoryHeroSlider banners={banners} />
          </section>

          <section>
            <h2 className="text-md md:text-xl font-semibold text-gray-800 mb-4">
              All Products - {title}
            </h2>
            <CategoryProducts
              initialProducts={initialProducts}
              initialMeta={initialMeta}
              subcategorySlug={slug}
            />
          </section>
        </div>
      </div>
    );
  }

  // Original category logic
  const [categoriesRes, productsRes] = await Promise.all([
    fetchCategories().catch(() => ({ ok: true, data: [] as Category[] })),
    fetchProducts({ category: slug, limit: 24, inStock: "true" }).catch(() => ({
      ok: true,
      data: { items: [] as Product[], page: 1, pages: 1, total: 0, limit: 24 },
    })),
  ]);

  const categories: Category[] =
    (categoriesRes && (categoriesRes as any).data) || [];
  const activeCategory = categories.find((c) => c.slug === slug);

  const subcategoriesRes = activeCategory
    ? await fetchSubcategories(activeCategory._id).catch(() => ({ ok: true, data: [] }))
    : { ok: true, data: [] };

  const { items: initialProducts, meta: initialMeta } = extractMeta(
    (productsRes as any)?.data
  );

  const subcategories = subcategoriesRes?.data || [];
  const title =
    activeCategory?.title ?? activeCategory?.name ?? decodeURIComponent(slug);

  const banners = (activeCategory as any)?.images?.length
    ? (activeCategory as any).images.map((image: string, index: number) => ({
        _id: `${activeCategory?._id}-${index}`,
        title: title,
        image: image,
      }))
    : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8 py-8 md:py-12 pt-20 space-y-6">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#167389] text-white rounded-xl">
              <Grid3x3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-800 truncate">
                {title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {initialMeta.total} products
              </p>
            </div>
          </div>
        </div>

        <section>
          <CategoryHeroSlider banners={banners} />
        </section>

        {subcategories.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#167389]">Subcategories</h2>
              <Link
                href={`/subcategories?category=${activeCategory?._id}`}
                className="flex items-center gap-1 text-sm text-[#167389] transition hover:text-rose-600"
              >
                See All <Grid3x3 size={16} />
              </Link>
            </div>
            <div className="-mx-2 overflow-x-auto px-2 scrollbar-hide">
              <div className="flex gap-3 pb-1">
                {subcategories.map((sub: any) => (
                  <Link
                    key={sub._id}
                    href={`/products?subcategory=${sub.slug}`}
                    className="min-w-[120px] h-40 shrink-0 rounded-xl border border-gray-200 bg-white transition hover:border-cyan-300 hover:shadow overflow-hidden"
                  >
                    <div className="relative w-full h-[120px] bg-gray-50">
                      {sub.images?.[0] ? (
                        <Image
                          src={sub.images[0]}
                          alt={sub.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Grid3x3 className="text-[#167389]" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-center text-[12px] font-semibold leading-tight text-gray-700 line-clamp-2">
                        {sub.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-md md:text-xl font-semibold text-gray-800 mb-4">
            All Products - {title}
          </h2>
          <CategoryProducts
            initialProducts={initialProducts}
            initialMeta={initialMeta}
            categorySlug={slug}
          />
        </section>
      </div>
    </div>
  );
}
