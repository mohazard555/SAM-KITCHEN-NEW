// This Vercel Edge Function acts as a secure, robust proxy to fetch settings.
// This version includes comprehensive error handling to ensure it deploys correctly and avoids 404s.
export const config = {
    runtime: 'edge',
};

export default async function handler(_request: Request) {
    const GIST_URL = process.env.GIST_URL;

    // A common source of deployment failure is a missing environment variable.
    // This check ensures we fail gracefully at runtime if GIST_URL is not configured.
    if (!GIST_URL) {
        console.error("Server configuration error: GIST_URL environment variable is not set.");
        return new Response(
            JSON.stringify({ details: "The server is not configured correctly. The GIST_URL is missing." }),
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate' 
                } 
            }
        );
    }

    try {
        // Fetch the raw content from the Gist, ensuring we don't use a cached version from any intermediate proxy.
        const response = await fetch(GIST_URL, { cache: 'no-store' });

        // If the fetch to the Gist URL failed (e.g., Gist is down, URL is wrong),
        // return an appropriate error code (502 Bad Gateway).
        if (!response.ok) {
            console.error(`Failed to fetch from Gist. Status: ${response.status} ${response.statusText}`);
            return new Response(
                JSON.stringify({ details: `Failed to retrieve settings from the source: ${response.statusText}` }),
                { 
                    status: 502, // Bad Gateway
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate' 
                    } 
                }
            );
        }

        // We expect the Gist to contain valid JSON. Let's parse it here to be sure.
        // This prevents forwarding malformed data to the client.
        const settingsJson = await response.json();

        // Successfully fetched and parsed. Send the data to the client.
        // Set strict no-cache headers to ensure the client always gets the latest version from this API endpoint.
        return new Response(JSON.stringify(settingsJson), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        // This will catch network errors (e.g., DNS failure) or JSON parsing errors.
        console.error("An unexpected error occurred in /api/get-settings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        
        return new Response(
            JSON.stringify({ details: `An internal error occurred: ${errorMessage}` }),
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate' 
                } 
            }
        );
    }
}
