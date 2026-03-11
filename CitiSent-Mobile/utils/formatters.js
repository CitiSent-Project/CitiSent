//Capitalize the first letter of a string.
export function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//Format a date to a readable string.
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

//Format a date-time to a readable string.
export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

//Truncate a string to a given length.
export function truncate(str = "", max = 100) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}
