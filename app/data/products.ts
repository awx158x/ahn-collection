export type Product = {
  id: string;
  name: string;
  category: string;
  gender: "WOMEN" | "MEN";
  price: number;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
};

export const products: Product[] = [
  {
    id: "royal-ivory",
    name: "Royal Ivory Ensemble",
    category: "Luxury Pret",
    gender: "WOMEN",
    price: 12999,

    description:
      "A graceful ivory ensemble designed for effortless elegance. Featuring a refined silhouette and timeless detailing, this piece is perfect for sophisticated everyday and occasion wear.",

    images: [
      "/reels/royal-ivory.mp4",
    ],

    sizes: [
      "XS",
      "S",
      "M",
      "L",
      "XL",
    ],

    colors: [
      "Ivory",
      "White",
      "Beige",
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}