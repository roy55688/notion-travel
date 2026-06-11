export async function handler(event) {

    const pageId = event.queryStringParameters.id;

    const response = await fetch(
        `https://api.notion.com/v1/blocks/${pageId}/children`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
                "Notion-Version": "2022-06-28"
            }
        }
    );

    const data = await response.json();

    const content = data.results.map(block => {

        if (block.type === "paragraph") {

            return {
                type: "paragraph",
                text: block.paragraph.rich_text
                    .map(t => t.plain_text)
                    .join("")
            };
        }

        return {
            type: block.type
        };
    });

    return {
        statusCode: 200,
        body: JSON.stringify(content)
    };
}