"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Category = {
  id: string;
  name: string;
  section: string;
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [gender, setGender] = useState("women");
  const [categoryId, setCategoryId] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [reel, setReel] = useState<File | null>(null);
  const [reelPreview, setReelPreview] = useState("");

  const [featured, setFeatured] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      setError("");

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, section")
        .order("name", { ascending: true });

      if (error) {
        console.error("Category error:", error);
        setError(`Could not load categories: ${error.message}`);
        setLoadingCategories(false);
        return;
      }

      const loadedCategories = data || [];
      setCategories(loadedCategories);

      const firstWomenCategory = loadedCategories.find(
        (category) =>
          category.section.toLowerCase() === "women"
      );

      if (firstWomenCategory) {
        setCategoryId(firstWomenCategory.id);
      }

      setLoadingCategories(false);
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const firstMatchingCategory = categories.find(
      (category) =>
        category.section.toLowerCase() === gender
    );

    setCategoryId(firstMatchingCategory?.id || "");
  }, [gender, categories]);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setMessage("");
  }

  function handleReelChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setReel(file);
    setReelPreview(URL.createObjectURL(file));
    setError("");
    setMessage("");
  }

  async function uploadFile(
    file: File,
    bucket: string
  ): Promise<string> {
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const filePath = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);

      const name = String(
        formData.get("name") || ""
      ).trim();

      const description = String(
        formData.get("description") || ""
      ).trim();

      const price = Number(
        formData.get("price") || 0
      );

      const stock = Number(
        formData.get("stock") || 0
      );

      const sizes = formData
        .getAll("sizes")
        .map(String);

      if (!name) {
        throw new Error("Please enter a product name.");
      }

      if (price < 0) {
        throw new Error("Price cannot be negative.");
      }

      if (stock < 0) {
        throw new Error("Stock cannot be negative.");
      }

      if (!categoryId) {
        throw new Error("Please select a category.");
      }

      if (!image) {
        throw new Error("Please upload a product image.");
      }

      setMessage("Uploading product image...");

      const imageUrl = await uploadFile(
        image,
        "product-images"
      );

      let reelUrl: string | null = null;

      if (reel) {
        setMessage("Uploading product reel...");

        reelUrl = await uploadFile(
          reel,
          "product-reels"
        );
      }

      setMessage("Creating product...");

      const { error: productError } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price,
          category_id: categoryId,
          section: gender,
          images: [imageUrl],
          reel_url: reelUrl,
          sizes,
          stock,
          featured,
          active: true,
        });

      if (productError) {
        throw new Error(productError.message);
      }

      setMessage(
        "Product created successfully! Redirecting..."
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1000);

    } catch (err) {
      console.error("Create product error:", err);

      setMessage("");

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the product."
      );
    } finally {
      setSaving(false);
    }
  }

  const visibleCategories = categories.filter(
    (category) =>
      category.section.toLowerCase() === gender
  );

  return (
    <main className="min-h-screen bg-[#faf8f3] text-[#29251f]">

      <header className="border-b border-[#dfd0b5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">

          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[#b28a42]">
              AHN
            </p>

            <h1 className="mt-1 text-2xl tracking-[0.18em]">
              COLLECTION
            </h1>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-[#9b8258]">
              Administration
            </p>

            <p className="mt-1 text-sm">
              Add New Product
            </p>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.45em] text-[#b28a42]">
            AHN COLLECTION
          </p>

          <h2 className="mt-3 text-4xl font-light tracking-wide">
            Create New Product
          </h2>

          <div className="mt-5 h-px w-20 bg-[#b28a42]" />

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#766d61]">
            Add a new piece to your AHN Collection.
            Fill in the product details below and upload
            the product photography or reel.
          </p>
        </div>

        {message && (
          <div className="mb-8 border border-[#d9c49a] bg-[#fffaf0] px-5 py-4 text-sm text-[#80652f]">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >

          <div className="space-y-8">

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  01
                </p>

                <h3 className="mt-2 text-xl tracking-wide">
                  Product Information
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#766d61]">
                    Product Name
                  </label>

                  <input
                    required
                    name="name"
                    placeholder="e.g. Ivory Embroidered Lawn Suit"
                    className="w-full border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm outline-none focus:border-[#b28a42]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#766d61]">
                    Price (PKR)
                  </label>

                  <input
                    required
                    name="price"
                    type="number"
                    min="0"
                    placeholder="3000"
                    className="w-full border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm outline-none focus:border-[#b28a42]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#766d61]">
                    Stock
                  </label>

                  <input
                    required
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="10"
                    className="w-full border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm outline-none focus:border-[#b28a42]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#766d61]">
                    Collection
                  </label>

                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value)
                    }
                    className="w-full border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm outline-none focus:border-[#b28a42]"
                  >
                    <option value="women">
                      Women
                    </option>

                    <option value="men">
                      Men
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#766d61]">
                    Category
                  </label>

                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(e.target.value)
                    }
                    disabled={
                      loadingCategories ||
                      visibleCategories.length === 0
                    }
                    className="w-full border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm outline-none focus:border-[#b28a42] disabled:opacity-60"
                  >
                    {loadingCategories ? (
                      <option>
                        Loading categories...
                      </option>
                    ) : visibleCategories.length === 0 ? (
                      <option>
                        No categories available
                      </option>
                    ) : (
                      visibleCategories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>

              </div>
            </section>

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  02
                </p>

                <h3 className="mt-2 text-xl tracking-wide">
                  Product Description
                </h3>
              </div>

              <textarea
                required
                name="description"
                rows={7}
                placeholder="Describe the fabric, embroidery, design, colour and other details..."
                className="w-full resize-none border border-[#d9cdb9] bg-[#fffdf9] px-4 py-4 text-sm leading-7 outline-none focus:border-[#b28a42]"
              />

            </section>

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  03
                </p>

                <h3 className="mt-2 text-xl tracking-wide">
                  Available Sizes
                </h3>
              </div>

              <div className="flex flex-wrap gap-3">

                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL",
                  "Free Size",
                ].map((size) => (
                  <label
                    key={size}
                    className="cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="sizes"
                      value={size}
                      className="peer hidden"
                    />

                    <span className="block border border-[#d9cdb9] px-6 py-3 text-xs tracking-wider transition peer-checked:border-[#b28a42] peer-checked:bg-[#b28a42] peer-checked:text-white">
                      {size}
                    </span>
                  </label>
                ))}

              </div>

            </section>

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  04
                </p>

                <h3 className="mt-2 text-xl tracking-wide">
                  Product Photography
                </h3>
              </div>

              <label className="block cursor-pointer">

                <div className="border border-dashed border-[#cbb99b] bg-[#fffdf9] p-10 text-center hover:border-[#b28a42]">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="mx-auto max-h-[500px] max-w-full object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-4xl text-[#b28a42]">
                        +
                      </div>

                      <p className="mt-4 text-sm">
                        Upload Product Image
                      </p>

                      <p className="mt-2 text-xs text-[#8c8172]">
                        JPG, PNG or WEBP
                      </p>
                    </>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

              </label>

              {image && (
                <p className="mt-4 text-xs text-[#766d61]">
                  Selected: {image.name}
                </p>
              )}

            </section>

            <section className="border border-[#dfd0b5] bg-white p-8">

              <div className="mb-7">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                  05
                </p>

                <h3 className="mt-2 text-xl tracking-wide">
                  Collection Reel
                </h3>
              </div>

              <label className="block cursor-pointer">

                <div className="border border-dashed border-[#cbb99b] bg-[#fffdf9] p-10 text-center hover:border-[#b28a42]">

                  {reelPreview ? (
                    <video
                      src={reelPreview}
                      controls
                      className="mx-auto max-h-[500px] max-w-full"
                    />
                  ) : (
                    <>
                      <div className="text-4xl text-[#b28a42]">
                        +
                      </div>

                      <p className="mt-4 text-sm">
                        Upload Product Reel
                      </p>

                      <p className="mt-2 text-xs text-[#8c8172]">
                        MP4 or WEBM
                      </p>
                    </>
                  )}

                </div>

                <input
                  type="file"
                  accept="video/*"
                  onChange={handleReelChange}
                  className="hidden"
                />

              </label>

              {reel && (
                <p className="mt-4 text-xs text-[#766d61]">
                  Selected: {reel.name}
                </p>
              )}

            </section>

          </div>

          <aside className="space-y-8">

            <section className="sticky top-6 border border-[#dfd0b5] bg-white p-7">

              <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a42]">
                Product Settings
              </p>

              <h3 className="mt-3 text-xl">
                Publishing
              </h3>

              <div className="my-7 h-px bg-[#e5dccd]" />

              <label className="flex cursor-pointer items-center justify-between border-b border-[#eee7dc] pb-5">

                <div>
                  <p className="text-sm">
                    Featured Product
                  </p>

                  <p className="mt-1 text-xs text-[#8c8172]">
                    Show in featured collections
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) =>
                    setFeatured(e.target.checked)
                  }
                  className="h-5 w-5 accent-[#b28a42]"
                />

              </label>

              <div className="mt-6 border border-[#eee7dc] bg-[#fffdf9] p-5">

                <p className="text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  Collection
                </p>

                <p className="mt-2 text-sm">
                  {gender === "women"
                    ? "Women"
                    : "Men"}
                </p>

                <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-[#9b8258]">
                  Category
                </p>

                <p className="mt-2 text-sm">
                  {categories.find(
                    (category) =>
                      category.id === categoryId
                  )?.name || "Select category"}
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  saving || loadingCategories
                }
                className="mt-7 w-full bg-[#b28a42] px-6 py-5 text-xs font-medium uppercase tracking-[0.25em] text-white transition hover:bg-[#96702f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Creating Product..."
                  : "Create Product"}
              </button>

              <p className="mt-4 text-center text-[11px] leading-5 text-[#8c8172]">
                Your product will appear in the selected
                collection once published.
              </p>

            </section>

          </aside>

        </form>

      </div>

    </main>
  );
}