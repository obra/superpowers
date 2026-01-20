import { notionRequest } from '../notion-sync.js';

export class NotionAdapter {
    constructor(config) {
        this.databaseId = config.database_id;
        if (!this.databaseId) {
            throw new Error("Notion Adapter requires database_id config");
        }
    }

    async createTask(title, description = '', type = 'Task') {
        const properties = {
            Name: {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            },
            Status: {
                select: {
                    name: "Not Started" // Default status
                }
            },
            Type: {
                 select: {
                     name: type
                 }
            }
        };

        const response = await notionRequest('pages', 'POST', {
            parent: { database_id: this.databaseId },
            properties: properties,
            children: [
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: description } }]
                    }
                }
            ]
        });

        console.log(`Created Notion page: ${response.id}`);
        return { id: response.id, key: response.id, url: response.url };
    }

    async logWork(id, timeSpent, comment = '') {
        // Assuming there is a "Time Spent" text property.
        // Notion doesn't have native time tracking logs like Jira.
        // We will append to a text property or add a comment.
        // Let's add a comment for now as it's safer.

        await notionRequest('comments', 'POST', {
            parent: { page_id: id },
            rich_text: [
                {
                    text: {
                        content: `Work Logged: ${timeSpent} - ${comment}`
                    }
                }
            ]
        });
        console.log(`Logged work on Notion page ${id}`);
    }

    async createSubtask(parentId, title) {
        // Requires "Sub-item" / "Parent Item" relation property setup in Notion.
        // We will assume "Parent Item" property exists.

        const properties = {
            Name: {
                title: [{ text: { content: title } }]
            },
            "Parent Item": {
                relation: [{ id: parentId }]
            }
        };

        try {
            const response = await notionRequest('pages', 'POST', {
                parent: { database_id: this.databaseId },
                properties: properties
            });
            return { id: response.id, key: response.id, url: response.url };
        } catch (e) {
            console.warn("Failed to create subtask with relation, falling back to description checklist.");
            // Fallback: Add todo block to parent
            const response = await notionRequest(`blocks/${parentId}/children`, 'PATCH', {
                children: [
                    {
                        object: 'block',
                        type: 'to_do',
                        to_do: {
                            rich_text: [{ type: 'text', text: { content: `Subtask: ${title}` } }]
                        }
                    }
                ]
            });
            const fallbackId = response?.results?.[0]?.id || parentId;
            return { id: fallbackId, key: fallbackId, url: '' };
        }
    }
}
