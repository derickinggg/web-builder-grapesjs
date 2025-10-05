import { NextResponse } from 'next/server';

// In-memory storage for demo
const projectData = new Map<string, any>();

// POST save project data
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { projectData: data, html, css } = body;

    // Store the project data
    projectData.set(params.id, {
      projectData: data,
      html,
      css,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: "Project saved successfully" 
    });
  } catch (error) {
    console.error("[PROJECT_SAVE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET project data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = projectData.get(params.id);
    
    if (!data) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[PROJECT_DATA_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}