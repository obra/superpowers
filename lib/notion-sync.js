import fs from 'fs';
import path from 'path';
import { loadConfig } from './config-core.js';

const config = loadConfig();
const NOTION_API_KEY = config.project_management.notion.api_key;
const NOTION_VERSION = '2022-06-28';

// Simple map file for local testing/fallback
const MAP_FILE = path.join(process.cwd(), '.superpowers', 'notion-map.json');

function getMap() {
    if (fs.existsSync(MAP_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
        } catch (err) {
            console.warn(`Warning: failed to parse ${MAP_FILE}; starting fresh.`);
        }
    }
    return {};
}

function saveMap(map) {
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
    fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
}

export async function notionRequest(endpoint, method = 'GET', body = null) {
    if (!NOTION_API_KEY) {
        throw new Error("Missing Notion API Key in config");
    }

    const headers = {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Notion API Error ${response.status}: ${text}`);
    }
    return response.json();
}

async function searchChildPage(title, parentId) {
    const response = await notionRequest('search', 'POST', {
        query: title,
        filter: {
            value: 'page',
            property: 'object'
        },
        page_size: 10
    });

    // Client-side filtering because Notion search is fuzzy and global
    const normalizeId = (id) => id?.replace(/-/g, '');
    const match = response.results.find(page => {
        const pageTitle = page.properties?.title?.title?.[0]?.plain_text ||
                          page.properties?.Name?.title?.[0]?.plain_text;

        const parentMatch = normalizeId(page.parent?.page_id) === normalizeId(parentId);
        return pageTitle === title && parentMatch;
    });

    return match ? match.id : null;
}

export async function ensurePage(title, parentId, content = "") {
    const map = getMap();
    // Key format: parentId/title to avoid collisions
    const key = `${parentId}/${title}`;

    // 1. Check map
    if (map[key]) {
        return map[key];
    }

    // 2. Search Notion
    let pageId = await searchChildPage(title, parentId);

    if (pageId) {
        console.log(`Found existing page for "${title}": ${pageId}`);
        map[key] = pageId;
        saveMap(map);
        return pageId;
    }

    // 3. Create Page
    console.log(`Creating new page for "${title}"...`);
    const newPage = await notionRequest('pages', 'POST', {
        parent: { page_id: parentId },
        properties: {
            title: [
                {
                    text: {
                        content: title
                    }
                }
            ]
        },
        children: content ? markdownToBlocks(content) : []
    });

    pageId = newPage.id;
    map[key] = pageId;
    saveMap(map);
    return pageId;
}

// Simple Markdown to Blocks converter (stub for now, can expand)
function markdownToBlocks(markdown) {
    const blocks = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
        if (line.startsWith('# ')) {
             blocks.push({
                object: 'block',
                type: 'heading_1',
                heading_1: {
                    rich_text: [{ type: 'text', text: { content: line.substring(2) } }]
                }
            });
        } else if (line.trim().length > 0) {
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: line } }]
                }
            });
        }
    }
    return blocks;
}


export async function archivePage(pageId) {
    console.log(`Archiving page ${pageId}...`);
    await notionRequest(`pages/${pageId}`, 'PATCH', {
        archived: true
    });

    // Remove from map
    const map = getMap();
    for (const [key, val] of Object.entries(map)) {
        if (val === pageId) {
            delete map[key];
        }
    }
    saveMap(map);
}

async function updatePageContent(pageId, content) {
    // Notion API replacement is complex (block management).
    // For MVP, we might just append or replace if possible, but Notion API doesn't support "replace all content" easily.
    // We would need to delete all blocks and append new ones.
    console.log(`Updating content for page ${pageId}...`);

    // 1. Get existing blocks
    const children = await notionRequest(`blocks/${pageId}/children`, 'GET');

    // 2. Delete existing blocks (batching helps, but doing one by one for safety/simplicity first)
    // Notion limits this. For a robust sync, this part needs care.
    // For this implementation plan, we will just Append if empty, or warn if not.
    if (children.results.length > 0) {
        console.log(`Page ${pageId} is not empty. Skipping content overwrite for safety in MVP.`);
        // In full version: Archive all children blocks, then append new ones.
        return;
    }

    // 3. Append new blocks
    const newBlocks = markdownToBlocks(content);
    // Notion allows appending up to 100 blocks
    const chunks = [];
    while(newBlocks.length > 0) chunks.push(newBlocks.splice(0, 100));

    for (const chunk of chunks) {
        await notionRequest(`blocks/${pageId}/children`, 'PATCH', {
            children: chunk
        });
    }
}

export async function syncFile(filePath, parentPageId) {
    const filename = path.basename(filePath);
    const title = filename.replace(/\.md$/, ''); // remove extension for title
    const content = fs.readFileSync(filePath, 'utf8');

    const pageId = await ensurePage(title, parentPageId);
    await updatePageContent(pageId, content);
    return pageId;
}

export async function syncDirectory(dirPath, parentPageId) {
    console.log(`Syncing directory ${dirPath} to ${parentPageId}...`);
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
            if (item.name.startsWith('.')) continue; // skip hidden dirs
            const dirPageId = await ensurePage(item.name, parentPageId);
            await syncDirectory(itemPath, dirPageId);
        } else if (item.isFile() && item.name.endsWith('.md')) {
             await syncFile(itemPath, parentPageId);
        }
    }
}


// CLI Entry point
if (process.argv[1] === import.meta.filename) {
    const args = process.argv.slice(2);
    const modeIndex = args.findIndex(arg => arg === '--file' || arg === '--dir');

    if (modeIndex === -1) {
        console.error("Usage: node lib/notion-sync.js --file <path> | --dir <path>");
        process.exit(1);
    }

    const mode = args[modeIndex];
    const targetPath = args[modeIndex + 1];

    if (!targetPath) {
        console.error("Missing path argument");
        process.exit(1);
    }

    const rootPageId = config.documentation?.notion_root_page_id || config.project_management?.notion?.root_page_id;
    if (!rootPageId) {
        console.error("Missing documentation.notion_root_page_id in config");
        process.exit(1);
    }

    try {
        if (mode === '--file') {
             // For single file, we need to figure out its parent hierarchy if it's nested deep.
             // For MVP, we'll just sync it to root or handle simple case.
             // Ideally we run syncDirectory on its parent dir, but that might be heavy.
             // We'll calculate relative path from project root or docs root.

             // Assuming targetPath is inside docs/
             const docsRoot = config.documentation?.root_dir || 'docs';
             const absDocsRoot = path.resolve(process.cwd(), docsRoot);
             const absTarget = path.resolve(process.cwd(), targetPath);

             if (absTarget.startsWith(absDocsRoot)) {
                 // It's inside the docs root.
                 // We need to walk down the pages from rootPageId.
                 // This requires ensuring all folders in between exist.
                 // We can reuse syncDirectory logic by syncing the *directory* containing the file?
                 // Or just implement path-walking logic.

                 // Let's implement path walking for single file:
                 const relativePath = path.relative(absDocsRoot, absTarget);
                 const parts = relativePath.split(path.sep);
                 const fileName = parts.pop(); // remove file
                 let currentParentId = rootPageId;

                 // Ensure folders
                 for (const folder of parts) {
                     currentParentId = await ensurePage(folder, currentParentId);
                 }

                 await syncFile(absTarget, currentParentId);
             } else {
                 console.log("File is outside configured docs root, syncing directly to root page...");
                 await syncFile(absTarget, rootPageId);
             }

        } else if (mode === '--dir') {
            await syncDirectory(targetPath, rootPageId);
        }
        console.log("Sync complete.");
    } catch (err) {
        console.error("Sync failed:", err);
        process.exit(1);
    }
}

