export async function handler() {

    const response = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            }
        }
    );

    const data = await response.json();
	
	const cleanData = data.results.map(item => {

		const props = item.properties;

		return {

			name:
				props.Name?.title?.[0]?.plain_text ?? "",

			date:
				props.Time?.date?.start ?? "",

			tag:
				props["標籤"]?.select?.name ?? "",

			mapUrl:
				props["google map連結"]?.url ?? ""

		};
	});

    return {
        statusCode: 200,
        body: JSON.stringify(cleanData)
    };
}