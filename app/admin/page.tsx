"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  section: string | null;
  images: string[] | null;
  reel_url: string | null;
  sizes: string[] | null;
  stock: number;
  featured: boolean;
  active: boolean;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  section: string;
  created_at: string;
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

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [newCategorySection, setNewCategorySection] =
    useState("women");

  const [savingCategory, setSavingCategory] =
    useState(false);

  // ==================================================
  // LOAD PRODUCTS
  // ==================================================

  async function loadProducts() {
    setLoadingProducts(true);

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Products error:",
        error
      );

      setError(error.message);
      setLoadingProducts(false);
      return;
    }

    setProducts(data || []);
    setLoadingProducts(false);
  }

  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

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
          result.error ||
            "Could not load categories."
        );
      }

      setCategories(
        result.categories || []
      );

    } catch (err) {
      console.error(
        "Categories error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  // ==================================================
  // LOAD ORDERS
  // ==================================================

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
          result.error ||
            "Could not load orders."
        );
      }

      setOrders(
        result.orders || []
      );

    } catch (err) {
      console.error(
        "Orders error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadOrders();
  }, []);

  // ==================================================
  // CATEGORY NAME
  // ==================================================

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) {
      return "Uncategorized";
    }

    return (
      categories.find(
        (category) =>
          category.id === categoryId
      )?.name ||
      "Uncategorized"
    );
  }

  // ==================================================
  // PRICE
  // ==================================================

  function formatPrice(price: number) {
    return new Intl.NumberFormat(
      "en-PK"
    ).format(price);
  }

  // ==================================================
  // DATE
  // ==================================================

  function formatDate(date: string) {
    return new Date(
      date
    ).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This cannot be undone.`
      );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const {
      error,
    } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setError(error.message);
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
      "Product deleted successfully."
    );
  }

  // ==================================================
  // ACTIVE
  // ==================================================

  async function toggleActive(
    product: Product
  ) {
    setError("");
    setSuccess("");

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .update({
        active:
          !product.active,
      })
      .eq("id", product.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    active:
                      data.active,
                  }
                : item
          )
      );

      setSuccess(
        data.active
          ? "Product published."
          : "Product hidden."
      );
    }
  }

  // ==================================================
  // FEATURED
  // ==================================================

  async function toggleFeatured(
    product: Product
  ) {
    setError("");
    setSuccess("");

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .update({
        featured:
          !product.featured,
      })
      .eq("id", product.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    featured:
                      data.featured,
                  }
                : item
          )
      );
    }
  }

  // ==================================================
  // UPDATE ORDER
  // ==================================================

  async function updateOrder(
    orderId: string,
    field:
      | "orderStatus"
      | "paymentStatus",
    value: string
  ) {
    setError("");
    setSuccess("");

    try {
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
        throw new Error(
          result.error ||
            "Could not update order."
        );
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

      setSuccess(
        "Order updated successfully."
      );

    } catch (err) {
      console.error(
        "Order update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update order."
      );
    }
  }

  // ==================================================
  // ADD CATEGORY
  // ==================================================

  async function addCategory(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name =
      newCategoryName.trim();

    if (!name) {
      setError(
        "Please enter a category name."
      );
      return;
    }

    setSavingCategory(true);
    setError("");
    setSuccess("");

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
              name,
              section:
                newCategorySection,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Could not create category."
        );
      }

      setCategories(
        (current) =>
          [
            ...current,
            result.category,
          ].sort((a, b) =>
            a.name.localeCompare(
              b.name
            )
          )
      );

      setNewCategoryName("");
      setNewCategorySection(
        "women"
      );

      setShowCategoryModal(false);

      setSuccess(
        `"${name}" category created successfully.`
      );

    } catch (err) {
      console.error(
        "Add category error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not create category."
      );
    } finally {
      setSavingCategory(false);
    }
  }

  // ==================================================
  // DELETE CATEGORY
  // ==================================================

  async function deleteCategory(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Delete "${category.name}"?`
      );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
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
        throw new Error(
          result.error ||
            "Could not delete category."
        );
      }

      setCategories(
        (current) =>
          current.filter(
            (item) =>
              item.id !== category.id
          )
      );

      setSuccess(
        `"${category.name}" deleted.`
      );

    } catch (err) {
      console.error(
        "Delete category error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete category."
      );
    }
  }

  const tabs = [
    ["products", "PRODUCTS"],
    ["reels", "REELS"],
    ["categories", "CATEGORIES"],
    ["orders", "ORDERS"],
    ["reviews", "REVIEWS"],
  ];

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#30291f]">

      {/* HEADER */}

      <header className="border-b border-[#c9a96e]/30 bg-[#fffdf9]">

        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">

          <div>
            <h1 className="font-[var(--font-cinzel)] text-2xl tracking-[0.25em] text-[#b28a45]">
              AHN
            </h1>

            <p className="mt-1 font-[var(--font-cinzel)] text-[8px] tracking-[0.4em] text-[#75664e]">
              COLLECTION · ADMIN
            </p>
          </div>

          <Link
            href="/"
            className="border border-[#c9a96e]/50 px-5 py-3 font-[var(--font-cinzel)] text-[10px] tracking-[0.15em] text-[#8c7044] hover:bg-[#b28a45] hover:text-white"
          >
            VIEW WEBSITE
          </Link>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[230px_1fr]">

        {/* SIDEBAR */}

        <aside className="h-fit border border-[#c9a96e]/30 bg-[#fffdf9]">

          <div className="border-b border-[#c9a96e]/20 p-6">

            <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#b28a45]">
              OWNER PANEL
            </p>

            <h2 className="mt-2 font-[var(--font-cormorant)] text-2xl">
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
                  className={`w-full px-4 py-4 text-left font-[var(--font-cinzel)] text-[10px] tracking-[0.15em] transition ${
                    activeTab === value
                      ? "bg-[#b28a45] text-white"
                      : "text-[#756c60] hover:bg-[#f4f0e8]"
                  }`}
                >
                  {label}
                </button>
              )
            )}

          </div>

        </aside>

        {/* CONTENT */}

        <section>

          {error && (
            <div className="mb-5 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 border border-[#d9c49a] bg-[#fffaf0] px-5 py-4 text-sm text-[#80652f]">
              {success}
            </div>
          )}

          {/* ==================================================
              PRODUCTS
          ================================================== */}

          {activeTab ===
            "products" && (
            <div>

              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.3em] text-[#b28a45]">
                    INVENTORY
                  </p>

                  <h2 className="mt-2 font-[var(--font-cormorant)] text-5xl">
                    Products
                  </h2>

                  <p className="mt-2 text-sm text-[#81786a]">
                    {products.length}{" "}
                    product
                    {products.length ===
                    1
                      ? ""
                      : "s"} in your collection
                  </p>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={
                      loadProducts
                    }
                    className="border border-[#c9a96e]/50 px-5 py-4 text-[10px] tracking-[0.15em] text-[#8c7044] hover:bg-[#f1eadc]"
                  >
                    REFRESH
                  </button>

                  <Link
                    href="/admin/products/new"
                    className="bg-[#b28a45] px-6 py-4 text-[10px] tracking-[0.15em] text-white hover:bg-[#967238]"
                  >
                    + ADD PRODUCT
                  </Link>

                </div>

              </div>

              {loadingProducts ? (

                <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-12 text-center">
                  Loading collection...
                </div>

              ) : products.length ===
                0 ? (

                <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-12 text-center">

                  <p className="font-[var(--font-cormorant)] text-3xl">
                    Your collection is empty.
                  </p>

                  <Link
                    href="/admin/products/new"
                    className="mt-7 inline-block bg-[#b28a45] px-6 py-4 text-[10px] tracking-[0.15em] text-white"
                  >
                    + ADD FIRST PRODUCT
                  </Link>

                </div>

              ) : (

                <div className="space-y-5">

                  {products.map(
                    (product) => {

                      const imageUrl =
                        product.images?.[0] ||
                        "";

                      return (
                        <div
                          key={product.id}
                          className="border border-[#c9a96e]/30 bg-[#fffdf9] p-6"
                        >

                          <div className="flex flex-col gap-6 lg:flex-row">

                            <div className="h-48 w-full shrink-0 overflow-hidden bg-[#f2eee6] lg:w-40">

                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-[#9a8e7c]">
                                  NO IMAGE
                                </div>
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                <div>

                                  <h3 className="font-[var(--font-cormorant)] text-3xl">
                                    {product.name}
                                  </h3>

                                  <p className="mt-1 text-[9px] tracking-widest text-[#8c7044]">
                                    {getCategoryName(
                                      product.category_id
                                    )}{" "}
                                    ·{" "}
                                    {(
                                      product.section ||
                                      "COLLECTION"
                                    ).toUpperCase()}
                                  </p>

                                </div>

                                <p className="font-[var(--font-cormorant)] text-2xl text-[#b28a45]">
                                  Rs.{" "}
                                  {formatPrice(
                                    product.price
                                  )}
                                </p>

                              </div>

                              {product.description && (
                                <p className="mt-4 line-clamp-2 max-w-2xl text-sm text-[#81786a]">
                                  {
                                    product.description
                                  }
                                </p>
                              )}

                              <div className="mt-5 flex flex-wrap gap-2">

                                <span className="border border-[#d9cdb9] px-3 py-2 text-[10px]">
                                  STOCK:{" "}
                                  {
                                    product.stock
                                  }
                                </span>

                                <span
                                  className={`border px-3 py-2 text-[10px] ${
                                    product.active
                                      ? "border-green-200 text-green-700"
                                      : "border-red-200 text-red-700"
                                  }`}
                                >
                                  {product.active
                                    ? "ACTIVE"
                                    : "HIDDEN"}
                                </span>

                                {product.featured && (
                                  <span className="border border-[#c9a96e] px-3 py-2 text-[10px] text-[#8c7044]">
                                    ★ FEATURED
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
                                  className="border border-[#b28a45] px-4 py-3 text-[9px] tracking-[0.12em] text-[#8c7044] hover:bg-[#b28a45] hover:text-white"
                                >
                                  EDIT PRODUCT
                                </Link>

                                <Link
                                  href={`/product/${product.id}`}
                                  target="_blank"
                                  className="border border-[#c9a96e]/50 px-4 py-3 text-[9px] tracking-[0.12em] text-[#8c7044] hover:bg-[#f1eadc]"
                                >
                                  VIEW PRODUCT
                                </Link>

                                <button
                                  onClick={() =>
                                    toggleActive(
                                      product
                                    )
                                  }
                                  className="border border-[#c9a96e]/50 px-4 py-3 text-[9px] tracking-[0.12em] text-[#8c7044]"
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
                                  className="border border-[#c9a96e]/50 px-4 py-3 text-[9px] tracking-[0.12em] text-[#8c7044]"
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
                                  className="border border-red-200 px-4 py-3 text-[9px] tracking-[0.12em] text-red-700"
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

          {/* ==================================================
              REELS
          ================================================== */}

          {activeTab ===
            "reels" && (
            <div>

              <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                CONTENT
              </p>

              <h2 className="mt-2 font-[var(--font-cormorant)] text-5xl">
                Reels
              </h2>

              <div className="mt-8 space-y-5">

                {products.filter(
                  (product) =>
                    Boolean(
                      product.reel_url
                    )
                ).map(
                  (product) => (
                    <div
                      key={product.id}
                      className="border border-[#c9a96e]/30 bg-[#fffdf9] p-6"
                    >

                      <div className="flex items-center justify-between">

                        <h3 className="font-[var(--font-cormorant)] text-2xl">
                          {
                            product.name
                          }
                        </h3>

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="border border-[#b28a45] px-4 py-3 text-[9px] text-[#8c7044] hover:bg-[#b28a45] hover:text-white"
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

                {products.filter(
                  (product) =>
                    Boolean(
                      product.reel_url
                    )
                ).length === 0 && (
                  <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-8">
                    No reels yet.
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ==================================================
              CATEGORIES
          ================================================== */}

          {activeTab ===
            "categories" && (
            <div>

              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                    ORGANIZATION
                  </p>

                  <h2 className="mt-2 font-[var(--font-cormorant)] text-5xl">
                    Categories
                  </h2>

                  <p className="mt-2 text-sm text-[#81786a]">
                    Manage categories for Women and Men.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowCategoryModal(
                      true
                    )
                  }
                  className="bg-[#b28a45] px-6 py-4 text-[10px] tracking-[0.15em] text-white"
                >
                  + ADD CATEGORY
                </button>

              </div>

              {loadingCategories ? (

                <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-8">
                  Loading categories...
                </div>

              ) : (

                <div className="grid gap-8 md:grid-cols-2">

                  {[
                    "women",
                    "men",
                  ].map(
                    (section) => {

                      const sectionCategories =
                        categories.filter(
                          (category) =>
                            category.section.toLowerCase() ===
                            section
                        );

                      return (
                        <div
                          key={section}
                          className="border border-[#c9a96e]/30 bg-[#fffdf9] p-6"
                        >

                          <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                            {section.toUpperCase()}
                          </p>

                          <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl">
                            {section ===
                            "women"
                              ? "Women's Categories"
                              : "Men's Categories"}
                          </h3>

                          <div className="mt-5 space-y-3">

                            {sectionCategories.map(
                              (category) => {

                                const count =
                                  products.filter(
                                    (product) =>
                                      product.category_id ===
                                      category.id
                                  ).length;

                                return (
                                  <div
                                    key={category.id}
                                    className="flex items-center justify-between border border-[#eee5d8] p-4"
                                  >

                                    <div>

                                      <p className="font-[var(--font-cormorant)] text-xl">
                                        {
                                          category.name
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-[#81786a]">
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
                                      className="text-xs text-red-700 hover:underline"
                                    >
                                      DELETE
                                    </button>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>
          )}

          {/* ==================================================
              ORDERS
          ================================================== */}

          {activeTab ===
            "orders" && (
            <div>

              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                    SALES
                  </p>

                  <h2 className="mt-2 font-[var(--font-cormorant)] text-5xl">
                    Orders
                  </h2>

                  <p className="mt-2 text-sm text-[#81786a]">
                    {orders.length}{" "}
                    order
                    {orders.length ===
                    1
                      ? ""
                      : "s"} received
                  </p>

                </div>

                <button
                  onClick={
                    loadOrders
                  }
                  className="border border-[#c9a96e]/50 px-5 py-4 text-[10px] tracking-[0.15em] text-[#8c7044]"
                >
                  REFRESH ORDERS
                </button>

              </div>

              {loadingOrders ? (

                <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-12 text-center">
                  Loading orders...
                </div>

              ) : orders.length ===
                0 ? (

                <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-12 text-center">

                  <p className="font-[var(--font-cormorant)] text-3xl">
                    No orders yet.
                  </p>

                  <p className="mt-3 text-sm text-[#81786a]">
                    Customer orders will appear here after checkout.
                  </p>

                </div>

              ) : (

                <div className="space-y-6">

                  {orders.map(
                    (order) => (

                      <div
                        key={order.id}
                        className="border border-[#c9a96e]/30 bg-[#fffdf9] p-7"
                      >

                        <div className="flex flex-col gap-4 border-b border-[#c9a96e]/20 pb-6 lg:flex-row lg:items-start lg:justify-between">

                          <div>

                            <p className="text-[9px] tracking-[0.25em] text-[#b28a45]">
                              ORDER #
                              {order.id
                                .slice(
                                  0,
                                  8
                                )
                                .toUpperCase()}
                            </p>

                            <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl">
                              {order.product_name ||
                                "Unknown Product"}
                            </h3>

                            <p className="mt-2 text-xs text-[#81786a]">
                              {formatDate(
                                order.created_at
                              )}
                            </p>

                          </div>

                          <p className="font-[var(--font-cormorant)] text-3xl text-[#b28a45]">
                            Rs.{" "}
                            {formatPrice(
                              order.amount
                            )}
                          </p>

                        </div>

                        <div className="grid gap-8 py-7 md:grid-cols-2">

                          <div>

                            <p className="text-[9px] tracking-[0.25em] text-[#b28a45]">
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

                              <p className="leading-6">
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

                            <p className="text-[9px] tracking-[0.25em] text-[#b28a45]">
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

                        <div className="border-t border-[#c9a96e]/20 pt-6">

                          <div className="grid gap-5 md:grid-cols-2">

                            <div>

                              <label className="mb-2 block text-[9px] tracking-[0.18em] text-[#756c60]">
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
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="w-full border border-[#c9a96e]/40 bg-[#fcfaf6] px-4 py-3 text-sm"
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

                              <label className="mb-2 block text-[9px] tracking-[0.18em] text-[#756c60]">
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
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="w-full border border-[#c9a96e]/40 bg-[#fcfaf6] px-4 py-3 text-sm"
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

                      </div>
                    )
                  )}

                </div>

              )}

            </div>
          )}

          {/* ==================================================
              REVIEWS
          ================================================== */}

          {activeTab ===
            "reviews" && (
            <div>

              <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                CUSTOMER FEEDBACK
              </p>

              <h2 className="mt-2 font-[var(--font-cormorant)] text-5xl">
                Reviews
              </h2>

              <div className="mt-8 border border-[#c9a96e]/30 bg-[#fffdf9] p-8">

                <p className="font-[var(--font-cormorant)] text-2xl">
                  No reviews yet.
                </p>

                <p className="mt-2 text-sm text-[#81786a]">
                  Customer reviews and complaints will appear here.
                </p>

              </div>

            </div>
          )}

        </section>

      </div>

      {/* ==================================================
          CATEGORY MODAL
      ================================================== */}

      {showCategoryModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6">

          <div className="w-full max-w-md border border-[#c9a96e]/40 bg-[#fffdf9] p-8 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[9px] tracking-[0.3em] text-[#b28a45]">
                  AHN COLLECTION
                </p>

                <h2 className="mt-2 font-[var(--font-cormorant)] text-4xl">
                  Add Category
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCategoryModal(
                    false
                  )
                }
                className="text-2xl text-[#81786a]"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                addCategory
              }
              className="mt-8 space-y-6"
            >

              <div>

                <label className="mb-2 block text-[9px] tracking-[0.18em] text-[#756c60]">
                  CATEGORY NAME
                </label>

                <input
                  required
                  value={
                    newCategoryName
                  }
                  onChange={(event) =>
                    setNewCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bridal Couture"
                  className="w-full border border-[#d9cdb9] bg-[#fcfaf6] px-4 py-4 text-sm"
                />

              </div>

              <div>

                <label className="mb-2 block text-[9px] tracking-[0.18em] text-[#756c60]">
                  COLLECTION
                </label>

                <select
                  value={
                    newCategorySection
                  }
                  onChange={(event) =>
                    setNewCategorySection(
                      event.target.value
                    )
                  }
                  className="w-full border border-[#d9cdb9] bg-[#fcfaf6] px-4 py-4 text-sm"
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
                  className="flex-1 border border-[#c9a96e]/50 py-4 text-[10px] tracking-[0.15em] text-[#8c7044]"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={
                    savingCategory
                  }
                  className="flex-1 bg-[#b28a45] py-4 text-[10px] tracking-[0.15em] text-white disabled:opacity-60"
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

    </main>
  );
}