import { NextResponse } from 'next/server';

// In-memory storage for demo (in production, use a database)
let projects: any[] = [
  {
    id: "1",
    name: "My Portfolio",
    description: "Personal portfolio website",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: true,
    url: "https://myportfolio.example.com",
    data: null
  },
  {
    id: "2",
    name: "Business Landing Page",
    description: "Landing page for my startup",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: false,
    url: null,
    data: null
  }
];

// GET all projects
export async function GET(request: Request) {
  try {
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("[PROJECTS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST create new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const newProject = {
      id: Date.now().toString(),
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: false,
      url: null,
      data: null
    };

    projects.push(newProject);

    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    console.error("[PROJECTS_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}