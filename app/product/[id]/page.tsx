"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
};

export default function ProductPage() {
  const params = useParams();

  const productId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [product, setProduct] =
    useState<Product | null>(null);

  const [category, setCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedSize, setSelectedSize] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState(0);

  const [muted, setMuted] =
    useState(true);

  const reelRef =
    useRef<HTMLVideoElement | null>(null);

  // ==================================================
  // LOAD PRODUCT
  // ==================================================

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setError("Invalid product ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active, created_at"
        )
        .eq("id", productId)
        .eq("active", true)
        .single();

      if (productError || !productData) {
        console.error(
          "Product load error:",
          productError
        );

        setError(
          productError?.message ||
            "Product not found."
        );

        setLoading(false);
        return;
      }

      const loadedProduct =
        productData as Product;

      setProduct(loadedProduct);

      if (
        Array.isArray(loadedProduct.sizes) &&
        loadedProduct.sizes.length > 0
      ) {
        setSelectedSize(
          loadedProduct.sizes[0]
        );
      }

      if (loadedProduct.category_id) {
        const {
          data: categoryData,
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

        if (categoryData) {
          setCategory(
            categoryData as Category
          );
        }
      }

      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  // ==================================================
  // UNMUTE
  // ==================================================

  function toggleMute() {
    const video = reelRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setMuted(video.muted);

    if (video.paused) {
      video.play().catch(() => {});
    }
  }

  // ==================================================
  // SHARE
  // ==================================================

  async function shareProduct() {
    const url =
      window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            product?.name ||
            "AHN Collection",
          text:
            `Check out ${product?.name || "this product"} from AHN Collection.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Product link copied!"
        );
      }
    } catch {
      // User cancelled share.
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6]">

        <div className="text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
            AHN COLLECTION
          </p>

          <h1 className="mt-5 font-[var(--font-cormorant)] text-4xl">
            Loading article...
          </h1>

        </div>

      </main>
    );
  }

  // ==================================================
  // NOT FOUND
  // ==================================================

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfaf6] px-6">

        <div className="max-w-xl text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
            AHN COLLECTION
          </p>

          <h1 className="mt-6 font-[var(--font-cormorant)] text-5xl">
            Product Not Found
          </h1>

          <p className="mt-5 font-[var(--font-cormorant)] text-xl text-[#81786a]">
            {error ||
              "The article you are looking for does not exist."}
          </p>

          <Link
            href="/"
            className="mt-8 inline-block bg-[#b28a45] px-8 py-4 font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-white transition hover:bg-[#967238]"
          >
            RETURN TO COLLECTION
          </Link>

        </div>

      </main>
    );
  }

  const images =
    Array.isArray(product.images)
      ? product.images
      : [];

  const sizes =
    Array.isArray(product.sizes)
      ? product.sizes
      : [];

  const currentImage =
    images[selectedImage] ||
    images[0] ||
    "";

  const outOfStock =
    product.stock <= 0;

  const sectionLabel =
    product.section
      ? product.section.toUpperCase()
      : "COLLECTION";

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#30291f]">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="border-b border-[#c9a96e]/30 bg-[#fffdf9]">

        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">

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

          <nav className="hidden items-center gap-10 md:flex">

            <Link
              href="/"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] hover:text-[#b28a45]"
            >
              WOMEN
            </Link>

            <Link
              href="/"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] hover:text-[#b28a45]"
            >
              MEN
            </Link>

            <Link
              href="/#collections"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] hover:text-[#b28a45]"
            >
              COLLECTIONS
            </Link>

            <Link
              href="/#reels"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] hover:text-[#b28a45]"
            >
              REELS
            </Link>

          </nav>

          <div className="flex items-center gap-5 text-[#8c7044]">

            <button
              type="button"
              className="text-xl hover:text-[#b28a45]"
            >
              ⌕
            </button>

            <button
              type="button"
              className="text-xl hover:text-[#b28a45]"
            >
              ♡
            </button>

            <Link
              href={`/checkout?product=${product.id}`}
              className="text-xl hover:text-[#b28a45]"
            >
              ♧
            </Link>

          </div>

        </div>

      </header>

      {/* ==================================================
          PRODUCT
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-14">

        <Link
          href="/"
          className="mb-10 inline-block font-[var(--font-cinzel)] text-[10px] tracking-[0.2em] text-[#8c7044] hover:text-[#b28a45]"
        >
          ← BACK TO COLLECTION
        </Link>

        <div className="grid gap-14 lg:grid-cols-2">

          {/* ==================================================
              MEDIA
          ================================================== */}

          <div>

            {/* MAIN IMAGE / REEL */}

            <div className="relative overflow-hidden border border-[#c9a96e]/30 bg-[#eee9df]">

              {product.reel_url ? (

                <div className="relative">

                  <video
                    ref={reelRef}
                    src={product.reel_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    className="block aspect-[3/4] w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur transition hover:bg-[#b28a45]"
                    title={
                      muted
                        ? "Unmute"
                        : "Mute"
                    }
                  >
                    {muted
                      ? "🔇"
                      : "🔊"}
                  </button>

                  <div className="absolute bottom-5 left-5">

                    <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.3em] text-white">
                      AHN MOTION
                    </p>

                  </div>

                </div>

              ) : currentImage ? (

                <img
                  src={currentImage}
                  alt={product.name}
                  className="block aspect-[3/4] w-full object-cover"
                />

              ) : (

                <div className="flex aspect-[3/4] items-center justify-center text-xs tracking-widest text-[#9a8e7c]">
                  NO MEDIA
                </div>

              )}

            </div>

            {/* THUMBNAILS */}

            {images.length > 1 && (

              <div className="mt-4 grid grid-cols-4 gap-3">

                {images.map(
                  (image, index) => (

                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          index
                        )
                      }
                      className={`overflow-hidden border transition ${
                        selectedImage === index
                          ? "border-[#b28a45]"
                          : "border-[#c9a96e]/30"
                      }`}
                    >

                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />

                    </button>

                  )
                )}

              </div>

            )}

          </div>

          {/* ==================================================
              PRODUCT INFO
          ================================================== */}

          <div className="lg:sticky lg:top-10 lg:h-fit">

            {/* CATEGORY */}

            <p className="font-[var(--font-cinzel)] text-xs tracking-[0.35em] text-[#b28a45]">
              {sectionLabel}
              {" · "}
              {category?.name ||
                "COLLECTION"}
            </p>

            {/* NAME */}

            <h1 className="mt-5 font-[var(--font-cormorant)] text-6xl leading-none text-[#30291f]">
              {product.name}
            </h1>

            <div className="my-7 h-px w-16 bg-[#c9a96e]" />

            {/* PRICE */}

            <p className="font-[var(--font-cormorant)] text-3xl text-[#b28a45]">
              Rs.{" "}
              {product.price.toLocaleString(
                "en-PK"
              )}
            </p>

            {/* STOCK */}

            <p
              className={`mt-3 font-[var(--font-cinzel)] text-[9px] tracking-[0.2em] ${
                outOfStock
                  ? "text-red-700"
                  : "text-green-700"
              }`}
            >
              {outOfStock
                ? "OUT OF STOCK"
                : `${product.stock} IN STOCK`}
            </p>

            {/* DESCRIPTION */}

            {product.description && (

              <p className="mt-7 font-[var(--font-cormorant)] text-xl leading-8 text-[#756c60]">
                {product.description}
              </p>

            )}

            {/* SIZE */}

            {sizes.length > 0 && (

              <div className="mt-10">

                <div className="mb-4 flex items-center justify-between">

                  <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                    SELECT SIZE
                  </p>

                  <span className="text-xs text-[#81786a]">
                    {selectedSize ||
                      "Select"}
                  </span>

                </div>

                <div className="flex flex-wrap gap-3">

                  {sizes.map(
                    (size) => (

                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSelectedSize(
                            size
                          )
                        }
                        className={`border px-6 py-3 font-[var(--font-cinzel)] text-xs transition ${
                          selectedSize === size
                            ? "border-[#b28a45] bg-[#b28a45] text-white"
                            : "border-[#c9a96e]/50 hover:border-[#b28a45] hover:bg-[#b28a45] hover:text-white"
                        }`}
                      >
                        {size}
                      </button>

                    )
                  )}

                </div>

              </div>

            )}

            {/* BUY NOW */}

            <Link
              href={
                outOfStock
                  ? "#"
                  : `/checkout?product=${product.id}${
                      selectedSize
                        ? `&size=${encodeURIComponent(selectedSize)}`
                        : ""
                    }`
              }
              onClick={(event) => {
                if (outOfStock) {
                  event.preventDefault();
                }

                if (
                  sizes.length > 0 &&
                  !selectedSize
                ) {
                  event.preventDefault();

                  alert(
                    "Please select a size first."
                  );
                }
              }}
              className={`mt-10 block w-full py-5 text-center font-[var(--font-cinzel)] text-xs tracking-[0.25em] transition ${
                outOfStock
                  ? "cursor-not-allowed bg-[#bdb5a9] text-white"
                  : "bg-[#b28a45] text-white hover:bg-[#967238]"
              }`}
            >
              {outOfStock
                ? "OUT OF STOCK"
                : "BUY NOW"}
            </Link>

            {/* ACTION ROW */}

            <div className="mt-4 grid grid-cols-2 gap-4">

              <button
                type="button"
                className="border border-[#b28a45] py-5 font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#b28a45] transition hover:bg-[#b28a45] hover:text-white"
              >
                ♡ ADD TO WISHLIST
              </button>

              <button
                type="button"
                onClick={shareProduct}
                className="border border-[#b28a45] py-5 font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#b28a45] transition hover:bg-[#b28a45] hover:text-white"
              >
                ↗ SHARE
              </button>

            </div>

            {/* INFORMATION */}

            <div className="mt-10 border-t border-[#c9a96e]/30">

              <div className="border-b border-[#c9a96e]/20 py-5">

                <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                  DELIVERY
                </p>

                <p className="mt-2 font-[var(--font-cormorant)] text-lg text-[#756c60]">
                  Delivery available across Pakistan.
                </p>

              </div>

              <div className="border-b border-[#c9a96e]/20 py-5">

                <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                  PAYMENT
                </p>

                <p className="mt-2 font-[var(--font-cormorant)] text-lg text-[#756c60]">
                  Cash on Delivery, JazzCash and Bank Transfer.
                </p>

              </div>

              <div className="border-b border-[#c9a96e]/20 py-5">

                <p className="font-[var(--font-cinzel)] text-xs tracking-widest">
                  CUSTOMER CARE
                </p>

                <p className="mt-2 font-[var(--font-cormorant)] text-lg text-[#756c60]">
                  Contact AHN Collection for questions,
                  returns and assistance.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="border-t border-[#c9a96e]/30 bg-[#fffdf9] px-6 py-14 text-center">

        <h2 className="font-[var(--font-cinzel)] text-xl tracking-[0.35em] text-[#b28a45]">
          AHN COLLECTION
        </h2>

        <div className="mx-auto my-5 h-px w-16 bg-[#c9a96e]" />

        <p className="font-[var(--font-cormorant)] text-lg italic text-[#81786a]">
          Elegance in every thread.
        </p>

        <p className="mt-5 font-[var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#9b9182]">
          © 2026 AHN COLLECTION — ALL RIGHTS RESERVED
        </p>

      </footer>

    </main>
  );
}