export const siteTitle = "우주여행사 블로그";

export const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export function postUrl(postId) {
  return `${basePath}posts/${postId}/`;
}

export function formatDate(date) {
  return date.split(" ")[0].replaceAll("-", ".");
}
