type CsrfToken = {
  headerName: string;
  token: string;
};

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const error: { message?: unknown } = await response.json();
    return typeof error.message === 'string' ? error.message : fallback;
  } catch {
    return fallback;
  }
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  // Read a fresh token before every POST, including the first one after login.
  const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
  if (!csrfResponse.ok) {
    throw new Error(await errorMessage(csrfResponse, 'Could not prepare the request. Please try again.'));
  }
  const csrf: CsrfToken = await csrfResponse.json();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'The request failed. Please try again.'));
  }

  return response.json() as Promise<T>;
}
