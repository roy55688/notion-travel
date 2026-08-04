export function getView(pathname = "/") {
  return /^\/shopping\/?$/.test(pathname) ? "shopping" : "trips";
}
