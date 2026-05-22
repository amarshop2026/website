"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, Clock, Phone, Mail, Home } from "lucide-react";
import toast from "react-hot-toast";

interface OrderData {
  _id: string;
  customer: {
    name: string;
    phone: string;
    billingAddress?: {
      houseOrVillage?: string;
      roadOrPostOffice?: string;
      blockOrThana?: string;
      district?: string;
    };
  };
  lines: Array<{
    title: string;
    qty: number;
    price: number;
  }>;
  totals: {
    subTotal: number;
    shipping: number;
    grandTotal: number;
  };
  status: string;
  createdAt: string;
}

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const phone = searchParams.get("phone");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !phone) {
      setError("Invalid order information");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/customer/orders/${phone}/${orderId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const data = await response.json();
        if (data.ok && data.data) {
          setOrder(data.data);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, phone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || "Something went wrong"}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-lg opacity-90">Thank you for your order. We'll get it to you soon.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Order Number Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-green-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 text-sm font-semibold mb-1">ORDER NUMBER</p>
              <p className="text-3xl font-bold text-gray-900 font-mono">{order._id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold mb-1">ORDER DATE</p>
              <p className="text-2xl font-bold text-gray-900">{orderDate}</p>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Status</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600 capitalize">{order.status}</p>
            <p className="text-sm text-gray-600 mt-2">Your order is being processed</p>
          </div>

          {/* Delivery Time */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-600">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Delivery</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">1-3 Days</p>
            <p className="text-sm text-gray-600 mt-2">Estimated delivery time</p>
          </div>

          {/* Total Amount */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Total Amount</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">৳{order.totals.grandTotal}</p>
            <p className="text-sm text-gray-600 mt-2">Cash on delivery</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-purple-600" />
                Delivery Address
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-900">{order.customer.name}</p>
                {order.customer.billingAddress?.houseOrVillage && (
                  <p>{order.customer.billingAddress.houseOrVillage}</p>
                )}
                {order.customer.billingAddress?.roadOrPostOffice && (
                  <p>{order.customer.billingAddress.roadOrPostOffice}</p>
                )}
                {order.customer.billingAddress?.blockOrThana && (
                  <p>{order.customer.billingAddress.blockOrThana}</p>
                )}
                {order.customer.billingAddress?.district && (
                  <p>{order.customer.billingAddress.district}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold text-gray-900">{order.customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Need Help?</p>
                  <p className="font-semibold text-gray-900">
                    <a href="tel:+8801318319610" className="text-purple-600 hover:underline">
                      +880 1318 319610
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.lines.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                </div>
                <p className="font-semibold text-gray-900">৳{item.price * item.qty}</p>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{order.totals.subTotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>৳{order.totals.shipping}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 bg-gray-50 p-4 rounded">
              <span>Total</span>
              <span>৳{order.totals.grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>We'll confirm your order and prepare it for shipment</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>You'll receive a tracking number via SMS/Call</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Your order will be delivered within 1-3 business days</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Pay the delivery person (Cash on Delivery)</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/orders" className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-center transition-colors">
            Track Your Order
          </Link>
          <Link href="/" className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold text-center transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-4">
            A confirmation email has been sent to your phone number. If you have any questions, please contact us.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="tel:+8801318319610" className="text-purple-600 hover:underline flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Call Us
            </a>
            <a href="mailto:support@amarshop.com" className="text-purple-600 hover:underline flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
