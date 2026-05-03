function toDataUri(markup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function createLifestyleScene(title: string, subtitle: string, palette: { start: string; end: string; panel: string; accent: string }) {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="760" rx="42" fill="url(#bg)" />
      <circle cx="1030" cy="126" r="118" fill="rgba(255,255,255,0.14)" />
      <circle cx="144" cy="642" r="160" fill="rgba(255,255,255,0.08)" />
      <rect x="118" y="138" width="964" height="484" rx="34" fill="${palette.panel}" />
      <rect x="186" y="212" width="286" height="252" rx="24" fill="rgba(255,255,255,0.62)" />
      <rect x="544" y="212" width="362" height="80" rx="20" fill="rgba(255,255,255,0.52)" />
      <rect x="544" y="320" width="362" height="80" rx="20" fill="rgba(255,255,255,0.48)" />
      <rect x="544" y="430" width="362" height="80" rx="20" fill="rgba(255,255,255,0.44)" />
      <rect x="224" y="506" width="636" height="54" rx="20" fill="${palette.accent}" opacity="0.88" />
      <path d="M324 306 C344 260 406 240 448 278 C488 314 482 384 434 410 C370 444 302 392 324 306Z" fill="${palette.accent}" opacity="0.9" />
      <rect x="718" y="164" width="206" height="26" rx="12" fill="${palette.accent}" opacity="0.22" />
      <text x="84" y="648" fill="#2f1d13" font-size="66" font-weight="700" font-family="Georgia, serif">${title}</text>
      <text x="84" y="704" fill="#5e4737" font-size="30" font-family="Arial, sans-serif">${subtitle}</text>
    </svg>
  `);
}

export const lifestyleGalleryImages = {
  morningLight: createLifestyleScene("Buổi sáng nhiều nắng", "Góc quán ấm và sáng cho nhịp bắt đầu thật dễ chịu", {
    start: "#f6eadc",
    end: "#d7b28d",
    panel: "#fff8f0",
    accent: "#8a532c",
  }),
  baristaMoment: createLifestyleScene("Quầy pha chế bận rộn", "Nhịp phục vụ gọn gàng cho khách tại quán và khách online", {
    start: "#efe4d8",
    end: "#b78662",
    panel: "#fbf4eb",
    accent: "#6a3820",
  }),
  windowCorner: createLifestyleScene("Góc ngồi cửa sổ", "Một khoảng dừng đủ đẹp cho buổi chiều nhiều cảm hứng", {
    start: "#ece5da",
    end: "#c8a27f",
    panel: "#fff9f2",
    accent: "#71472a",
  }),
};
