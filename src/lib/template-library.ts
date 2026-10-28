/**
 * Template Library — pre-built project templates for quick start.
 * Provides ready-to-use templates for various project types.
 */

import type { VirtualFS } from './virtual-fs';

export type TemplateCategory = 'web' | 'app' | 'game' | 'presentation' | 'dashboard';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  preview?: string;
  files: Record<string, string>;
}

export const TEMPLATES: Template[] = [
  // Web Templates
  {
    id: 'landing-page',
    name: 'Modern Landing Page',
    description: 'Responsive landing page with hero, features, and CTA sections',
    category: 'web',
    tags: ['html', 'css', 'responsive', 'marketing'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Landing Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <div class="logo">Brand</div>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section class="hero">
    <h1>Build Something Amazing</h1>
    <p>Create beautiful websites in minutes with our platform</p>
    <button class="cta-button">Get Started</button>
  </section>

  <section id="features" class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h3>Fast</h3>
        <p>Lightning fast performance</p>
      </div>
      <div class="feature-card">
        <h3>Secure</h3>
        <p>Enterprise-grade security</p>
      </div>
      <div class="feature-card">
        <h3>Scalable</h3>
        <p>Grows with your business</p>
      </div>
    </div>
  </section>

  <footer>
    <p>&copy; 2026 Brand. All rights reserved.</p>
  </footer>
</body>
</html>`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}

header {
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #6366f1;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #6366f1;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 6rem 2rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.features {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
}

.features h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  border-radius: 10px;
  background: #f8f9fa;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.feature-card h3 {
  color: #6366f1;
  margin-bottom: 1rem;
}

footer {
  background: #1a1a1a;
  color: white;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
}`,
    },
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'Personal portfolio website for developers',
    category: 'web',
    tags: ['html', 'css', 'portfolio', 'personal'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Portfolio</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>John Doe</h1>
    <p class="tagline">Full Stack Developer</p>
  </header>

  <section class="about">
    <h2>About Me</h2>
    <p>I'm a passionate developer with 5+ years of experience building web applications.</p>
  </section>

  <section class="skills">
    <h2>Skills</h2>
    <div class="skill-tags">
      <span class="tag">JavaScript</span>
      <span class="tag">React</span>
      <span class="tag">Node.js</span>
      <span class="tag">TypeScript</span>
      <span class="tag">Python</span>
    </div>
  </section>

  <section class="projects">
    <h2>Projects</h2>
    <div class="project-grid">
      <div class="project-card">
        <h3>Project One</h3>
        <p>A web application built with React and Node.js</p>
      </div>
      <div class="project-card">
        <h3>Project Two</h3>
        <p>Mobile app developed with React Native</p>
      </div>
    </div>
  </section>

  <section class="contact">
    <h2>Contact</h2>
    <p>Email: john@example.com</p>
    <p>GitHub: github.com/johndoe</p>
  </section>
</body>
</html>`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: #2d3748;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  padding: 4rem 0;
  border-bottom: 2px solid #e2e8f0;
}

header h1 {
  font-size: 3rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.25rem;
  color: #718096;
}

section {
  padding: 3rem 0;
  border-bottom: 1px solid #e2e8f0;
}

h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #1a202c;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #6366f1;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.project-grid {
  display: grid;
  gap: 1.5rem;
}

.project-card {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
}

.project-card h3 {
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.contact p {
  margin-bottom: 0.5rem;
}`,
    },
  },
  // App Templates
  {
    id: 'react-starter',
    name: 'React Starter',
    description: 'Modern React application with TypeScript and Vite',
    category: 'app',
    tags: ['react', 'typescript', 'vite', 'modern'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
      'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      'src/App.tsx': `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>React + TypeScript + Vite</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      </div>
    </div>
  );
}

export default App;`,
      'src/index.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  margin-bottom: 1rem;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #646cff;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

code {
  background: #f1f1f1;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}`,
    },
  },
  // Game Templates
  {
    id: 'canvas-game',
    name: 'Canvas Game',
    description: 'HTML5 Canvas game template with game loop',
    category: 'game',
    tags: ['html5', 'canvas', 'game', 'javascript'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      font-family: Arial, sans-serif;
    }
    canvas {
      border: 2px solid #16213e;
      background: #0f3460;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    .info {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="info">Score: <span id="score">0</span></div>
  <canvas id="game" width="800" height="600"></canvas>
  <script src="game.js"></script>
</body>
</html>`,
      'game.js': `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game state
let score = 0;
let player = { x: 400, y: 300, size: 20, speed: 5 };
let targets = [];

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Spawn target
function spawnTarget() {
  targets.push({
    x: Math.random() * (canvas.width - 20),
    y: Math.random() * (canvas.height - 20),
    size: 15,
  });
}

// Initial targets
for (let i = 0; i < 5; i++) spawnTarget();

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update player
  if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
  if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

  // Keep player in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Draw player
  ctx.fillStyle = '#e94560';
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Update and draw targets
  for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    
    // Check collision
    if (
      player.x < target.x + target.size &&
      player.x + player.size > target.x &&
      player.y < target.y + target.size &&
      player.y + player.size > target.y
    ) {
      targets.splice(i, 1);
      score++;
      scoreElement.textContent = score;
      spawnTarget();
    } else {
      // Draw target
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(target.x, target.y, target.size, target.size);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();`,
    },
  },
  // Presentation Templates
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Professional pitch deck presentation template',
    category: 'presentation',
    tags: ['html', 'css', 'presentation', 'slides'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pitch Deck</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="deck">
    <section class="slide active">
      <h1>Company Name</h1>
      <p class="subtitle">Revolutionizing the Industry</p>
    </section>

    <section class="slide">
      <h2>The Problem</h2>
      <p>Describe the problem you're solving</p>
      <ul>
        <li>Pain point 1</li>
        <li>Pain point 2</li>
        <li>Pain point 3</li>
      </ul>
    </section>

    <section class="slide">
      <h2>Our Solution</h2>
      <p>How you solve the problem</p>
    </section>

    <section class="slide">
      <h2>Market Size</h2>
      <p class="big-number">$100B</p>
      <p>Total Addressable Market</p>
    </section>

    <section class="slide">
      <h2>Business Model</h2>
      <p>How you make money</p>
    </section>

    <section class="slide">
      <h2>Team</h2>
      <p>Meet the founders</p>
    </section>

    <section class="slide">
      <h2>Ask</h2>
      <p class="big-number">$2M</p>
      <p>Seed Round</p>
    </section>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a1a;
  overflow: hidden;
}

.deck {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.slide {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  opacity: 0;
  transition: opacity 0.5s;
}

.slide.active {
  opacity: 1;
}

h1 {
  font-size: 5rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 3.5rem;
  margin-bottom: 2rem;
}

.subtitle {
  font-size: 1.5rem;
  opacity: 0.9;
}

.big-number {
  font-size: 6rem;
  font-weight: bold;
  margin: 1rem 0;
}

ul {
  list-style: none;
  font-size: 1.5rem;
}

li {
  margin: 1rem 0;
}

p {
  font-size: 1.5rem;
  text-align: center;
  max-width: 800px;
}`,
      'script.js': `const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    prevSlide();
  }
});

// Initialize
showSlide(0);`,
    },
  },
  // Dashboard Templates
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    description: 'Modern admin dashboard with charts and tables',
    category: 'dashboard',
    tags: ['html', 'css', 'dashboard', 'admin'],
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="logo">Admin</div>
      <nav>
        <a href="#" class="active">Dashboard</a>
        <a href="#">Users</a>
        <a href="#">Analytics</a>
        <a href="#">Settings</a>
      </nav>
    </aside>

    <main class="content">
      <header>
        <h1>Dashboard</h1>
        <div class="user-info">Welcome, Admin</div>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-value">1,234</p>
          <p class="stat-change positive">+12%</p>
        </div>
        <div class="stat-card">
          <h3>Revenue</h3>
          <p class="stat-value">$45,678</p>
          <p class="stat-change positive">+8%</p>
        </div>
        <div class="stat-card">
          <h3>Orders</h3>
          <p class="stat-value">567</p>
          <p class="stat-change negative">-3%</p>
        </div>
        <div class="stat-card">
          <h3>Active Now</h3>
          <p class="stat-value">89</p>
          <p class="stat-change positive">+24%</p>
        </div>
      </div>

      <div class="chart-container">
        <h2>Recent Activity</h2>
        <div class="chart-placeholder">
          Chart will be rendered here
        </div>
      </div>
    </main>
  </div>
</body>
</html>`,
      'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #1a1a2e;
  color: white;
  padding: 2rem 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0 2rem 2rem;
  border-bottom: 1px solid #2a2a3e;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.sidebar a {
  color: #a0a0a0;
  text-decoration: none;
  padding: 1rem 2rem;
  transition: all 0.3s;
}

.sidebar a:hover,
.sidebar a.active {
  background: #2a2a3e;
  color: white;
}

.content {
  flex: 1;
  padding: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  color: #1a1a2e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.stat-card h3 {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.875rem;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.chart-container {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.chart-container h2 {
  margin-bottom: 1.5rem;
  color: #1a1a2e;
}

.chart-placeholder {
  height: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}`,
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Apply template to filesystem
 */
export function applyTemplate(template: Template, fs: VirtualFS): void {
  for (const [path, content] of Object.entries(template.files)) {
    fs.write(path, content);
  }
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all categories
 */
export function getCategories(): TemplateCategory[] {
  return ['web', 'app', 'game', 'presentation', 'dashboard'];
}
