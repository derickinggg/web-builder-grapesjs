import { NextResponse } from 'next/server';

// Note: In production, you would use OpenAI API here
// For now, we'll create a mock response

export async function POST(request: Request) {

  try {
    const { prompt, type } = await request.json();

    // Mock AI response
    // In production, you would call OpenAI API here
    const mockTemplates = {
      portfolio: {
        html: `
          <section class="hero-section">
            <div class="container">
              <h1>Welcome to My Portfolio</h1>
              <p>I'm a creative professional passionate about design and technology</p>
              <a href="#" class="btn-primary">View My Work</a>
            </div>
          </section>
          <section class="about-section">
            <div class="container">
              <h2>About Me</h2>
              <p>With years of experience in the industry, I bring creativity and innovation to every project.</p>
            </div>
          </section>
          <section class="portfolio-section">
            <div class="container">
              <h2>My Work</h2>
              <div class="portfolio-grid">
                <div class="portfolio-item">Project 1</div>
                <div class="portfolio-item">Project 2</div>
                <div class="portfolio-item">Project 3</div>
              </div>
            </div>
          </section>
        `,
        css: `
          .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 0;
            text-align: center;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .btn-primary {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            margin-top: 20px;
          }
          .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 40px;
          }
          .portfolio-item {
            background: #f5f5f5;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
          }
        `
      },
      business: {
        html: `
          <header class="header">
            <nav class="navbar">
              <div class="container">
                <div class="logo">Your Business</div>
                <ul class="nav-menu">
                  <li><a href="#home">Home</a></li>
                  <li><a href="#services">Services</a></li>
                  <li><a href="#about">About</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
            </nav>
          </header>
          <section class="hero">
            <div class="container">
              <h1>Grow Your Business With Us</h1>
              <p>Professional solutions for modern businesses</p>
              <button class="cta-button">Get Started</button>
            </div>
          </section>
          <section class="features">
            <div class="container">
              <h2>Our Services</h2>
              <div class="features-grid">
                <div class="feature-card">
                  <h3>Service 1</h3>
                  <p>Description of your amazing service</p>
                </div>
                <div class="feature-card">
                  <h3>Service 2</h3>
                  <p>Description of your amazing service</p>
                </div>
                <div class="feature-card">
                  <h3>Service 3</h3>
                  <p>Description of your amazing service</p>
                </div>
              </div>
            </div>
          </section>
        `,
        css: `
          .header {
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          .navbar {
            padding: 1rem 0;
          }
          .navbar .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
          }
          .nav-menu {
            display: flex;
            list-style: none;
            gap: 2rem;
            margin: 0;
            padding: 0;
          }
          .nav-menu a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
          }
          .hero {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 100px 0;
            text-align: center;
          }
          .cta-button {
            background: white;
            color: #3b82f6;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 1.1rem;
            cursor: pointer;
            margin-top: 20px;
          }
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 40px;
          }
          .feature-card {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
          }
        `
      }
    };

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return appropriate template based on type or prompt
    const template = type === 'portfolio' ? mockTemplates.portfolio : mockTemplates.business;

    return NextResponse.json({
      success: true,
      data: {
        html: template.html,
        css: template.css,
        components: []
      }
    });

  } catch (error) {
    console.error("[AI_GENERATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}