export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  init.signal?.addEventListener('abort', abort, {once:true});
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(input, {...init, signal:controller.signal});
    // Keep the deadline active until the JSON body has arrived, not just headers.
    await response.clone().arrayBuffer();
    return response;
  }
  finally { clearTimeout(timer); init.signal?.removeEventListener('abort', abort); }
}
