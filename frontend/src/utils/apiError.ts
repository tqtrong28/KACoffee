import axios from "axios";

type ValidationDetail = {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

function humanize(part: string | number) {
  if (typeof part === "number") {
    return `item ${part + 1}`;
  }
  return part.replace(/_/g, " ");
}

function formatValidationDetails(detail: ValidationDetail[]) {
  const messages = detail.map((entry) => {
    const loc = (entry.loc ?? []).filter((part) => !["body", "query", "path"].includes(String(part)));
    const field = loc.length ? loc.map(humanize).join(" ") : "request";
    if (entry.type === "missing") {
      return `${field.charAt(0).toUpperCase()}${field.slice(1)} is required.`;
    }
    if (entry.msg) {
      return field === "request"
        ? entry.msg
        : `${field.charAt(0).toUpperCase()}${field.slice(1)}: ${entry.msg}.`;
    }
    return "Invalid request.";
  });

  return Array.from(new Set(messages)).join(" ");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string | ValidationDetail[] }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      return formatValidationDetails(data.detail);
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  return fallback;
}
