"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  section: string | null;
  images: string[] | null;
  reel_url: string | null;
  sizes: string[] | null;
  featured: boolean;
  active: boolean;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  section: string;
  created_at?: string;
};

type Order = {
  id: string;
  product_id: string | null;
  product_name: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_whatsapp: string | null;
  customer_city: string | null;
  product_size: string | null;
  product_color: string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  amount: number;
  created_at: string;
};

function getDiscount(
  price: number,
  originalPrice: number | null
) {
  if (
    !originalPrice ||
    originalPrice <= price
  ) {
    return 0;
  }

  return Math.round(
    ((originalPrice - price) /
      originalPrice) *
      100
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] =
    useState("products");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCategoryModal, setShowCategoryModal] =
    useState(false);

  const [categoryName, setCategoryName] =
    useState("");

  const [categorySection, setCategorySection] =
    useState("women");

  const [savingCategory, setSavingCategory] =
    useState(false);

  async function loadProducts() {
    setLoadingProducts(true);

    const response =
      await fetch(
        "/api/admin/products",
        {
          cache: "no-store",
        }
      ).catch(() => null);

    if (response) {
      const result =
        await response.json();

      if (response.ok) {
        setProducts(
          result.products || []
        );

        setLoadingProducts(false);
        return;
      }
    }

    // Fallback to browser Supabase query
const { supabase } =
  await import(
    "../../lib/supabase"
  );

const {
  data,
  error,
} = await supabase
  .from("products")
      .select(
        "id, name, description, price, original_price, category_id, section, images, reel_url, sizes, featured, active, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setError(
        error.message
      );
    } else {
      setProducts(
        data || []
      );
    }

    setLoadingProducts(false);
  }

  async function loadCategories() {
    setLoadingCategories(true);

    try {
      const response =
        await fetch(
          "/api/admin/categories",
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error
        );
      }

      setCategories(
        result.categories ||
          []
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);

    try {
      const response =
        await fetch(
          "/api/admin/orders",
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error
        );
      }

      setOrders(
        result.orders || []
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadOrders();
  }, []);

  function getCategoryName(
    id: string | null
  ) {
    return (
      categories.find(
        (category) =>
          category.id === id
      )?.name ||
      "Uncategorized"
    );
  }

  function formatPrice(
    price: number
  ) {
    return new Intl.NumberFormat(
      "en-PK"
    ).format(price);
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString(
      "en-PK",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  async function toggleActive(
    product: Product
  ) {
    setError("");
    setSuccess("");

    const response =
      await fetch(
        "/api/admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId:
              product.id,
            active:
              !product.active,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not update product."
      );
      return;
    }

    setProducts(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  active:
                    !product.active,
                }
              : item
        )
    );

    setSuccess(
      product.active
        ? "Product hidden."
        : "Product published."
    );
  }

  async function toggleFeatured(
    product: Product
  ) {
    setError("");
    setSuccess("");

    const response =
      await fetch(
        "/api/admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId:
              product.id,
            featured:
              !product.featured,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not update product."
      );
      return;
    }

    setProducts(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  featured:
                    !product.featured,
                }
              : item
        )
    );
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );

    if (!confirmed) return;

    const response =
      await fetch(
        "/api/admin/products",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: product.id,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not delete product."
      );
      return;
    }

    setProducts(
      (current) =>
        current.filter(
          (item) =>
            item.id !== product.id
        )
    );

    setSuccess(
      "Product deleted."
    );
  }

  async function updateOrder(
    orderId: string,
    field:
      | "orderStatus"
      | "paymentStatus",
    value: string
  ) {
    const response =
      await fetch(
        "/api/admin/orders",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId,
            [field]: value,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not update order."
      );
      return;
    }

    setOrders(
      (current) =>
        current.map(
          (order) =>
            order.id === orderId
              ? {
                  ...order,
                  ...(field ===
                  "orderStatus"
                    ? {
                        order_status:
                          value,
                      }
                    : {
                        payment_status:
                          value,
                      }),
                }
              : order
        )
    );
  }

  async function addCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSavingCategory(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/categories",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name:
                categoryName.trim(),
              section:
                categorySection,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error
        );
      }

      setCategories(
        (current) =>
          [...current, result.category]
            .sort((a, b) =>
              a.name.localeCompare(
                b.name
              )
            )
      );

      setCategoryName("");
      setShowCategoryModal(
        false
      );

      setSuccess(
        "Category created."
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create category."
      );
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Delete "${category.name}"?`
      );

    if (!confirmed) return;

    const response =
      await fetch(
        "/api/admin/categories",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: category.id,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not delete category."
      );
      return;
    }

    setCategories(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            category.id
        )
    );
  }

  const tabs = [
    ["products", "PRODUCTS"],
    ["reels", "REELS"],
    ["categories", "CATEGORIES"],
    ["orders", "ORDERS"],
    ["reviews", "REVIEWS"],
  ];

  return (
    <main className="min-h-screen bg-[#fafaf8] text-[#181818]">

      <header className="border-b border-[#e5e3de] bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <div>

            <p className="text-sm font-semibold tracking-[0.15em]">
              AHN COLLECTION
            </p>

            <p className="mt-1 text-[8px] tracking-[0.25em] text-[#777]">
              COLLECTION · ADMIN
            </p>

          </div>

          <Link
            href="/"
            className="border border-[#181818] px-5 py-3 text-[10px] font-semibold tracking-[0.12em] hover:bg-[#181818] hover:text-white"
          >
            VIEW WEBSITE
          </Link>

        </div>

      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[230px_1fr]">

        {/* SIDEBAR */}

        <aside className="h-fit border border-[#e5e3de] bg-white">

          <div className="border-b border-[#e5e3de] p-6">

            <p className="text-[9px] font-semibold tracking-[0.25em] text-[#a88952]">
              OWNER PANEL
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              AHN Collection
            </h2>

          </div>

          <div className="p-3">

            {tabs.map(
              ([value, label]) => (

                <button
                  key={value}
                  onClick={() =>
                    setActiveTab(
                      value
                    )
                  }
                  className={`w-full px-4 py-4 text-left text-[10px] font-semibold tracking-[0.12em] ${
                    activeTab ===
                    value
                      ? "bg-[#181818] text-white"
                      : "text-[#666] hover:bg-[#f5f5f3]"
                  }`}
                >
                  {label}
                </button>

              )
            )}

          </div>

        </aside>

        <section>

          {error && (
            <div className="mb-5 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 border border-[#e5e3de] bg-white px-5 py-4 text-sm">
              {success}
            </div>
          )}

          {/* PRODUCTS */}

          {activeTab ===
            "products" && (

            <div>

              <div className="mb-8 flex items-end justify-between">

                <div>

                  <p className="ahn-label text-[#a88952]">
                    INVENTORY
                  </p>

                  <h2 className="mt-2 text-5xl font-medium">
                    Products
                  </h2>

                  <p className="mt-2 text-sm text-[#777]">
                    {products.length}{" "}
                    product
                    {products.length ===
                    1
                      ? ""
                      : "s"}
                  </p>

                </div>

                <Link
                  href="/admin/products/new"
                  className="bg-[#181818] px-6 py-4 text-[10px] font-semibold tracking-[0.14em] text-white"
                >
                  + ADD PRODUCT
                </Link>

              </div>

              {loadingProducts ? (

                <div className="border border-[#e5e3de] bg-white p-12 text-center">
                  Loading products...
                </div>

              ) : (

                <div className="space-y-5">

                  {products.map(
                    (product) => {

                      const image =
                        product.images?.[0] ||
                        "";

                      const discount =
                        getDiscount(
                          product.price,
                          product.original_price
                        );

                      return (

                        <div
                          key={
                            product.id
                          }
                          className="border border-[#e5e3de] bg-white p-6"
                        >

                          <div className="flex flex-col gap-6 lg:flex-row">

                            <div className="h-48 w-full shrink-0 overflow-hidden bg-[#f5f5f3] lg:w-40">

                              {image ? (

                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />

                              ) : (

                                <div className="flex h-full items-center justify-center text-xs text-[#999]">
                                  NO IMAGE
                                </div>

                              )}

                            </div>

                            <div className="flex-1">

                              <div className="flex flex-wrap items-start justify-between gap-4">

                                <div>

                                  <h3 className="text-3xl font-medium">
                                    {
                                      product.name
                                    }
                                  </h3>

                                  <p className="mt-1 text-[9px] font-semibold tracking-wider text-[#a88952]">
                                    {
                                      getCategoryName(
                                        product.category_id
                                      )
                                    }{" "}
                                    ·{" "}
                                    {
                                      (
                                        product.section ||
                                        "COLLECTION"
                                      ).toUpperCase()
                                    }
                                  </p>

                                </div>

                                <div className="flex flex-wrap items-baseline gap-3">

                                  <span className="text-2xl text-[#ff4f1f]">
                                    Rs.{" "}
                                    {formatPrice(
                                      product.price
                                    )}
                                  </span>

                                  {discount >
                                    0 && (
                                    <>
                                      <span className="text-sm text-[#999] line-through">
                                        Rs.{" "}
                                        {formatPrice(
                                          product.original_price ||
                                            0
                                        )}
                                      </span>

                                      <span className="text-sm text-[#666]">
                                        -{discount}%
                                      </span>
                                    </>
                                  )}

                                </div>

                              </div>

                              {product.description && (
                                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#777]">
                                  {
                                    product.description
                                  }
                                </p>
                              )}

                              <div className="mt-5 flex flex-wrap gap-2">

                                <span
                                  className={`border px-3 py-2 text-[10px] ${
                                    product.active
                                      ? "border-green-200 text-green-700"
                                      : "border-red-200 text-red-700"
                                  }`}
                                >
                                  {product.active
                                    ? "PUBLISHED"
                                    : "HIDDEN"}
                                </span>

                                {product.featured && (
                                  <span className="border border-[#d9cdb9] px-3 py-2 text-[10px]">
                                    FEATURED
                                  </span>
                                )}

                                {product.reel_url && (
                                  <span className="border border-[#d9cdb9] px-3 py-2 text-[10px]">
                                    REEL
                                  </span>
                                )}

                              </div>

                              <div className="mt-6 flex flex-wrap gap-3">

                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                  className="border border-[#181818] px-4 py-3 text-[9px] font-semibold tracking-[0.12em]"
                                >
                                  EDIT PRODUCT
                                </Link>

                                <Link
                                  href={`/product/${product.id}`}
                                  target="_blank"
                                  className="border border-[#d9d5ce] px-4 py-3 text-[9px] font-semibold tracking-[0.12em]"
                                >
                                  VIEW PRODUCT
                                </Link>

                                <button
                                  onClick={() =>
                                    toggleActive(
                                      product
                                    )
                                  }
                                  className="border border-[#d9d5ce] px-4 py-3 text-[9px] font-semibold tracking-[0.12em]"
                                >
                                  {product.active
                                    ? "HIDE PRODUCT"
                                    : "PUBLISH PRODUCT"}
                                </button>

                                <button
                                  onClick={() =>
                                    toggleFeatured(
                                      product
                                    )
                                  }
                                  className="border border-[#d9d5ce] px-4 py-3 text-[9px] font-semibold tracking-[0.12em]"
                                >
                                  {product.featured
                                    ? "REMOVE FEATURED"
                                    : "MAKE FEATURED"}
                                </button>

                                <button
                                  onClick={() =>
                                    deleteProduct(
                                      product
                                    )
                                  }
                                  className="border border-red-200 px-4 py-3 text-[9px] font-semibold tracking-[0.12em] text-red-700"
                                >
                                  DELETE
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              )}

            </div>

          )}

          {/* REELS */}

          {activeTab ===
            "reels" && (

            <div>

              <p className="ahn-label text-[#a88952]">
                CONTENT
              </p>

              <h2 className="mt-2 text-5xl font-medium">
                Reels
              </h2>

              <div className="mt-8 space-y-5">

                {products
                  .filter(
                    (product) =>
                      Boolean(
                        product.reel_url
                      )
                  )
                  .map(
                    (product) => (

                      <div
                        key={
                          product.id
                        }
                        className="border border-[#e5e3de] bg-white p-6"
                      >

                        <div className="flex items-center justify-between">

                          <h3 className="text-2xl font-medium">
                            {
                              product.name
                            }
                          </h3>

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="border border-[#181818] px-4 py-3 text-[9px] font-semibold"
                          >
                            EDIT
                          </Link>

                        </div>

                        <video
                          src={
                            product.reel_url ||
                            ""
                          }
                          controls
                          className="mt-5 max-h-[600px] w-full object-contain"
                        />

                      </div>

                    )
                  )}

              </div>

            </div>

          )}

          {/* CATEGORIES */}

          {activeTab ===
            "categories" && (

            <div>

              <div className="mb-8 flex items-end justify-between">

                <div>

                  <p className="ahn-label text-[#a88952]">
                    ORGANIZATION
                  </p>

                  <h2 className="mt-2 text-5xl font-medium">
                    Categories
                  </h2>

                </div>

                <button
                  onClick={() =>
                    setShowCategoryModal(
                      true
                    )
                  }
                  className="bg-[#181818] px-6 py-4 text-[10px] font-semibold tracking-[0.14em] text-white"
                >
                  + ADD CATEGORY
                </button>

              </div>

              {loadingCategories ? (

                <div className="border border-[#e5e3de] bg-white p-8">
                  Loading...
                </div>

              ) : (

                <div className="grid gap-6 md:grid-cols-2">

                  {[
                    "women",
                    "men",
                  ].map(
                    (section) => (

                      <div
                        key={section}
                        className="border border-[#e5e3de] bg-white p-6"
                      >

                        <p className="ahn-label text-[#a88952]">
                          {section.toUpperCase()}
                        </p>

                        <h3 className="mt-2 text-2xl font-medium">
                          {section ===
                          "women"
                            ? "Women's Categories"
                            : "Men's Categories"}
                        </h3>

                        <div className="mt-5 space-y-3">

                          {categories
                            .filter(
                              (category) =>
                                category.section.toLowerCase() ===
                                section
                            )
                            .map(
                              (
                                category
                              ) => {

                                const count =
                                  products.filter(
                                    (
                                      product
                                    ) =>
                                      product.category_id ===
                                      category.id
                                  ).length;

                                return (

                                  <div
                                    key={
                                      category.id
                                    }
                                    className="flex items-center justify-between border border-[#e5e3de] p-4"
                                  >

                                    <div>

                                      <p className="font-medium">
                                        {
                                          category.name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-[#777]">
                                        {
                                          count
                                        }{" "}
                                        product
                                        {count ===
                                        1
                                          ? ""
                                          : "s"}
                                      </p>

                                    </div>

                                    <button
                                      onClick={() =>
                                        deleteCategory(
                                          category
                                        )
                                      }
                                      className="text-xs text-red-700"
                                    >
                                      DELETE
                                    </button>

                                  </div>

                                );
                              }
                            )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}

          {/* ORDERS */}

          {activeTab ===
            "orders" && (

            <div>

              <div className="mb-8 flex items-end justify-between">

                <div>

                  <p className="ahn-label text-[#a88952]">
                    SALES
                  </p>

                  <h2 className="mt-2 text-5xl font-medium">
                    Orders
                  </h2>

                </div>

                <button
                  onClick={
                    loadOrders
                  }
                  className="border border-[#181818] px-5 py-4 text-[10px] font-semibold"
                >
                  REFRESH
                </button>

              </div>

              {loadingOrders ? (

                <div className="border border-[#e5e3de] bg-white p-12 text-center">
                  Loading orders...
                </div>

              ) : orders.length ===
                0 ? (

                <div className="border border-[#e5e3de] bg-white p-12 text-center">
                  <p className="text-2xl">
                    No orders yet.
                  </p>
                </div>

              ) : (

                <div className="space-y-6">

                  {orders.map(
                    (order) => (

                      <div
                        key={
                          order.id
                        }
                        className="border border-[#e5e3de] bg-white p-7"
                      >

                        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#e5e3de] pb-6">

                          <div>

                            <p className="ahn-label text-[#a88952]">
                              ORDER #
                              {
                                order.id.slice(
                                  0,
                                  8
                                )
                              }
                            </p>

                            <h3 className="mt-2 text-2xl font-medium">
                              {
                                order.product_name
                              }
                            </h3>

                            <p className="mt-2 text-xs text-[#777]">
                              {
                                formatDate(
                                  order.created_at
                                )
                              }
                            </p>

                          </div>

                          <p className="text-2xl text-[#ff4f1f]">
                            Rs.{" "}
                            {formatPrice(
                              order.amount
                            )}
                          </p>

                        </div>

                        <div className="grid gap-8 py-7 md:grid-cols-2">

                          <div>

                            <p className="ahn-label text-[#a88952]">
                              CUSTOMER
                            </p>

                            <div className="mt-4 space-y-2 text-sm">

                              <p>
                                <strong>
                                  Name:
                                </strong>{" "}
                                {
                                  order.customer_name
                                }
                              </p>

                              <p>
                                <strong>
                                  Phone:
                                </strong>{" "}
                                {
                                  order.customer_phone
                                }
                              </p>

                              {order.customer_whatsapp && (
                                <p>
                                  <strong>
                                    WhatsApp:
                                  </strong>{" "}
                                  {
                                    order.customer_whatsapp
                                  }
                                </p>
                              )}

                              {order.customer_city && (
                                <p>
                                  <strong>
                                    City:
                                  </strong>{" "}
                                  {
                                    order.customer_city
                                  }
                                </p>
                              )}

                              <p>
                                <strong>
                                  Address:
                                </strong>{" "}
                                {
                                  order.customer_address
                                }
                              </p>

                            </div>

                          </div>

                          <div>

                            <p className="ahn-label text-[#a88952]">
                              ORDER DETAILS
                            </p>

                            <div className="mt-4 space-y-2 text-sm">

                              {order.product_size && (
                                <p>
                                  <strong>
                                    Size:
                                  </strong>{" "}
                                  {
                                    order.product_size
                                  }
                                </p>
                              )}

                              {order.product_color && (
                                <p>
                                  <strong>
                                    Color:
                                  </strong>{" "}
                                  {
                                    order.product_color
                                  }
                                </p>
                              )}

                              <p>
                                <strong>
                                  Payment:
                                </strong>{" "}
                                {
                                  order.payment_method
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                        <div className="grid gap-5 border-t border-[#e5e3de] pt-6 md:grid-cols-2">

                          <div>

                            <label className="field-label">
                              ORDER STATUS
                            </label>

                            <select
                              value={
                                order.order_status ||
                                "pending"
                              }
                              onChange={(
                                event
                              ) =>
                                updateOrder(
                                  order.id,
                                  "orderStatus",
                                  event.target
                                    .value
                                )
                              }
                              className="field-input"
                            >

                              <option value="pending">
                                Pending
                              </option>

                              <option value="confirmed">
                                Confirmed
                              </option>

                              <option value="processing">
                                Processing
                              </option>

                              <option value="shipped">
                                Shipped
                              </option>

                              <option value="delivered">
                                Delivered
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>

                            </select>

                          </div>

                          <div>

                            <label className="field-label">
                              PAYMENT STATUS
                            </label>

                            <select
                              value={
                                order.payment_status ||
                                "pending"
                              }
                              onChange={(
                                event
                              ) =>
                                updateOrder(
                                  order.id,
                                  "paymentStatus",
                                  event.target
                                    .value
                                )
                              }
                              className="field-input"
                            >

                              <option value="pending">
                                Pending
                              </option>

                              <option value="paid">
                                Paid
                              </option>

                              <option value="failed">
                                Failed
                              </option>

                              <option value="refunded">
                                Refunded
                              </option>

                            </select>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}

          {/* REVIEWS */}

          {activeTab ===
            "reviews" && (

            <div>

              <p className="ahn-label text-[#a88952]">
                CUSTOMER FEEDBACK
              </p>

              <h2 className="mt-2 text-5xl font-medium">
                Reviews
              </h2>

              <div className="mt-8 border border-[#e5e3de] bg-white p-8">

                <p className="text-2xl">
                  No reviews yet.
                </p>

                <p className="mt-2 text-sm text-[#777]">
                  Customer reviews and complaints
                  will appear here.
                </p>

              </div>

            </div>

          )}

        </section>

      </div>

      {/* CATEGORY MODAL */}

      {showCategoryModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">

          <div className="w-full max-w-md border border-[#e5e3de] bg-white p-8">

            <div className="flex items-start justify-between">

              <div>

                <p className="ahn-label text-[#a88952]">
                  AHN COLLECTION
                </p>

                <h2 className="mt-2 text-3xl font-medium">
                  Add Category
                </h2>

              </div>

              <button
                onClick={() =>
                  setShowCategoryModal(
                    false
                  )
                }
                className="text-2xl text-[#777]"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                addCategory
              }
              className="mt-8 space-y-5"
            >

              <div>

                <label className="field-label">
                  CATEGORY NAME
                </label>

                <input
                  required
                  value={
                    categoryName
                  }
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  className="field-input"
                />

              </div>

              <div>

                <label className="field-label">
                  COLLECTION
                </label>

                <select
                  value={
                    categorySection
                  }
                  onChange={(event) =>
                    setCategorySection(
                      event.target.value
                    )
                  }
                  className="field-input"
                >

                  <option value="women">
                    Women
                  </option>

                  <option value="men">
                    Men
                  </option>

                </select>

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowCategoryModal(
                      false
                    )
                  }
                  className="flex-1 border border-[#181818] py-4 text-xs font-semibold"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={
                    savingCategory
                  }
                  className="flex-1 bg-[#181818] py-4 text-xs font-semibold text-white"
                >
                  {savingCategory
                    ? "ADDING..."
                    : "ADD CATEGORY"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      <style jsx global>{`
        .field-label {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #666;
        }

        .field-input {
          width: 100%;
          border: 1px solid #dcd9d2;
          background: white;
          padding: 12px 14px;
          outline: none;
          font-size: 14px;
        }
      `}</style>

    </main>
  );
}