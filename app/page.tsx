"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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
};

function getDiscount(
  price: number,
  originalPrice: number | null
) {
  if (
    !originalPrice ||
    originalPrice <= price ||
    originalPrice <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((originalPrice - price) /
      originalPrice) *
      100
  );
}

function ReelCard({
  product,
}: {
  product: Product;
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [muted, setMuted] =
    useState(true);

  function toggleMute() {
    const video =
      videoRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setMuted(video.muted);

    if (video.paused) {
      video.play().catch(() => {});
    }
  }

  return (
    <article className="group w-[260px] shrink-0 overflow-hidden border border-[#e5e3de] bg-white sm:w-[300px]">

      <div className="relative aspect-[9/16] overflow-hidden bg-black">

        <video
          ref={videoRef}
          src={product.reel_url || ""}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute left-5 top-5">
          <p className="ahn-label text-white">
            AHN COLLECTION
          </p>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/40 text-sm text-white backdrop-blur hover:bg-white hover:text-black"
        >
          {muted ? "🔇" : "🔊"}
        </button>

        <div className="absolute bottom-5 left-5 right-5">

          <p className="ahn-label text-[#e8d3a5]">
            REEL
          </p>

          <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl text-white">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-3">

            <span className="text-lg text-white">
              Rs.{" "}
              {product.price.toLocaleString(
                "en-PK"
              )}
            </span>

            {getDiscount(
              product.price,
              product.original_price
            ) > 0 && (
              <>
                <span className="text-sm text-white/60 line-through">
                  Rs.{" "}
                  {product.original_price?.toLocaleString(
                    "en-PK"
                  )}
                </span>

                <span className="text-sm text-[#e8d3a5]">
                  -
                  {getDiscount(
                    product.price,
                    product.original_price
                  )}
                  %
                </span>
              </>
            )}

          </div>

        </div>

      </div>

      <Link
        href={`/product/${product.id}`}
        className="block py-4 text-center text-xs font-semibold tracking-[0.12em] text-[#181818] transition hover:bg-[#181818] hover:text-white"
      >
        VIEW PRODUCT
      </Link>

    </article>
  );
}

export default function Home() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showWishlist, setShowWishlist] =
    useState(false);

  const [wishlistIds, setWishlistIds] =
    useState<string[]>([]);

  const reelsScrollRef =
    useRef<HTMLDivElement | null>(null);

  const resetting =
    useRef(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "ahn_wishlist"
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "ahn_wishlist",
        JSON.stringify(wishlistIds)
      );
    } catch {}
  }, [wishlistIds]);

  function toggleWishlist(id: string) {
    setWishlistIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id
            )
          : [...current, id]
    );
  }

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        categoriesResponse,
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, description, price, original_price, category_id, section, images, reel_url, sizes, featured, active, created_at"
          )
          .eq("active", true)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select(
            "id, name, section"
          )
          .order("name", {
            ascending: true,
          }),
      ]);

      if (productsResponse.error) {
        console.error(
          productsResponse.error
        );

        setError(
          "Could not load the collection."
        );

        setLoading(false);
        return;
      }

      if (categoriesResponse.error) {
        console.error(
          categoriesResponse.error
        );

        setError(
          "Could not load categories."
        );

        setLoading(false);
        return;
      }

      setProducts(
        productsResponse.data || []
      );

      setCategories(
        categoriesResponse.data || []
      );

      setLoading(false);
    }

    loadStore();
  }, []);

  const categoryButtons =
    useMemo(() => {
      return [
        {
          key: "ALL",
          label: "ALL",
        },
        ...categories.map(
          (category) => ({
            key: category.id,
            label:
              category.name.toUpperCase(),
          })
        ),
        {
          key: "REELS",
          label: "REELS",
        },
      ];
    }, [categories]);

  const filteredProducts =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          if (
            selectedCategory ===
            "REELS"
          ) {
            return false;
          }

          if (
            selectedCategory !==
              "ALL" &&
            product.category_id !==
              selectedCategory
          ) {
            return false;
          }

          if (
            showWishlist &&
            !wishlistIds.includes(
              product.id
            )
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const categoryName =
            categories.find(
              (category) =>
                category.id ===
                product.category_id
            )?.name || "";

          return [
            product.name,
            product.description ||
              "",
            categoryName,
            product.section ||
              "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      products,
      categories,
      selectedCategory,
      searchQuery,
      showWishlist,
      wishlistIds,
    ]);

  const reelProducts =
    products.filter(
      (product) =>
        Boolean(product.reel_url)
    );

  const loopedReels = [
    ...reelProducts,
    ...reelProducts,
    ...reelProducts,
  ];

  function handleReelScroll() {
    const container =
      reelsScrollRef.current;

    if (
      !container ||
      resetting.current ||
      reelProducts.length === 0
    ) {
      return;
    }

    const setWidth =
      container.scrollWidth / 3;

    if (
      container.scrollLeft <
      setWidth * 0.4
    ) {
      resetting.current = true;
      container.scrollLeft +=
        setWidth;

      requestAnimationFrame(() => {
        resetting.current = false;
      });

      return;
    }

    if (
      container.scrollLeft >
      setWidth * 1.6
    ) {
      resetting.current = true;
      container.scrollLeft -=
        setWidth;

      requestAnimationFrame(() => {
        resetting.current = false;
      });
    }
  }

  useEffect(() => {
    const container =
      reelsScrollRef.current;

    if (
      !container ||
      reelProducts.length === 0
    ) {
      return;
    }

    container.scrollLeft =
      container.scrollWidth / 3;
  }, [reelProducts.length]);

  function shareProduct(
    product: Product
  ) {
    const url =
      `${window.location.origin}/product/${product.id}`;

    if (navigator.share) {
      navigator
        .share({
          title:
            product.name,
          text:
            `Check out ${product.name} from AHN Collection.`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() =>
          alert(
            "Product link copied!"
          )
        )
        .catch(() => {});
    }
  }

  function ProductCard({
    product,
  }: {
    product: Product;
  }) {
    const image =
      product.images?.[0] || "";

    const category =
      categories.find(
        (item) =>
          item.id ===
          product.category_id
      )?.name ||
      "COLLECTION";

    const wishlisted =
      wishlistIds.includes(
        product.id
      );

    const discount =
      getDiscount(
        product.price,
        product.original_price
      );

    return (
      <article className="ahn-product-card overflow-hidden border border-[#e5e3de] bg-white">

        <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f3]">

          {image ? (

            <img
              src={image}
              alt={product.name}
              className="ahn-product-image h-full w-full object-cover"
            />

          ) : product.reel_url ? (

            <video
              src={product.reel_url}
              autoPlay
              muted
              loop
              playsInline
              className="ahn-product-image h-full w-full object-cover"
            />

          ) : (

            <div className="flex h-full items-center justify-center text-xs text-[#999]">
              NO IMAGE
            </div>

          )}

          <button
            type="button"
            onClick={() =>
              toggleWishlist(
                product.id
              )
            }
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white text-lg shadow-sm ${
              wishlisted
                ? "border-[#181818] bg-[#181818] text-white"
                : "border-[#ddd] text-[#181818]"
            }`}
          >
            {wishlisted
              ? "♥"
              : "♡"}
          </button>

        </div>

        <div className="p-5">

          <p className="ahn-label text-[#a88952]">
            {category}
          </p>

          <h3 className="mt-2 text-xl font-medium">
            {product.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">

            <span className="text-lg font-medium text-[#ff4f1f]">
              Rs.{" "}
              {product.price.toLocaleString(
                "en-PK"
              )}
            </span>

            {discount > 0 && (
              <>
                <span className="text-sm text-[#999] line-through">
                  Rs.{" "}
                  {product.original_price?.toLocaleString(
                    "en-PK"
                  )}
                </span>

                <span className="text-sm text-[#666]">
                  -{discount}%
                </span>
              </>
            )}

          </div>

        </div>

        <div className="grid grid-cols-2 border-t border-[#e5e3de]">

          <button
            type="button"
            onClick={() =>
              shareProduct(product)
            }
            className="border-r border-[#e5e3de] py-4 text-xs font-semibold tracking-[0.12em] hover:bg-[#f5f5f3]"
          >
            SHARE
          </button>

          <Link
            href={`/product/${product.id}`}
            className="py-4 text-center text-xs font-semibold tracking-[0.12em] hover:bg-[#181818] hover:text-white"
          >
            VIEW PRODUCT
          </Link>

        </div>

      </article>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#181818]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#e5e3de] bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-9 w-9 items-center justify-center border border-[#a88952] text-sm font-semibold tracking-wider text-[#a88952]">
              AHN
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-semibold tracking-[0.14em]">
                AHN COLLECTION
              </p>

              <p className="text-[8px] tracking-[0.25em] text-[#888]">
                EST. 2026
              </p>

            </div>

          </Link>

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#women"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] hover:text-[#a88952]"
            >
              WOMEN
            </a>

            <a
              href="#men"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] hover:text-[#a88952]"
            >
              MEN
            </a>

            <a
              href="#reels"
              className="text-[11px] font-medium tracking-[0.14em] text-[#555] hover:text-[#a88952]"
            >
              REELS
            </a>

          </nav>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setSearchOpen(
                  (current) =>
                    !current
                )
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                searchOpen
                  ? "bg-[#181818] text-white"
                  : "hover:bg-[#f3f3f1]"
              }`}
              title="Search"
            >
              ⌕
            </button>

            <button
              type="button"
              onClick={() =>
                setShowWishlist(
                  (current) =>
                    !current
                )
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                showWishlist
                  ? "bg-[#181818] text-white"
                  : "hover:bg-[#f3f3f1]"
              }`}
              title="Wishlist"
            >
              {showWishlist
                ? "♥"
                : "♡"}
            </button>

            <Link
              href="/checkout"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg hover:bg-[#f3f3f1]"
              title="Checkout"
            >
              ♧
            </Link>

          </div>

        </div>

        {searchOpen && (

          <div className="border-t border-[#e5e3de] bg-white px-6 py-4">

            <div className="mx-auto max-w-3xl">

              <input
                autoFocus
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search products, categories..."
                className="ahn-input"
              />

            </div>

          </div>

        )}

      </header>

      {/* HERO */}

      <section className="border-b border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center">

        <p className="ahn-label text-[#a88952]">
          AHN COLLECTION
        </p>

        <h1 className="ahn-heading mx-auto mt-6 max-w-4xl text-6xl md:text-8xl">
          Modern elegance,
          <br />
          <span className="text-[#a88952]">
            thoughtfully made.
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-[#6f6f6b]">
          Discover carefully curated pieces
          designed around simplicity, quality
          and timeless style.
        </p>

      </section>

      {/* COLLECTION */}

      <section
        id="women"
        className="mx-auto max-w-7xl px-6 py-20"
      >

        <div className="mb-10">

          <p className="ahn-label text-[#a88952]">
            DISCOVER
          </p>

          <h2
            id="collections"
            className="ahn-heading mt-3 text-4xl md:text-5xl"
          >
            The Collection
          </h2>

        </div>

        <div className="mb-12 flex flex-wrap gap-2">

          {categoryButtons.map(
            (category) => (

              <button
                key={category.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(
                    category.key
                  );
                  setShowWishlist(
                    false
                  );
                }}
                className={`border px-5 py-3 text-[10px] font-semibold tracking-[0.13em] ${
                  selectedCategory ===
                  category.key
                    ? "border-[#181818] bg-[#181818] text-white"
                    : "border-[#dedbd5] hover:border-[#181818]"
                }`}
              >
                {category.label}
              </button>

            )
          )}

        </div>

        {/* REELS */}

        {!loading &&
          !error &&
          selectedCategory ===
            "REELS" && (

            <section id="reels">

              <div className="mb-8">

                <p className="ahn-label text-[#a88952]">
                  AHN MOTION
                </p>

                <h3 className="ahn-heading mt-3 text-3xl md:text-4xl">
                  Collection Reels
                </h3>

                <p className="mt-3 text-sm text-[#777]">
                  Explore the latest AHN pieces
                  in motion.
                </p>

              </div>

              {reelProducts.length ===
              0 ? (

                <div className="py-20 text-center text-[#777]">
                  No reels have been uploaded yet.
                </div>

              ) : (

                <div className="relative">

                  <div
                    ref={reelsScrollRef}
                    onScroll={
                      handleReelScroll
                    }
                    className="flex gap-6 overflow-x-auto px-2 pb-6 [scrollbar-width:thin]"
                  >

                    {loopedReels.map(
                      (
                        product,
                        index
                      ) => (
                        <ReelCard
                          key={`${product.id}-${index}`}
                          product={product}
                        />
                      )
                    )}

                  </div>

                </div>

              )}

            </section>

          )}

        {/* PRODUCTS */}

        {!loading &&
          !error &&
          selectedCategory !==
            "REELS" && (

            <>

              {(searchQuery ||
                showWishlist) && (
                <div className="mb-8 border-b border-[#e5e3de] pb-4 text-sm text-[#666]">

                  {showWishlist
                    ? `Wishlist · ${filteredProducts.length} item${
                        filteredProducts.length ===
                        1
                          ? ""
                          : "s"
                      }`
                    : `Search results · ${filteredProducts.length}`}

                </div>
              )}

              {filteredProducts.length ===
              0 ? (

                <div className="border border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center text-[#666]">

                  {showWishlist
                    ? "Your wishlist is empty."
                    : searchQuery
                    ? "No products match your search."
                    : "More beautiful pieces are coming soon."}

                </div>

              ) : (

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                  {filteredProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    )
                  )}

                </div>

              )}

            </>

          )}

      </section>

      {/* MEN */}

      <section
        id="men"
        className="border-y border-[#e5e3de] bg-[#fafaf8] px-6 py-24 text-center"
      >

        <p className="ahn-label text-[#a88952]">
          COMING SOON
        </p>

        <h2 className="ahn-heading mt-4 text-5xl">
          Men&apos;s Collection
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-[#777]">
          A refined collection for the modern gentleman.
        </p>

      </section>

      {/* FOOTER */}

      <footer
        id="contact"
        className="border-t border-[#e5e3de] px-6 py-14"
      >

        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-lg font-semibold tracking-[0.16em]">
              AHN COLLECTION
            </p>

            <p className="mt-2 text-sm text-[#777]">
              Elegance in every thread.
            </p>

          </div>

          <div className="flex gap-8 text-[10px] font-semibold tracking-[0.14em] text-[#666]">
            <span>INSTAGRAM</span>
            <span>WHATSAPP</span>
            <span>CONTACT</span>
          </div>

        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-[#e5e3de] pt-6">

          <p className="text-[9px] tracking-[0.15em] text-[#999]">
            © 2026 AHN COLLECTION — ALL RIGHTS RESERVED
          </p>

        </div>

      </footer>

    </main>
  );
}