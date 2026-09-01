"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

// ==================================================
// PAYMENT DETAILS
// REPLACE THESE WITH YOUR REAL DETAILS
// ==================================================

const JAZZCASH_NUMBER =
  "0300 8661317";

const BANK_NAME =
  "N/A";

const BANK_ACCOUNT_TITLE =
  "N/A";

const BANK_ACCOUNT_NUMBER =
  "N/A";

const BANK_IBAN =
  "N/A";

// ==================================================

type PaymentMethod =
  | "COD"
  | "JAZZCASH"
  | "BANK";

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
};

type FormState = {
  name: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  size: string;
  color: string;
};

function CheckoutContent() {
  const searchParams =
    useSearchParams();

  const productId =
    searchParams.get("product");

  const urlSize =
    searchParams.get("size") || "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [categoryName, setCategoryName] =
    useState("COLLECTION");

  const [loading, setLoading] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [payment, setPayment] =
    useState<PaymentMethod>("COD");

  const [form, setForm] =
    useState<FormState>({
      name: "",
      phone: "",
      whatsapp: "",
      city: "",
      address: "",
      size: urlSize,
      color: "",
    });

  // ==================================================
  // LOAD PRODUCT
  // ==================================================

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("");

      if (!productId) {
        setError(
          "No product was selected."
        );
        setLoading(false);
        return;
      }

      const {
        data,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active"
        )
        .eq("id", productId)
        .eq("active", true)
        .single();

      if (productError || !data) {
        console.error(
          "Checkout product error:",
          productError
        );

        setError(
          productError?.message ||
            "Product could not be found."
        );

        setLoading(false);
        return;
      }

      const loadedProduct =
        data as Product;

      setProduct(
        loadedProduct
      );

      if (
        !urlSize &&
        loadedProduct.sizes &&
        loadedProduct.sizes.length > 0
      ) {
        setForm((current) => ({
          ...current,
          size:
            loadedProduct.sizes?.[0] ||
            "",
        }));
      }

      if (loadedProduct.category_id) {
        const {
          data: category,
        } = await supabase
          .from("categories")
          .select(
            "id, name, section"
          )
          .eq(
            "id",
            loadedProduct.category_id
          )
          .single();

        if (category) {
          setCategoryName(
            category.name
          );
        }
      }

      setLoading(false);
    }

    loadProduct();
  }, [productId, urlSize]);

  // ==================================================
  // FIELD UPDATE
  // ==================================================

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // ==================================================
  // PLACE ORDER
  // ==================================================

  async function placeOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!product) {
      setError(
        "Product information is missing."
      );
      return;
    }

    if (product.stock <= 0) {
      setError(
        "Sorry, this product is out of stock."
      );
      return;
    }

    if (
      product.sizes &&
      product.sizes.length > 0 &&
      !form.size
    ) {
      setError(
        "Please select a size."
      );
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (!form.city.trim()) {
      setError(
        "Please enter your city."
      );
      return;
    }

    if (!form.address.trim()) {
      setError(
        "Please enter your complete address."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "place_order_and_reduce_stock",
        {
          p_product_id:
            product.id,

          p_product_name:
            product.name,

          p_customer_name:
            form.name.trim(),

          p_customer_phone:
            form.phone.trim(),

          p_customer_whatsapp:
            form.whatsapp.trim() ||
            null,

          p_customer_city:
            form.city.trim(),

          p_customer_address:
            form.address.trim(),

          p_product_size:
            form.size || null,

          p_product_color:
            form.color.trim() ||
            null,

          p_payment_method:
            payment,

          p_amount:
            Number(product.price),
        }
      );

      if (rpcError) {
        console.error(
          "ORDER RPC ERROR:",
          rpcError
        );

        throw new Error(
          rpcError.message
        );
      }

      if (!data?.success) {
        throw new Error(
          "The order could not be created."
        );
      }

      setSuccess(true);

    } catch (err) {
      console.error(
        "FINAL ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing the order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  // ==================================================
  // SUCCESS
  // ==================================================

  if (success && product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6] px-6">

        <div className="w-full max-w-xl border border-[#c9a96e]/40 bg-[#fffdf9] px-8 py-16 text-center shadow-sm">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
            AHN COLLECTION
          </p>

          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e] text-2xl text-[#b28a45]">
            ✓
          </div>

          <h1 className="mt-8 font-[var(--font-cormorant)] text-5xl">
            Order Received
          </h1>

          <div className="mx-auto mt-6 h-px w-16 bg-[#c9a96e]" />

          <p className="mx-auto mt-6 max-w-md font-[var(--font-cormorant)] text-xl leading-8 text-[#756c60]">
            Thank you, {form.name}.
            <br />
            Your order for{" "}
            <span className="text-[#b28a45]">
              {product.name}
            </span>{" "}
            has been received.
          </p>

          <p className="mt-6 font-[var(--font-cinzel)] text-xs tracking-widest text-[#8c7044]">
            PAYMENT:{" "}
            {payment === "COD"
              ? "CASH ON DELIVERY"
              : payment === "JAZZCASH"
              ? "JAZZCASH"
              : "BANK TRANSFER"}
          </p>

          <p className="mt-3 font-[var(--font-cormorant)] text-lg text-[#81786a]">
            Total: Rs.{" "}
            {product.price.toLocaleString(
              "en-PK"
            )}
          </p>

          <Link
            href="/"
            className="mt-10 inline-block bg-[#b28a45] px-10 py-4 font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-white transition hover:bg-[#967238]"
          >
            RETURN TO AHN COLLECTION
          </Link>

        </div>

      </main>
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6]">

        <p className="font-[var(--font-cormorant)] text-3xl">
          Preparing checkout...
        </p>

      </main>
    );
  }

  // ==================================================
  // PRODUCT NOT FOUND
  // ==================================================

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6] px-6">

        <div className="max-w-xl text-center">

          <h1 className="font-[var(--font-cormorant)] text-5xl">
            Checkout unavailable
          </h1>

          <p className="mt-5 text-lg text-[#81786a]">
            {error}
          </p>

          <Link
            href="/"
            className="mt-8 inline-block bg-[#b28a45] px-8 py-4 text-xs tracking-[0.2em] text-white"
          >
            RETURN TO COLLECTION
          </Link>

        </div>

      </main>
    );
  }

  const productImage =
    product.images?.[0] || "";

  const sizes =
    product.sizes || [];

  const outOfStock =
    product.stock <= 0;

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#30291f]">

      {/* HEADER */}

      <header className="border-b border-[#c9a96e]/30 bg-[#fffdf9]">

        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">

          <Link
            href="/"
            className="text-center"
          >

            <h1 className="font-[var(--font-cinzel)] text-3xl tracking-[0.25em] text-[#b28a45]">
              AHN
            </h1>

            <div className="mx-auto mt-1 h-px w-12 bg-[#c9a96e]" />

            <p className="mt-1 font-[var(--font-cinzel)] text-[8px] tracking-[0.45em] text-[#75664e]">
              COLLECTION
            </p>

          </Link>

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.25em] text-[#8c7044]">
            CHECKOUT
          </p>

        </div>

      </header>

      {/* CHECKOUT */}

      <section className="mx-auto max-w-5xl px-6 py-14">

        <div className="mb-12 text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
            COMPLETE YOUR ORDER
          </p>

          <h1 className="mt-4 font-[var(--font-cormorant)] text-6xl">
            Checkout
          </h1>

          <div className="mx-auto mt-5 h-px w-16 bg-[#c9a96e]" />

        </div>

        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={placeOrder}
        >

          <div className="grid gap-10 lg:grid-cols-2">

            {/* CUSTOMER */}

            <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-7">

              <h2 className="font-[var(--font-cormorant)] text-3xl">
                Customer Details
              </h2>

              <div className="mt-7 space-y-5">

                <div>
                  <label className="label">
                    FULL NAME
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Your full name"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    PHONE NUMBER
                  </label>

                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="03XX XXXXXXX"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    WHATSAPP NUMBER
                  </label>

                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) =>
                      updateField(
                        "whatsapp",
                        e.target.value
                      )
                    }
                    placeholder="03XX XXXXXXX"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    CITY
                  </label>

                  <input
                    required
                    value={form.city}
                    onChange={(e) =>
                      updateField(
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Your city"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    COMPLETE DELIVERY ADDRESS
                  </label>

                  <textarea
                    required
                    value={form.address}
                    onChange={(e) =>
                      updateField(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="House number, street, area..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>

              </div>

            </div>

            {/* ORDER SIDE */}

            <div>

              {/* PRODUCT */}

              <div className="border border-[#c9a96e]/30 bg-[#fffdf9] p-7">

                <h2 className="font-[var(--font-cormorant)] text-3xl">
                  Your Article
                </h2>

                <div className="mt-6 flex gap-5 border-t border-[#c9a96e]/20 pt-6">

                  <div className="h-32 w-24 overflow-hidden bg-[#eee9df]">

                    {product.reel_url ? (

                      <video
                        src={
                          product.reel_url
                        }
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />

                    ) : productImage ? (

                      <img
                        src={
                          productImage
                        }
                        alt={
                          product.name
                        }
                        className="h-full w-full object-cover"
                      />

                    ) : null}

                  </div>

                  <div>

                    <p className="font-[var(--font-cinzel)] text-[10px] tracking-widest text-[#b28a45]">
                      {categoryName}
                    </p>

                    <h3 className="mt-2 font-[var(--font-cormorant)] text-2xl">
                      {product.name}
                    </h3>

                    <p className="mt-2 font-[var(--font-cormorant)] text-xl text-[#b28a45]">
                      Rs.{" "}
                      {product.price.toLocaleString(
                        "en-PK"
                      )}
                    </p>

                  </div>

                </div>

                {/* SIZE */}

                {sizes.length > 0 && (

                  <div className="mt-7">

                    <label className="label">
                      SIZE
                    </label>

                    <select
                      required
                      value={
                        form.size
                      }
                      onChange={(e) =>
                        updateField(
                          "size",
                          e.target.value
                        )
                      }
                      className="input"
                    >

                      <option value="">
                        Select size
                      </option>

                      {sizes.map(
                        (size) => (
                          <option
                            key={size}
                            value={size}
                          >
                            {size}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                )}

                {/* COLOR */}

                <div className="mt-5">

                  <label className="label">
                    COLOR
                  </label>

                  <input
                    value={form.color}
                    onChange={(e) =>
                      updateField(
                        "color",
                        e.target.value
                      )
                    }
                    className="input"
                    placeholder="e.g. Ivory, White, Black"
                  />

                </div>

                <div className="mt-5 border border-[#eee5d8] bg-[#fcfaf6] p-4 text-sm">

                  <p className="text-[#81786a]">
                    Stock available
                  </p>

                  <p className="mt-1 font-medium">
                    {product.stock}
                  </p>

                </div>

              </div>

              {/* PAYMENT */}

              <div className="mt-6 border border-[#c9a96e]/30 bg-[#fffdf9] p-7">

                <h2 className="font-[var(--font-cormorant)] text-3xl">
                  Payment Method
                </h2>

                <div className="mt-6 space-y-3">

                  {/* COD */}

                  <button
                    type="button"
                    onClick={() =>
                      setPayment(
                        "COD"
                      )
                    }
                    className={`w-full border p-5 text-left transition ${
                      payment ===
                      "COD"
                        ? "border-[#b28a45] bg-[#b28a45]/5"
                        : "border-[#c9a96e]/30"
                    }`}
                  >

                    <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                      CASH ON DELIVERY
                    </p>

                    <p className="mt-1 text-sm text-[#81786a]">
                      Pay when your order arrives.
                    </p>

                  </button>

                  {/* JAZZCASH */}

                  <button
                    type="button"
                    onClick={() =>
                      setPayment(
                        "JAZZCASH"
                      )
                    }
                    className={`w-full border p-5 text-left transition ${
                      payment ===
                      "JAZZCASH"
                        ? "border-[#b28a45] bg-[#b28a45]/5"
                        : "border-[#c9a96e]/30"
                    }`}
                  >

                    <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                      JAZZCASH
                    </p>

                    <p className="mt-1 text-sm text-[#81786a]">
                      Pay through JazzCash.
                    </p>

                  </button>

                  {/* BANK */}

                  <button
                    type="button"
                    onClick={() =>
                      setPayment(
                        "BANK"
                      )
                    }
                    className={`w-full border p-5 text-left transition ${
                      payment ===
                      "BANK"
                        ? "border-[#b28a45] bg-[#b28a45]/5"
                        : "border-[#c9a96e]/30"
                    }`}
                  >

                    <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                      BANK TRANSFER
                    </p>

                    <p className="mt-1 text-sm text-[#81786a]">
                      Transfer directly to our bank account.
                    </p>

                  </button>

                </div>

                {/* ==================================================
                    JAZZCASH DETAILS
                ================================================== */}

                {payment ===
                  "JAZZCASH" && (

                  <div className="mt-5 border border-[#c9a96e]/30 bg-[#fcfaf6] p-5">

                    <p className="font-[var(--font-cinzel)] text-xs tracking-widest text-[#b28a45]">
                      JAZZCASH PAYMENT DETAILS
                    </p>

                    <div className="mt-4">

                      <p className="text-xs uppercase tracking-wider text-[#81786a]">
                        JAZZCASH NUMBER
                      </p>

                      <p className="mt-1 font-[var(--font-cormorant)] text-2xl">
                        {JAZZCASH_NUMBER}
                      </p>

                    </div>

                    <div className="mt-5 border-t border-[#e5dccd] pt-4">

                      <p className="font-[var(--font-cormorant)] text-base leading-7 text-[#756c60]">
                        After making the payment, please keep your transaction screenshot.
                        <br />
                        <strong className="text-[#30291f]">
                          When you are contacted by us, you have to send the screenshot of the cash transfer.
                        </strong>
                      </p>

                    </div>

                  </div>

                )}

                {/* ==================================================
                    BANK DETAILS
                ================================================== */}

                {payment ===
                  "BANK" && (

                  <div className="mt-5 border border-[#c9a96e]/30 bg-[#fcfaf6] p-5">

                    <p className="font-[var(--font-cinzel)] text-xs tracking-widest text-[#b28a45]">
                      BANK TRANSFER DETAILS
                    </p>

                    <div className="mt-4 space-y-4">

                      <div>

                        <p className="text-xs uppercase tracking-wider text-[#81786a]">
                          BANK
                        </p>

                        <p className="mt-1 font-[var(--font-cormorant)] text-xl">
                          {BANK_NAME}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs uppercase tracking-wider text-[#81786a]">
                          ACCOUNT TITLE
                        </p>

                        <p className="mt-1 font-[var(--font-cormorant)] text-xl">
                          {BANK_ACCOUNT_TITLE}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs uppercase tracking-wider text-[#81786a]">
                          ACCOUNT NUMBER
                        </p>

                        <p className="mt-1 break-all font-[var(--font-cormorant)] text-xl">
                          {
                            BANK_ACCOUNT_NUMBER
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs uppercase tracking-wider text-[#81786a]">
                          IBAN
                        </p>

                        <p className="mt-1 break-all font-[var(--font-cormorant)] text-xl">
                          {BANK_IBAN}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 border-t border-[#e5dccd] pt-4">

                      <p className="font-[var(--font-cormorant)] text-base leading-7 text-[#756c60]">
                        After making the payment, please keep your transaction screenshot.
                        <br />
                        <strong className="text-[#30291f]">
                          When you are contacted by us, you have to send the screenshot of the cash transfer.
                        </strong>
                      </p>

                    </div>

                  </div>

                )}

              </div>

              {/* TOTAL */}

              <div className="mt-6 border border-[#c9a96e]/30 bg-[#fffdf9] p-7">

                <div className="flex items-center justify-between">

                  <span className="font-[var(--font-cormorant)] text-2xl">
                    Total
                  </span>

                  <span className="font-[var(--font-cormorant)] text-3xl text-[#b28a45]">
                    Rs.{" "}
                    {product.price.toLocaleString(
                      "en-PK"
                    )}
                  </span>

                </div>

                <button
                  type="submit"
                  disabled={
                    placingOrder ||
                    outOfStock
                  }
                  className="mt-7 w-full bg-[#b28a45] py-5 font-[var(--font-cinzel)] text-xs tracking-[0.25em] text-white transition hover:bg-[#967238] disabled:cursor-not-allowed disabled:bg-[#bdb5a9]"
                >
                  {outOfStock
                    ? "OUT OF STOCK"
                    : placingOrder
                    ? "PLACING ORDER..."
                    : "PLACE ORDER"}
                </button>

              </div>

            </div>

          </div>

        </form>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-[#c9a96e]/30 bg-[#fffdf9] px-6 py-12 text-center">

        <h2 className="font-[var(--font-cinzel)] text-xl tracking-[0.35em] text-[#b28a45]">
          AHN COLLECTION
        </h2>

        <p className="mt-4 font-[var(--font-cormorant)] italic text-[#81786a]">
          Elegance in every thread.
        </p>

      </footer>

      <style jsx global>{`
        .label {
          display: block;
          margin-bottom: 8px;
          font-family: var(--font-cinzel);
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #756c60;
        }

        .input {
          width: 100%;
          border: 1px solid rgba(201, 169, 110, 0.4);
          background: #fcfaf6;
          padding: 14px 15px;
          outline: none;
          font-family: var(--font-cormorant);
          font-size: 18px;
          color: #30291f;
        }

        .input:focus {
          border-color: #b28a45;
        }
      `}</style>

    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6]">
          <p className="font-[var(--font-cormorant)] text-3xl">
            Preparing checkout...
          </p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}