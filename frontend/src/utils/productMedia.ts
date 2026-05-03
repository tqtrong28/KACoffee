import type { SyntheticEvent } from "react";
import type { Product } from "../types/models";

type ProductTheme = {
  title: string;
  subtitle: string;
  background: string;
  accent: string;
  cup: string;
};

function toDataUri(markup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function createProductIllustration(theme: ProductTheme) {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.background}" />
          <stop offset="100%" stop-color="${theme.accent}" />
        </linearGradient>
        <linearGradient id="cupShade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.12)" />
        </linearGradient>
      </defs>
      <rect width="960" height="720" rx="48" fill="url(#bg)" />
      <circle cx="760" cy="146" r="140" fill="rgba(255,255,255,0.18)" />
      <circle cx="166" cy="574" r="170" fill="rgba(255,255,255,0.1)" />
      <circle cx="476" cy="350" r="250" fill="rgba(255,255,255,0.13)" />
      <g transform="translate(240 118)">
        <ellipse cx="240" cy="462" rx="236" ry="38" fill="rgba(58,33,8,0.16)" />
        <rect x="118" y="210" width="300" height="260" rx="52" fill="${theme.cup}" />
        <rect x="118" y="210" width="300" height="260" rx="52" fill="url(#cupShade)" opacity="0.32" />
        <rect x="162" y="156" width="212" height="100" rx="38" fill="rgba(255,255,255,0.82)" />
        <rect x="182" y="180" width="172" height="30" rx="15" fill="rgba(87,53,31,0.18)" />
        <path d="M418 260 C505 252 544 318 514 382 C494 424 460 444 418 442" fill="none" stroke="${theme.cup}" stroke-width="38" stroke-linecap="round" />
        <path d="M170 104 C140 70 140 36 172 2" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="20" stroke-linecap="round" />
        <path d="M244 96 C220 62 222 30 254 0" fill="none" stroke="rgba(255,255,255,0.62)" stroke-width="18" stroke-linecap="round" />
        <path d="M320 104 C292 70 296 36 328 4" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="16" stroke-linecap="round" />
        <circle cx="160" cy="300" r="24" fill="rgba(255,255,255,0.16)" />
        <circle cx="364" cy="414" r="18" fill="rgba(255,255,255,0.12)" />
      </g>
    </svg>
  `);
}

const productTypeFallbackMap: Record<Product["product_type"], string> = {
  takeaway: createProductIllustration({
    title: "Pha ly tại quầy",
    subtitle: "Tươi mới, dễ chọn, dễ chỉnh vị",
    background: "#f6ead9",
    accent: "#d9b88f",
    cup: "#7b4928",
  }),
  bottled: createProductIllustration({
    title: "Cold brew đóng chai",
    subtitle: "Mát lạnh, tiện mang theo cả ngày",
    background: "#ddeef2",
    accent: "#9ac7d6",
    cup: "#355f73",
  }),
  in_shop: createProductIllustration({
    title: "Signature của quán",
    subtitle: "Đậm vị hơn, trải nghiệm hơn",
    background: "#eadfcf",
    accent: "#b18259",
    cup: "#3d2416",
  }),
};

const productImageMap: Record<string, string> = {
  "latte-takeaway": createProductIllustration({
    title: "Latte đá",
    subtitle: "Êm vị, dễ uống, hợp mọi khung giờ",
    background: "#f6ead9",
    accent: "#d4b48f",
    cup: "#80502d",
  }),
  "iced-black-coffee-takeaway": createProductIllustration({
    title: "Cà phê đen đá",
    subtitle: "Đậm vị, gọn hậu, tỉnh táo",
    background: "#efe5d7",
    accent: "#b99162",
    cup: "#4a2b19",
  }),
  "iced-milk-coffee-takeaway": createProductIllustration({
    title: "Cà phê sữa đá",
    subtitle: "Quen vị, đậm cà phê, ngọt dịu",
    background: "#f2e3cf",
    accent: "#c49a69",
    cup: "#6c4020",
  }),
  "bac-xiu-takeaway": createProductIllustration({
    title: "Bạc xỉu",
    subtitle: "Nhẹ cà phê, thơm sữa, dễ uống",
    background: "#f8eadf",
    accent: "#d9b79e",
    cup: "#8a5a36",
  }),
  "americano-iced-takeaway": createProductIllustration({
    title: "Americano đá",
    subtitle: "Thanh vị, sạch vị, gọn gàng",
    background: "#ece5dc",
    accent: "#b99d7f",
    cup: "#523325",
  }),
  "cappuccino-takeaway": createProductIllustration({
    title: "Cappuccino",
    subtitle: "Foam mịn, béo nhẹ, thơm sữa",
    background: "#f7ead7",
    accent: "#d6b48b",
    cup: "#7c4d2b",
  }),
  "mocha-takeaway": createProductIllustration({
    title: "Mocha",
    subtitle: "Chocolate đậm, mềm vị, ngọt vừa",
    background: "#ead8cf",
    accent: "#b47d6e",
    cup: "#5d312a",
  }),
  "caramel-macchiato-takeaway": createProductIllustration({
    title: "Caramel macchiato",
    subtitle: "Caramel thơm, ngọt dịu, mềm vị",
    background: "#f6e5d1",
    accent: "#d59f5a",
    cup: "#8a5228",
  }),
  "matcha-latte-takeaway": createProductIllustration({
    title: "Matcha latte",
    subtitle: "Trà xanh dịu, sữa mềm, dễ thư giãn",
    background: "#e4efe2",
    accent: "#94bf92",
    cup: "#50724f",
  }),
  "cold-brew-orange-takeaway": createProductIllustration({
    title: "Cold brew cam",
    subtitle: "Cam tươi, sáng vị, rất hợp buổi chiều",
    background: "#f8e7d5",
    accent: "#f0a153",
    cup: "#9f5b2b",
  }),
  "flat-white-takeaway": createProductIllustration({
    title: "Flat white",
    subtitle: "Cân bằng espresso và sữa mịn",
    background: "#efe6d9",
    accent: "#c7a989",
    cup: "#775239",
  }),
  "cold-brew-bottle": createProductIllustration({
    title: "Cold brew nguyên bản",
    subtitle: "Mát lạnh, rõ vị, tiện mang theo",
    background: "#dfeff4",
    accent: "#94bfd0",
    cup: "#31596d",
  }),
  "cold-brew-oatmilk-bottle": createProductIllustration({
    title: "Cold brew oatmilk",
    subtitle: "Nhẹ bụng, thanh vị, ít ngọt",
    background: "#e7efe6",
    accent: "#b1c8a0",
    cup: "#5c6f47",
  }),
  "cold-brew-vanilla-bottle": createProductIllustration({
    title: "Cold brew vanilla",
    subtitle: "Vanilla nhẹ, êm hậu, dễ uống",
    background: "#eef0dc",
    accent: "#c2ba79",
    cup: "#6c6236",
  }),
  "cold-brew-hazelnut-bottle": createProductIllustration({
    title: "Cold brew hazelnut",
    subtitle: "Thơm hạt, đậm hậu, mát lạnh",
    background: "#e7ddd4",
    accent: "#b48d69",
    cup: "#634531",
  }),
  "milk-coffee-bottle": createProductIllustration({
    title: "Cà phê sữa chai",
    subtitle: "Quen vị, đậm sữa, tiện cả ngày",
    background: "#f0e4d6",
    accent: "#d1ab7c",
    cup: "#805339",
  }),
  "bac-xiu-bottle": createProductIllustration({
    title: "Bạc xỉu lạnh",
    subtitle: "Nhẹ cà phê, thơm sữa, mát dịu",
    background: "#f7ece4",
    accent: "#d6c1b0",
    cup: "#8b6648",
  }),
  "cold-brew-coconut-bottle": createProductIllustration({
    title: "Cold brew dừa",
    subtitle: "Mát lạnh, vị dừa nhẹ, tươi vị",
    background: "#e4f0ec",
    accent: "#88b9ab",
    cup: "#446a60",
  }),
  "cold-brew-caramel-bottle": createProductIllustration({
    title: "Cold brew caramel",
    subtitle: "Caramel mềm vị, hậu dài, dễ nhớ",
    background: "#f2e6d9",
    accent: "#caa16f",
    cup: "#7a5333",
  }),
  "signature-espresso": createProductIllustration({
    title: "Espresso signature",
    subtitle: "Đậm hương, tròn vị, hậu cacao rang",
    background: "#eadccf",
    accent: "#b07e57",
    cup: "#3d2416",
  }),
  "espresso-con-panna": createProductIllustration({
    title: "Espresso con panna",
    subtitle: "Kem tươi mềm, espresso đậm",
    background: "#eee0d4",
    accent: "#c9a17e",
    cup: "#4a2d1d",
  }),
  "affogato-vanilla": createProductIllustration({
    title: "Affogato vanilla",
    subtitle: "Kem lạnh gặp espresso nóng đầy tương phản",
    background: "#f1e6d8",
    accent: "#d4b089",
    cup: "#5a3622",
  }),
  "salt-coffee-in-shop": createProductIllustration({
    title: "Cà phê muối",
    subtitle: "Béo nhẹ, mặn dịu, đậm vị rất riêng",
    background: "#e8ddd2",
    accent: "#b78a66",
    cup: "#563220",
  }),
  "espresso-tonic-in-shop": createProductIllustration({
    title: "Espresso tonic",
    subtitle: "Tươi vị, sủi nhẹ, rất hợp buổi chiều",
    background: "#e5efe8",
    accent: "#7fb0a3",
    cup: "#315450",
  }),
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getProductImageUrl(product: Pick<Product, "slug" | "name" | "image_url" | "product_type">) {
  return (
    product.image_url ||
    productImageMap[product.slug] ||
    productImageMap[normalizeName(product.name)] ||
    productTypeFallbackMap[product.product_type] ||
    null
  );
}

export function getProductFallbackImageUrl(productType: Product["product_type"]) {
  return productTypeFallbackMap[productType];
}

export function isGeneratedProductImage(product: Pick<Product, "image_url">) {
  return !product.image_url;
}

export function applyProductImageFallback(
  event: SyntheticEvent<HTMLImageElement>,
  productType: Product["product_type"],
) {
  const target = event.currentTarget;
  const fallback = getProductFallbackImageUrl(productType);
  if (target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  target.classList.add("generated-image");
  target.src = fallback;
}

export const showcaseDrinks = [
  {
    title: "Latte đá",
    subtitle: "Êm vị, dễ uống, chuẩn gu buổi sáng",
    imageUrl: productImageMap["latte-takeaway"],
  },
  {
    title: "Cold brew nguyên bản",
    subtitle: "Mát lạnh, tiện mang theo cả ngày",
    imageUrl: productImageMap["cold-brew-bottle"],
  },
  {
    title: "Espresso signature",
    subtitle: "Đậm hương, tròn vị cho người mê espresso",
    imageUrl: productImageMap["signature-espresso"],
  },
];
