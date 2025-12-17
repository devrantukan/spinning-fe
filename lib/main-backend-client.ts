/**
 * Utility function to make requests to the main backend API
 * Properly handles errors without throwing for expected HTTP error responses
 */

interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
}

interface BackendResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  statusText: string;
}

export async function requestMainBackend<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<BackendResponse<T>> {
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body,
    });

    const status = response.status;
    const statusText = response.statusText;

    // Try to parse response as JSON
    let data: T | undefined;
    let errorData: { error?: string } | undefined;

    try {
      const text = await response.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (response.ok) {
            data = parsed;
          } else {
            errorData = parsed;
          }
        } catch {
          // If not JSON, treat as plain text error
          if (!response.ok) {
            errorData = { error: text };
          }
        }
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
    }

    // For successful responses, return the data
    if (response.ok) {
      return {
        data: data as T,
        status,
        statusText,
      };
    }

    // For error responses, return the error without throwing
    // This allows the caller to handle different status codes appropriately
    const errorMessage = errorData?.error || statusText || "Request failed";

    console.error("Error calling main backend", url, {
      message: errorMessage,
      status,
      statusText,
      errorData,
      url,
    });

    // Return error response instead of throwing
    return {
      error: errorMessage,
      status,
      statusText,
    };
  } catch (networkError: any) {
    // Only throw for actual network/parsing errors, not HTTP error responses
    console.error("Network error calling main backend", url, networkError);
    throw new Error(`Network error: ${networkError.message}`);
  }
}
