import { NextResponse } from 'next/server';

const templates = [
  {
    id: "portfolio-1",
    name: "Creative Portfolio",
    description: "Perfect for designers and artists",
    category: "portfolio",
    thumbnail: "/api/placeholder/400/300",
    html: `
      <section class="hero">
        <h1>Your Name</h1>
        <p>Creative Professional</p>
      </section>
      <section class="portfolio">
        <h2>My Work</h2>
        <div class="grid">
          <div class="item">Project 1</div>
          <div class="item">Project 2</div>
          <div class="item">Project 3</div>
        </div>
      </section>
    `,
    css: `
      .hero {
        text-align: center;
        padding: 100px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .portfolio {
        padding: 50px 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 30px;
      }
      .item {
        background: #f5f5f5;
        padding: 40px;
        border-radius: 10px;
        text-align: center;
      }
    `
  },
  {
    id: "business-1",
    name: "Business Landing",
    description: "Professional business website template",
    category: "business",
    thumbnail: "/api/placeholder/400/300",
    html: `
      <header>
        <nav>
          <div class="logo">Your Business</div>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>
      <section class="hero">
        <h1>Welcome to Your Business</h1>
        <p>Professional solutions for modern challenges</p>
        <button>Get Started</button>
      </section>
    `,
    css: `
      header {
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        padding: 20px;
      }
      nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
      }
      ul {
        display: flex;
        list-style: none;
        gap: 30px;
      }
      a {
        text-decoration: none;
        color: #333;
      }
      .hero {
        text-align: center;
        padding: 100px 20px;
        background: #f8f9fa;
      }
      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
      }
    `
  },
  {
    id: "blog-1",
    name: "Modern Blog",
    description: "Clean and minimalist blog template",
    category: "blog",
    thumbnail: "/api/placeholder/400/300",
    html: `
      <header>
        <h1>My Blog</h1>
        <p>Thoughts and ideas</p>
      </header>
      <main>
        <article>
          <h2>Blog Post Title</h2>
          <p class="meta">Published on January 1, 2024</p>
          <p>This is the beginning of your blog post content...</p>
          <a href="#" class="read-more">Read More →</a>
        </article>
      </main>
    `,
    css: `
      body {
        font-family: Georgia, serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      header {
        text-align: center;
        margin-bottom: 50px;
      }
      article {
        margin-bottom: 40px;
        padding-bottom: 40px;
        border-bottom: 1px solid #eee;
      }
      .meta {
        color: #666;
        font-style: italic;
      }
      .read-more {
        color: #007bff;
        text-decoration: none;
      }
    `
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let filteredTemplates = templates;
    if (category) {
      filteredTemplates = templates.filter(t => t.category === category);
    }
    
    return NextResponse.json({ success: true, data: filteredTemplates });
  } catch (error) {
    console.error("[TEMPLATES_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}