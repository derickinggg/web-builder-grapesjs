import { NextResponse } from 'next/server';

// Export project as HTML
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you would fetch this from a database
    // For now, return a mock response
    const mockHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Website</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #333;
      }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Your Website</h1>
        <p>This is your exported website from AI Website Builder.</p>
    </div>
</body>
</html>`;

    return new NextResponse(mockHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="website-${params.id}.html"`,
      },
    });
  } catch (error) {
    console.error("[PROJECT_EXPORT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}