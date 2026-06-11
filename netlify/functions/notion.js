export async function handler() {

    return {
        statusCode: 200,
        body: JSON.stringify({
            tokenExists: !!process.env.NOTION_TOKEN,
            databaseExists: !!process.env.NOTION_DATABASE_ID
        })
    };
}