type BranchOpenStatus = {
  label: string;
  tone: "success" | "warning" | "muted";
};

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function getBranchOpenStatus(openingHours?: string | null): BranchOpenStatus | null {
  if (!openingHours || !openingHours.includes("-")) return null;

  const [startRaw, endRaw] = openingHours.split("-").map((item) => item.trim());
  const startMinutes = parseMinutes(startRaw);
  const endMinutes = parseMinutes(endRaw);
  if (startMinutes === null || endMinutes === null) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
    return { label: "Đã đóng cửa", tone: "muted" };
  }

  if (endMinutes - currentMinutes <= 60) {
    return { label: "Sắp đóng cửa", tone: "warning" };
  }

  return { label: "Đang mở cửa", tone: "success" };
}
