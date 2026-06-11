export async function handler(event) {

    const pageId = event.queryStringParameters.id;

    return {
        statusCode: 200,
        body: JSON.stringify({
            pageId
        })
    };
}