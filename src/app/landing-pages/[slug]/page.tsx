"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";

interface Product {
  _id: string;
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

interface Section {
  type: string;
  content?: {
    title?: string;
    description?: string;
    buttonText?: string;
    imageUrl?: string;
    features?: Array<{icon: string; title: string; description: string}>;
    items?: Array<{rating: number; review: string; name: string; location: string}>;
    faqs?: Array<{question: string; answer: string}>;
    [key: string]: unknown;
  };
}

interface LandingPageData {
  _id: string;
  title: string;
  slug: string;
  sections: Section[];
  assignedProducts: Product[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export default function LandingPageView() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/landing-pages/${slug}`
        );

        if (!response.ok) {
          throw new Error("Landing page not found");
        }

        const data = await response.json();
        if (data.ok) {
          setPage(data.data);
        } else {
          setError(data.message || "Failed to load landing page");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load landing page");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Product out of stock");
      return;
    }

    addToCart({
      _id: product._id,
      title: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });

    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading landing page...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error || "Landing page not found"}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{page.title}</h1>
          <Link href="/cart" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <ShoppingCart className="w-4 h-4" />
            Cart
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Render Sections */}
        <div className="space-y-12">
          {page.sections && page.sections.length > 0 ? (
            page.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                {/* Render section based on type */}
                {section.type === "hero_section" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h2 className="text-4xl font-bold mb-4">{section.content?.title}</h2>
                      <p className="text-lg text-gray-600 mb-6">{section.content?.description}</p>
                      <Link href="/cart" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                        {section.content?.buttonText || "Order Now"}
                      </Link>
                    </div>
                    {section.content?.imageUrl && (
                      <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={section.content.imageUrl}
                          alt="Hero"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {section.type === "product_gallery" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {page.assignedProducts && page.assignedProducts.length > 0 ? (
                      page.assignedProducts.map((product) => (
                        <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-4xl">📦</div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                            <p className="text-lg font-bold text-purple-600 mb-4">৳{product.price}</p>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock <= 0}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                            >
                              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        No products assigned to this landing page
                      </div>
                    )}
                  </div>
                )}

                {section.type === "features_section" && (
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-8">{section.content?.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(section.content?.features as Array<{icon: string; title: string; description: string}>)?.map((feature, i: number) => (
                        <div key={i} className="text-center">
                          <div className="text-4xl mb-4">{feature.icon}</div>
                          <h3 className="font-semibold mb-2">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.type === "testimonials" && (
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-8">{section.content?.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(section.content?.items as Array<{rating: number; review: string; name: string; location: string}>)?.map((testimonial, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                          <div className="flex gap-1 mb-4">
                            {[...Array(testimonial.rating || 5)].map((_, j) => (
                              <span key={j} className="text-yellow-400">⭐</span>
                            ))}
                          </div>
                          <p className="text-gray-600 mb-4">&quot;{testimonial.review}&quot;</p>
                          <p className="font-semibold text-gray-900">{testimonial.name}</p>
                          <p className="text-sm text-gray-500">{testimonial.location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.type === "faq_section" && (
                  <div className="bg-gray-50 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-8">{section.content?.title}</h2>
                    <div className="space-y-4">
                      {(section.content?.faqs as Array<{question: string; answer: string}>)?.map((faq, i: number) => (
                        <details key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                          <summary className="font-semibold cursor-pointer text-gray-900">
                            {faq.question}
                          </summary>
                          <p className="mt-4 text-gray-600">{faq.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No content available for this landing page
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-lg mb-8 opacity-90">
            {page.assignedProducts && page.assignedProducts.length > 0
              ? `Choose from ${page.assignedProducts.length} amazing products`
              : "Browse our collection"}
          </p>
          <Link href="/cart" className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-bold transition-colors">
            Go to Cart
          </Link>
        </div>
      </main>
    </div>
  );
}
