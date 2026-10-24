import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const pages: Record<string, { title: string; content: string }> = {
  about: {
    title: 'About RS-BUILDER',
    content: `
RS-BUILDER is a hands-on AI builder that produces real deliverables — not advice.

## Our Mission

We believe AI should create, not just suggest. RS-BUILDER bridges the gap between "here's how you could do it" and "here's your finished artifact."

## How It Works

1. **Describe** what you want to build
2. **Plan** — the agent breaks it down into steps
3. **Build** — real code runs in a sandbox
4. **Deliver** — get a working artifact with a permanent link

## Technology

RS-BUILDER uses a multi-model chain of free-tier LLMs with automatic failover. Every run executes in a real sandbox with filesystem, shell, and network access.

## Open Source

RS-BUILDER is open source under the MIT license. Deploy it yourself, contribute, or customize it for your needs.

## Team

RS-BUILDER is built by a small team passionate about making AI tools that actually work.
    `,
  },
  careers: {
    title: 'Careers',
    content: `
We're building the future of AI-powered development tools.

## Current Openings

We're a small, remote-first team. While we don't have specific openings listed right now, we're always interested in hearing from talented people.

## What We Value

- **Ship fast**: We prefer working software over perfect plans
- **Be honest**: If something doesn't work, say so
- **Think users-first**: Every feature should solve a real problem
- **Open source**: We believe in building in the open

## Benefits

- Remote-first, async-friendly
- Competitive compensation
- Equity participation
- Conference budget
- Flexible hours
    `,
  },
  changelog: {
    title: 'Changelog',
    content: `
## v2.0.0 — October 2026

### Major Changes
- Real sandbox execution (no more simulation)
- Resume tokens for tab-survival
- Multi-model chain with free-tier support
- Artifact hosting with permanent URLs
- Queue system with cursor-based replay

### Improvements
- New workspace UI with thread/plan/preview panels
- Sandbox editor with live preview
- File management with download/export
- Settings panel for API keys and configuration

### Bug Fixes
- Fixed SSE reconnection on network loss
- Fixed artifact rendering in iframe sandbox
- Fixed credit counting for multi-step runs

## v1.5.0 — September 2026
- Added blog system
- Brand kit page
- i18n support (EN/RU)
- Dark/light/system themes

## v1.0.0 — August 2026
- Initial release
- Landing page with hero composer
- Pricing page
- Basic workspace with simulated agent
    `,
  },
  security: {
    title: 'Security',
    content: `
## Security Overview

RS-BUILDER takes security seriously. Here's how we protect your data and code.

## Sandbox Isolation

Every code execution runs in an isolated environment:
- Ephemeral filesystem (cleaned after each run)
- Sanitized environment variables (no secrets leaked)
- Platform-level isolation (Vercel microVMs)

## Data Handling

- **API keys**: Stored only in your browser (localStorage), never on our servers
- **Artifacts**: Public by default on free tier, private on paid plans
- **Prompts**: Not stored permanently; used only for the current run
- **Session data**: Ephemeral, cleared after run completion

## Authentication

- Demo mode: Any credentials work (for testing)
- Production: Email/password with bcrypt hashing
- API: Bearer token authentication

## Infrastructure

- Deployed on Vercel (SOC 2 compliant)
- HTTPS everywhere
- CSP headers configured
- No third-party trackers

## Reporting Vulnerabilities

If you find a security issue, please email security@rs-builder.app. We appreciate responsible disclosure.
    `,
  },
  terms: {
    title: 'Terms of Service',
    content: `
## Terms of Service

Last updated: October 2026

### 1. Acceptance of Terms

By using RS-BUILDER, you agree to these terms.

### 2. Description of Service

RS-BUILDER is an AI-powered development tool that generates code artifacts based on user prompts.

### 3. User Responsibilities

- You are responsible for the content of your prompts
- You must not use the service for illegal purposes
- You must not attempt to circumvent security measures

### 4. Intellectual Property

- Artifacts you generate are yours to use
- RS-BUILDER's code and design remain our property
- Open-source components retain their original licenses

### 5. Limitations

- The service is provided "as is" without warranty
- We don't guarantee artifact quality or correctness
- Free tier has usage limits (50 credits/month)

### 6. Termination

We may terminate access for violations of these terms.

### 7. Changes

We may update these terms. Continued use constitutes acceptance.

### 8. Contact

Questions? Email legal@rs-builder.app
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
## Privacy Policy

Last updated: October 2026

### What We Collect

- **Account info**: Email, name (for registered users)
- **Usage data**: Prompts, generated artifacts (ephemeral)
- **Technical data**: IP address, browser type, device info

### What We Don't Collect

- We don't track your browsing outside our site
- We don't sell your data to third parties
- We don't use your prompts for training

### How We Use Data

- To provide the service (process prompts, generate artifacts)
- To improve the product (aggregate usage statistics)
- To communicate with you (account notifications)

### Data Storage

- API keys: Stored in your browser only
- Artifacts: Stored temporarily during generation, then hosted if published
- Account data: Stored securely on Vercel infrastructure

### Your Rights

- Access your data
- Delete your account and data
- Export your artifacts
- Opt out of non-essential communications

### Cookies

We use minimal cookies for:
- Authentication session
- Theme preference
- Language preference

### Contact

Privacy questions? Email privacy@rs-builder.app
    `,
  },
};

export default function Legal() {
  const { slug } = useParams();
  const page = slug ? pages[slug] : null;

  if (!page) {
    return (
      <main className="pt-24 pb-20 text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>Page not found</h1>
        <Link to="/" className="text-brand-500">← Go home</Link>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 mb-8">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--text)' }}>{page.title}</h1>
        <div className="prose max-w-none" style={{ color: 'var(--text-secondary)' }}>
          {page.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-3" style={{ color: 'var(--text)' }}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-6 mb-2" style={{ color: 'var(--text)' }}>{line.replace('### ', '')}</h3>;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-3">{line}</p>;
          })}
        </div>
      </div>
    </main>
  );
}
