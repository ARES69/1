import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { useI18n } from '../i18n';

const posts = [
  {
    slug: 'v2-release',
    title: 'RS-BUILDER v2.0: Real Sandbox Execution',
    excerpt: 'We\'re excited to announce the release of RS-BUILDER v2.0, featuring real sandbox execution, resume tokens, and multi-model chain support.',
    date: '2026-10-15',
    readTime: '5 min',
    tags: ['release', 'sandbox', 'v2'],
    content: `
## What's New in v2.0

RS-BUILDER v2.0 brings a complete overhaul of the execution engine. Instead of simulating code execution, every run now uses a **real sandbox** with actual filesystem, shell, and network access.

### Real Sandbox

Code executes in an isolated environment with:
- Full filesystem access (read/write/edit files)
- Shell commands via /bin/sh
- Node.js process execution
- Network access for fetching resources

### Resume Tokens

Your runs now survive tab closures. Every step boundary emits a resume token that the browser stores locally. Close the tab, come back later — pick up right where you left off.

### Multi-Model Chain

We've implemented a free-tier model chain that automatically falls back through multiple providers:
1. OpenCode Zen
2. OpenRouter :free models
3. Groq / Gemini / Mistral / NVIDIA NIM

### Artifact Hosting

Every completed artifact now gets a permanent public URL. Share your creations or iterate on them with version history.
    `,
  },
  {
    slug: 'free-models',
    title: 'How We Run AI at $0 Cost',
    excerpt: 'A deep dive into our free-model chain architecture that powers RS-BUILDER without any inference costs.',
    date: '2026-10-10',
    readTime: '8 min',
    tags: ['architecture', 'free-models', 'llm'],
    content: `
## The Free-Model Challenge

Running an AI agent at scale is expensive. We set out to build RS-BUILDER so that the core experience costs $0 in inference. Here's how we did it.

### The Chain Pattern

Instead of relying on a single model, we chain multiple free-tier providers:

\`\`\`
OpenCode Zen → OpenRouter :free → Groq → Gemini → Mistral → NIM
\`\`\`

Each provider has a free tier with generous limits. By chaining them, we get:
- Automatic failover when one provider is down
- Load distribution across providers
- Rate limit resilience

### Smart Routing

Not all tasks need the same model. We route based on:
- Task complexity (simple → fast model, complex → powerful model)
- Tool-calling requirements (some free models support tools, some don't)
- Current rate limit status

### Cost Optimization

For paid users who want premium models, we still optimize:
- Cache repeated prompts
- Use cheaper models for planning steps
- Only use expensive models for final generation
    `,
  },
  {
    slug: 'sandbox-security',
    title: 'Sandbox Security: How We Isolate Code',
    excerpt: 'Understanding the security boundaries of our sandbox execution environment and what it means for your code.',
    date: '2026-10-05',
    readTime: '6 min',
    tags: ['security', 'sandbox', 'isolation'],
    content: `
## Security Architecture

Every code execution in RS-BUILDER runs in an isolated sandbox. Here's what that means.

### Isolation Layers

1. **Platform isolation**: On Vercel, each Lambda runs in its own microVM
2. **Filesystem isolation**: Ephemeral /tmp directory, cleaned after execution
3. **Environment isolation**: Child processes get a sanitized env (no secrets)
4. **Network isolation**: Configurable per-deployment

### What Code CAN Do

- Read/write files in the project directory
- Execute shell commands
- Make network requests
- Run Node.js with full standard library

### What Code CANNOT Do

- Access environment variables with secrets
- Read files outside the project directory
- Persist data between runs (unless using artifact hosting)
- Access other users' data

### Degradation Modes

If the sandbox can't run (e.g., restricted hosting), we degrade gracefully:
- \`run_shell\` reports "unavailable"
- \`run_code\` falls back to in-process VM
- Status indicators show the current mode
    `,
  },
  {
    slug: 'getting-started',
    title: 'Getting Started with RS-BUILDER',
    excerpt: 'A beginner\'s guide to using RS-BUILDER effectively. Tips, tricks, and best practices for getting great artifacts.',
    date: '2026-10-01',
    readTime: '4 min',
    tags: ['guide', 'tutorial', 'tips'],
    content: `
## Your First Build

RS-BUILDER makes it easy to go from idea to artifact. Here's how to get the best results.

### Writing Good Prompts

The more specific you are, the better the output:

**Vague**: "Make a website"
**Better**: "Create a landing page for a coffee shop with a hero section, menu grid, and contact form"
**Best**: "Build a responsive landing page for 'Bean & Brew' coffee shop. Include: a hero with tagline and CTA, a 6-item menu grid with prices, testimonials carousel, and a contact form. Use warm brown and cream colors."

### Iterating on Results

Don't expect perfection on the first try. Use the workspace to:
1. Review the generated files
2. Edit directly in the sandbox editor
3. Click "Continue with my edits" to have the agent build on your changes

### Using the Preview

The live preview shows your artifact as it's being built. Use it to:
- Verify layout and styling
- Test interactions
- Check responsiveness (resize the panel)

### Downloading & Sharing

When you're happy with the result:
- Download individual files or the whole project as .zip
- Share the permanent artifact URL
- Fork it into a new version for further iteration
    `,
  },
];

export default function Blog() {
  const { slug } = useParams();
  const { t } = useI18n();

  // Single post view
  if (slug) {
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      return (
        <main className="pt-24 pb-20 text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Post not found</h1>
          <Link to="/blog" className="text-brand-500 mt-4 inline-block">← Back to blog</Link>
        </main>
      );
    }

    return (
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 mb-8">
            <ArrowLeft size={14} /> Back to blog
          </Link>
          <article>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{post.title}</h1>
            <div className="flex items-center gap-4 mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {post.readTime}</span>
            </div>
            <div className="flex gap-2 mb-8">
              {post.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium bg-brand-500/10 text-brand-500">{tag}</span>
              ))}
            </div>
            <div className="prose max-w-none" style={{ color: 'var(--text-secondary)' }}>
              {post.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4" style={{ color: 'var(--text)' }}>{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mt-6 mb-3" style={{ color: 'var(--text)' }}>{line.replace('### ', '')}</h3>;
                if (line.startsWith('```')) return null;
                if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="mb-3">{line}</p>;
              })}
            </div>
          </article>
        </div>
      </main>
    );
  }

  // Blog list
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>Blog</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Updates, guides, and insights from the RS-BUILDER team</p>
        </div>
        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="block p-6 rounded-2xl border transition-all hover:border-brand-500/50 hover:shadow-lg group"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                <div className="flex items-center gap-4 mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text)' }}>
                  {post.title}
                </h2>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{post.excerpt}</p>
                <div className="flex gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-brand-500/10 text-brand-500">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
