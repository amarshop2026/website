import { NextRequest, NextResponse } from "next/server";

const BACKEND_API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "100";
    const q = searchParams.get("q") || "";

    let url = `${BACKEND_API}/products?page=${page}&limit=${limit}`;
    if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    }

    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform response to ensure correct format
    const transformedData = {
      ok: true,
      data: data.data?.items || data.data || [],
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch products", error: String(error) },
      { status: 500 }
    );
  }
}
