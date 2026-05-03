import type { SyntheticEvent } from "react";
import type { Branch } from "../types/models";

type BranchTheme = {
  title: string;
  subtitle: string;
  background: string;
  accent: string;
};

function toDataUri(markup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function createBranchIllustration(theme: BranchTheme) {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 620">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.background}" />
          <stop offset="100%" stop-color="${theme.accent}" />
        </linearGradient>
      </defs>
      <rect width="960" height="620" rx="42" fill="url(#bg)" />
      <rect x="146" y="200" width="670" height="290" rx="28" fill="#fff7ee" />
      <rect x="220" y="140" width="520" height="96" rx="28" fill="#5c3520" />
      <text x="480" y="200" text-anchor="middle" fill="#f4e8db" font-size="42" font-weight="700" font-family="Georgia, serif">KACoffee</text>
      <rect x="228" y="270" width="150" height="110" rx="18" fill="#dcc6af" />
      <rect x="404" y="270" width="150" height="110" rx="18" fill="#dcc6af" />
      <rect x="580" y="270" width="150" height="110" rx="18" fill="#dcc6af" />
      <rect x="420" y="392" width="124" height="98" rx="22" fill="#7a4a2d" />
      <circle cx="234" cy="520" r="54" fill="rgba(255,255,255,0.55)" />
      <circle cx="752" cy="514" r="66" fill="rgba(255,255,255,0.35)" />
      <text x="74" y="560" fill="#2f1d13" font-size="54" font-weight="700" font-family="Georgia, serif">${theme.title}</text>
      <text x="74" y="604" fill="#5a4539" font-size="26" font-family="Arial, sans-serif">${theme.subtitle}</text>
    </svg>
  `);
}

const branchFallbackMap: Record<string, string> = {
  "hoan-kiem": createBranchIllustration({
    title: "KACoffee Tràng Tiền",
    subtitle: "Hoàn Kiếm · Không gian sáng, tiện ghé nhanh",
    background: "#efe5d7",
    accent: "#d0b18e",
  }),
  "hai-ba-trung": createBranchIllustration({
    title: "KACoffee Phố Huế",
    subtitle: "Hai Bà Trưng · Yên tĩnh, hợp học và làm việc",
    background: "#eee6dc",
    accent: "#c6a78b",
  }),
  "cau-giay": createBranchIllustration({
    title: "KACoffee Cầu Giấy",
    subtitle: "Cầu Giấy · Linh hoạt cho nhóm bạn và dân văn phòng",
    background: "#e6ece8",
    accent: "#95b4a7",
  }),
  "dong-da": createBranchIllustration({
    title: "KACoffee Tây Sơn",
    subtitle: "Đống Đa · Phục vụ nhanh, dễ ghé vào mọi khung giờ",
    background: "#f0e5d9",
    accent: "#cb9d78",
  }),
};

const genericBranchFallback = createBranchIllustration({
  title: "Chi nhánh KACoffee",
  subtitle: "Không gian ấm, dễ ghé, dễ quay lại",
  background: "#ece3d7",
  accent: "#bb9a7c",
});

export function getBranchImageUrl(branch: Pick<Branch, "code" | "image_url">) {
  return branch.image_url || branchFallbackMap[branch.code] || genericBranchFallback;
}

export function applyBranchImageFallback(event: SyntheticEvent<HTMLImageElement>, branchCode: string) {
  const target = event.currentTarget;
  if (target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  target.src = branchFallbackMap[branchCode] || genericBranchFallback;
}
