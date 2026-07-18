export const EMPTY_DATE_LABEL = "未分類";

export function formatTripDate(dateText) {
  if (!dateText || dateText === EMPTY_DATE_LABEL) return EMPTY_DATE_LABEL;

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return EMPTY_DATE_LABEL;

  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
}

export function getTicketStatusTone(status) {
  switch (status) {
    case "已預定":
      return "reserved";
    case "未預定":
      return "not-reserved";
    case "現場排隊":
      return "walk-in";
    default:
      return "unset";
  }
}

export function getTicketStatusLabel(status) {
  return status || "未設定";
}
