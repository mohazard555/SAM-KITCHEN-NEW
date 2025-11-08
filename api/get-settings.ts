// This Vercel Edge Function acts as a secure, robust proxy to fetch the LATEST settings.
// It dynamically finds the most recent commit SHA for a Gist to bypass CDN caching issues.
export const config = {
    runtime: 'edge',
};

export default async function handler(_request: Request) {
    const GIST_ID = process.env.GIST_ID;
    // Using a token for the GitHub API is highly recommended to avoid rate limits
    const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN; 

    if (!GIST_ID) {
        console.error("Server configuration error: GIST_ID environment variable is not set.");
        return new Response(JSON.stringify({ details: "The server is not configured correctly. The GIST_ID is missing." }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    try {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
        };
        if (GITHUB_API_TOKEN) {
            // Using 'token' for consistency with how it's used in the Admin Panel
            headers['Authorization'] = `token ${GITHUB_API_TOKEN}`;
        }

        // 1. Fetch Gist details to find the latest commit SHA and file info
        const gistApiUrl = `https://api.github.com/gists/${GIST_ID}`;
        
        // Use 'no-store' to ensure we get fresh Gist metadata from GitHub's API
        const gistResponse = await fetch(gistApiUrl, { headers, cache: 'no-store' });

        if (!gistResponse.ok) {
            const errorText = await gistResponse.text();
            console.error(`Failed to fetch Gist details. Status: ${gistResponse.status}. Body: ${errorText}`);
            return new Response(JSON.stringify({ details: `Failed to retrieve Gist details: ${gistResponse.statusText}` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
        }

        const gistData = await gistResponse.json();
        
        // 2. Extract necessary info to build the commit-specific raw URL
        const latestCommitSha = gistData.history?.[0]?.version;
        const ownerLogin = gistData.owner?.login;
        const filename = Object.keys(gistData.files)[0];

        if (!latestCommitSha || !ownerLogin || !filename) {
            console.error("Could not extract necessary details (commit SHA, owner, filename) from Gist API response.", { latestCommitSha, ownerLogin, filename });
            return new Response(JSON.stringify({ details: "Incomplete data from Gist API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Construct the immutable, cache-busting URL
        const immutableRawUrl = `https://gist.githubusercontent.com/${ownerLogin}/${GIST_ID}/raw/${latestCommitSha}/${filename}`;

        // 4. Fetch the actual settings content from this new URL, again avoiding any caches
        const settingsResponse = await fetch(immutableRawUrl, { cache: 'no-store' });

        if (!settingsResponse.ok) {
            console.error(`Failed to fetch from Gist raw URL. Status: ${settingsResponse.status}`);
            return new Response(JSON.stringify({ details: `Failed to retrieve settings content: ${settingsResponse.statusText}` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
        }

        const settingsJson = await settingsResponse.json();

        // 5. Return the settings to the client
        return new Response(JSON.stringify(settingsJson), {
            status: 200,
            headers: {
                // These headers are important for the browser's cache of THIS API endpoint
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error("An unexpected error occurred in /api/get-settings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ details: `An internal error occurred: ${errorMessage}` }), { 
            status: 500, 
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate' 
            } 
        });
    }
}