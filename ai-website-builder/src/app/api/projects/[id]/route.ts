import { NextResponse } from 'next/server';

// This would be replaced with a database in production
let projects: any[] = [];

// GET single project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = projects.find(p => p.id === params.id);
    
    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("[PROJECT_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT update project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const projectIndex = projects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return new NextResponse("Project not found", { status: 404 });
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: projects[projectIndex] });
  } catch (error) {
    console.error("[PROJECT_PUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectIndex = projects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return new NextResponse("Project not found", { status: 404 });
    }

    projects.splice(projectIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROJECT_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}