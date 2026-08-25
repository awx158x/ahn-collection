"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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

type CategoryButton = {
  key: string;
  label: string;
  categoryId?: string;
};

type ReelCardProps = {
  product: Product;
};

function ReelCard({ product }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);

    if (video.paused) {
      video.play().catch(() => {});
    }
  }

  return (
    <article className="group w-[260px] shrink-0 overflow-hidden border border-[#c9a96e]/30 bg-[#fffdf9] sm:w-[300px]">

      <div className="relative aspect-[9/16] overflow-hidden bg-black">

        <video
          ref={videoRef}
          src={product.reel_url || ""}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget
              .play()
              .catch(() => {});
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />

        {/* BRAND */}

        <div className="absolute left-5 top-5">

          <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.35em] text-white">
            AHN COLLECTION
          </p>

        </div>

        {/* UNMUTE */}

        <button
          type="button"
          onClick={toggleMute}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/35 text-sm text-white backdrop-blur transition hover:bg-[#b28a45]"
          title={muted ? "Unmute reel" : "Mute reel"}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* PRODUCT INFO */}

        <div className="absolute bottom-5 left-5 right-5">

          <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.25em] text-[#e8c987]">
            REEL
          </p>

          <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl text-white">
            {product.name}
          </h3>

          <p className="mt-1 font-[var(--font-cormorant)] text-lg text-white/90">
            Rs.{" "}
            {product.price.toLocaleString("en-PK")}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-2 border-t border-[#c9a96e]/30">

        <button
          type="button"
          className="border-r border-[#c9a96e]/20 py-4 text-center text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
        >
          ♡
        </button>

        <Link
          href={`/product/${product.id}`}
          className="py-4 text-center font-[var(--font-cinzel)] text-[9px] tracking-[0.18em] text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
        >
          VIEW
        </Link>

      </div>

    </article>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const reelsScrollRef =
    useRef<HTMLDivElement | null>(null);

  const isResettingRef = useRef(false);

  // ==================================================
  // LOAD STORE DATA
  // ==================================================

  useEffect(() => {
    async function loadStore() {
      setLoading(true);
      setError("");

      const [
        {
          data: productData,
          error: productError,
        },
        {
          data: categoryData,
          error: categoryError,
        },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, description, price, category_id, section, images, reel_url, sizes, stock, featured, active, created_at"
          )
          .eq("active", true)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select("id, name, section")
          .order("name", {
            ascending: true,
          }),
      ]);

      if (productError) {
        console.error(
          "Homepage product error:",
          productError
        );

        setError(
          "Could not load the collection."
        );

        setLoading(false);
        return;
      }

      if (categoryError) {
        console.error(
          "Homepage category error:",
          categoryError
        );

        setError(
          "Could not load categories."
        );

        setLoading(false);
        return;
      }

      setProducts(productData || []);
      setCategories(categoryData || []);

      setLoading(false);
    }

    loadStore();
  }, []);

  // ==================================================
  // CATEGORY BUTTONS
  // ==================================================

  const categoryButtons: CategoryButton[] =
    useMemo(() => {
      const buttons: CategoryButton[] = [
        {
          key: "ALL",
          label: "ALL",
        },
      ];

      for (const category of categories) {
        buttons.push({
          key: category.id,
          label: category.name.toUpperCase(),
          categoryId: category.id,
        });
      }

      buttons.push({
        key: "REELS",
        label: "REELS",
      });

      return buttons;
    }, [categories]);

  // ==================================================
  // PRODUCTS FILTER
  // ==================================================

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") {
      return products;
    }

    if (selectedCategory === "REELS") {
      return [];
    }

    return products.filter(
      (product) =>
        product.category_id ===
        selectedCategory
    );
  }, [
    products,
    selectedCategory,
  ]);

  // ==================================================
  // REELS
  // ==================================================

  const reelProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          Boolean(product.reel_url)
      ),
    [products]
  );

  // Duplicate reel list to create endless loop
  const loopedReels = useMemo(() => {
    if (reelProducts.length === 0) {
      return [];
    }

    return [
      ...reelProducts,
      ...reelProducts,
      ...reelProducts,
    ];
  }, [reelProducts]);

  // ==================================================
  // INFINITE REEL SCROLL
  // ==================================================

  function handleReelScroll() {
    const container =
      reelsScrollRef.current;

    if (!container || isResettingRef.current) {
      return;
    }

    const oneSetWidth =
      container.scrollWidth / 3;

    if (
      container.scrollLeft <
      oneSetWidth * 0.4
    ) {
      isResettingRef.current = true;

      container.scrollLeft +=
        oneSetWidth;

      requestAnimationFrame(() => {
        isResettingRef.current = false;
      });

      return;
    }

    if (
      container.scrollLeft >
      oneSetWidth * 1.6
    ) {
      isResettingRef.current = true;

      container.scrollLeft -=
        oneSetWidth;

      requestAnimationFrame(() => {
        isResettingRef.current = false;
      });
    }
  }

  // Start in the middle copy
  useEffect(() => {
    const container =
      reelsScrollRef.current;

    if (!container || reelProducts.length === 0) {
      return;
    }

    const oneSetWidth =
      container.scrollWidth / 3;

    container.scrollLeft =
      oneSetWidth;
  }, [reelProducts.length]);

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#30291f]">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#c9a96e]/30 bg-[#fffdf9]/95 backdrop-blur">

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

            <a
              href="#women"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] transition hover:text-[#b28a45]"
            >
              WOMEN
            </a>

            <a
              href="#men"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] transition hover:text-[#b28a45]"
            >
              MEN
            </a>

            <a
              href="#collections"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] transition hover:text-[#b28a45]"
            >
              COLLECTIONS
            </a>

            <a
              href="#reels"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] transition hover:text-[#b28a45]"
            >
              REELS
            </a>

            <a
              href="#contact"
              className="font-[var(--font-cinzel)] text-xs tracking-[0.2em] text-[#756c60] transition hover:text-[#b28a45]"
            >
              CONTACT
            </a>

          </nav>

          <div className="flex items-center gap-5 text-[#8c7044]">

            <button
              type="button"
              className="text-xl transition hover:text-[#b28a45]"
              title="Search"
            >
              ⌕
            </button>

            <button
              type="button"
              className="text-xl transition hover:text-[#b28a45]"
              title="Wishlist"
            >
              ♡
            </button>

            <Link
              href="/checkout"
              className="text-xl transition hover:text-[#b28a45]"
              title="Checkout"
            >
              ♧
            </Link>

          </div>

        </div>

      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="border-b border-[#c9a96e]/20 bg-[#fffdf9] px-6 py-20 text-center">

        <p className="font-[var(--font-cinzel)] text-xs tracking-[0.5em] text-[#b28a45]">
          AHN COLLECTION
        </p>

        <h1 className="mt-6 font-[var(--font-cormorant)] text-6xl leading-none text-[#30291f] md:text-8xl">
          Elegance
          <br />
          <span className="italic text-[#b28a45]">
            Reimagined.
          </span>
        </h1>

        <div className="mx-auto my-8 h-px w-20 bg-[#c9a96e]" />

        <p className="mx-auto max-w-xl font-[var(--font-cormorant)] text-xl leading-8 text-[#81786a]">
          Discover timeless fashion, carefully curated
          for those who appreciate elegance in every
          thread.
        </p>

      </section>

      {/* ==================================================
          COLLECTIONS
      ================================================== */}

      <section
        id="women"
        className="mx-auto max-w-7xl px-6 py-20"
      >

        <div className="mb-12 text-center">

          <p className="font-[var(--font-cinzel)] text-xs tracking-[0.45em] text-[#b28a45]">
            DISCOVER
          </p>

          <h2 className="mt-4 font-[var(--font-cormorant)] text-5xl md:text-6xl">
            The AHN Edit
          </h2>

          <div className="mx-auto mt-6 h-px w-16 bg-[#c9a96e]" />

        </div>

        {/* CATEGORY FILTER */}

        <div
          id="collections"
          className="mb-12 flex flex-wrap justify-center gap-3"
        >

          {categoryButtons.map(
            (category) => (

              <button
                key={category.key}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    category.key
                  )
                }
                className={`border px-5 py-3 font-[var(--font-cinzel)] text-[10px] tracking-[0.15em] transition ${
                  selectedCategory ===
                  category.key
                    ? "border-[#b28a45] bg-[#b28a45] text-white"
                    : "border-[#c9a96e]/40 text-[#756c60] hover:border-[#b28a45] hover:text-[#b28a45]"
                }`}
              >
                {category.label}
              </button>

            )
          )}

        </div>

        {/* LOADING */}

        {loading && (

          <div className="py-20 text-center">

            <p className="font-[var(--font-cormorant)] text-2xl text-[#81786a]">
              Loading the collection...
            </p>

          </div>

        )}

        {/* ERROR */}

        {!loading && error && (

          <div className="border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-700">
            {error}
          </div>

        )}

        {/* REELS CATEGORY */}

        {!loading &&
          !error &&
          selectedCategory === "REELS" && (

            <section
              id="reels"
              className="relative"
            >

              <div className="mb-7 text-center">

                <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
                  AHN MOTION
                </p>

                <h3 className="mt-3 font-[var(--font-cormorant)] text-4xl">
                  Collection Reels
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#81786a]">
                  Swipe, drag or scroll through the latest
                  AHN Collection reels.
                </p>

              </div>

              {reelProducts.length === 0 ? (

                <div className="py-20 text-center">

                  <p className="font-[var(--font-cormorant)] text-2xl italic text-[#81786a]">
                    No reels have been uploaded yet.
                  </p>

                </div>

              ) : (

                <div className="relative">

                  {/* LEFT FADE */}

                  <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#fcfaf6] to-transparent" />

                  {/* RIGHT FADE */}

                  <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#fcfaf6] to-transparent" />

                  {/* SCROLLER */}

                  <div
                    ref={reelsScrollRef}
                    onScroll={
                      handleReelScroll
                    }
                    className="flex gap-6 overflow-x-auto scroll-smooth px-4 pb-6 [scrollbar-width:thin]"
                  >

                    {loopedReels.map(
                      (product, index) => (

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
          selectedCategory !== "REELS" && (

            filteredProducts.length === 0 ? (

              <div className="py-20 text-center">

                <p className="font-[var(--font-cormorant)] text-2xl italic text-[#81786a]">
                  More beautiful pieces are coming soon.
                </p>

              </div>

            ) : (

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

                {filteredProducts.map(
                  (product) => {

                    const imageUrl =
                      product.images &&
                      product.images.length > 0
                        ? product.images[0]
                        : "";

                    return (

                      <article
                        key={product.id}
                        className="group overflow-hidden border border-[#c9a96e]/30 bg-[#fffdf9]"
                      >

                        <div className="relative aspect-[3/4] overflow-hidden bg-[#eee9df]">

                          {imageUrl ? (

                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />

                          ) : product.reel_url ? (

                            <video
                              src={product.reel_url}
                              muted
                              autoPlay
                              loop
                              playsInline
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />

                          ) : (

                            <div className="flex h-full items-center justify-center text-xs tracking-widest text-[#9a8e7c]">
                              NO IMAGE
                            </div>

                          )}

                          <div className="absolute left-5 top-5">

                            <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.35em] text-white drop-shadow">
                              AHN COLLECTION
                            </p>

                          </div>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-20">

                            <p className="font-[var(--font-cinzel)] text-[9px] tracking-[0.25em] text-[#e8c987]">
                              {
                                categories.find(
                                  (category) =>
                                    category.id ===
                                    product.category_id
                                )?.name ||
                                  "COLLECTION"
                              }
                            </p>

                            <h3 className="mt-2 font-[var(--font-cormorant)] text-3xl text-white">
                              {product.name}
                            </h3>

                            <p className="mt-1 font-[var(--font-cormorant)] text-lg text-white/90">
                              Rs.{" "}
                              {product.price.toLocaleString(
                                "en-PK"
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="grid grid-cols-3 border-t border-[#c9a96e]/30">

                          <button
                            type="button"
                            className="border-r border-[#c9a96e]/20 py-4 text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
                            title="Add to wishlist"
                          >
                            ♡
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof window !==
                                "undefined"
                              ) {
                                const shareUrl =
                                  `${window.location.origin}/product/${product.id}`;

                                if (
                                  navigator.share
                                ) {
                                  navigator
                                    .share({
                                      title:
                                        product.name,
                                      text:
                                        `Check out ${product.name} from AHN Collection.`,
                                      url: shareUrl,
                                    })
                                    .catch(
                                      () => {}
                                    );
                                } else {
                                  navigator.clipboard
                                    .writeText(
                                      shareUrl
                                    )
                                    .then(() =>
                                      alert(
                                        "Product link copied!"
                                      )
                                    )
                                    .catch(() => {});
                                }
                              }
                            }}
                            className="border-r border-[#c9a96e]/20 py-4 text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
                            title="Share"
                          >
                            ↗
                          </button>

                          <Link
                            href={`/product/${product.id}`}
                            className="py-4 text-center text-xs text-[#8c7044] transition hover:bg-[#b28a45] hover:text-white"
                            title="View product"
                          >
                            →
                          </Link>

                        </div>

                        <Link
                          href={`/product/${product.id}`}
                          className="block bg-[#30291f] py-4 text-center font-[var(--font-cinzel)] text-[10px] tracking-[0.25em] text-white transition hover:bg-[#b28a45]"
                        >
                          VIEW ARTICLE →
                        </Link>

                      </article>

                    );
                  }
                )}

              </div>

            )

          )}

      </section>

      {/* ==================================================
          MEN
      ================================================== */}

      <section
        id="men"
        className="border-y border-[#c9a96e]/20 bg-[#f4f0e8] px-6 py-24 text-center"
      >

        <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
          COMING SOON
        </p>

        <h2 className="mt-5 font-[var(--font-cormorant)] text-6xl text-[#30291f]">
          Men&apos;s Collection
        </h2>

        <div className="mx-auto my-7 h-px w-16 bg-[#c9a96e]" />

        <p className="mx-auto max-w-xl font-[var(--font-cormorant)] text-xl leading-8 text-[#81786a]">
          A refined collection for the modern gentleman.
          Discover timeless silhouettes and sophisticated
          essentials.
        </p>

      </section>

      {/* ==================================================
          PHILOSOPHY
      ================================================== */}

      <section className="px-6 py-28 text-center">

        <p className="font-[var(--font-cinzel)] text-xs tracking-[0.4em] text-[#b28a45]">
          OUR PHILOSOPHY
        </p>

        <h2 className="mx-auto mt-6 max-w-3xl font-[var(--font-cormorant)] text-5xl leading-tight text-[#30291f] md:text-6xl">
          &quot;Fashion fades,
          <br />
          <span className="italic text-[#b28a45]">
            elegance remains.&quot;
          </span>
        </h2>

      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer
        id="contact"
        className="border-t border-[#c9a96e]/30 bg-[#fffdf9] px-6 py-16 text-center"
      >

        <h2 className="font-[var(--font-cinzel)] text-2xl tracking-[0.35em] text-[#b28a45]">
          AHN COLLECTION
        </h2>

        <div className="mx-auto my-5 h-px w-16 bg-[#c9a96e]" />

        <p className="font-[var(--font-cormorant)] text-xl italic text-[#81786a]">
          Elegance in every thread.
        </p>

        <div className="mt-8 flex justify-center gap-8 font-[var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#756c60]">
          <span>INSTAGRAM</span>
          <span>WHATSAPP</span>
          <span>CONTACT</span>
        </div>

        <p className="mt-8 font-[var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#9b9182]">
          © 2026 AHN COLLECTION — ALL RIGHTS RESERVED
        </p>

      </footer>

    </main>
  );
}