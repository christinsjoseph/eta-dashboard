export async function secureFetch(url: string, options: any = {}) {
  const token = localStorage.getItem("token");

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, options);

  // AUTO LOGOUT IF TOKEN EXPIRED OR INVALID
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return response;
}
