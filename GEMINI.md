# GEMINI.md - Project Context for Gemini CLI

This document provides essential context about the `article-pipeline` project for the Gemini CLI. It outlines the project's purpose, architecture, key commands, and development conventions.

## Project Overview

This is a TypeScript-based automation pipeline designed to create, review, and publish SEO-optimized Japanese articles to a WordPress blog. The workflow is heavily integrated with AI, intended to be driven by an assistant like Gemini or Claude Code through a series of "skills" defined as Markdown files.

The core process involves:
1.  **AI-driven Content Generation**: Using skills like `/generate` to analyze keywords, research competitors, and produce an article draft.
2.  **Automated Review**: Employing AI agents for quality checks, fact-checking, and style consistency.
3.  **Human-in-the-loop**: Creating a pull request on GitHub with the generated article for human review and approval.
4.  **CI/CD for Publishing**: Automatically publishing the article to WordPress via GitHub Actions upon merging the PR into the `main` branch.

## Architecture & Key Directories

-   **`.claude/`**: Contains the definitions for AI skills and reusable agents.
    -   `skills/`: Defines multi-step pipelines for tasks like `/generate`, `/revise`, and `/edit`. These are the primary entry points for using the system.
    -   `agents/`: Reusable components called by skills for specific tasks like reviewing an article (`article-reviewer.md`) or loading a style profile (`style-loader.md`).
-   **`scripts/`**: A collection of TypeScript scripts for direct interaction with the WordPress REST API. These handle fetching, publishing, updating posts, and uploading media.
-   **`articles/`**: Git-tracked directory where reviewed and approved articles are stored before being published. The PR review process happens here.
-   **`output/`**: A git-ignored directory for temporary files generated during a skill's execution (e.g., drafts, review notes). Each session gets a unique subdirectory.
-   **`cache/`**: Git-ignored directory for caching data like website style profiles to speed up subsequent runs.
-   **`.github/workflows/`**: Contains the GitHub Actions workflow (`wp-publish.yml`) that automates publishing to WordPress on PR merges.
-   **`package.json`**: Defines the project's dependencies (`typescript`, `tsx`, `dotenv`) and key scripts.

## Building and Running

This project uses `tsx` to execute TypeScript files directly, so there is no separate build step.

### Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create and configure your environment file. Copy the example and fill in your WordPress details.
    ```bash
    cp .env.example .env
    # Edit .env with your credentials
    ```

### Key Commands

The primary interface is through AI skills (e.g., `/generate [keyword]`). However, several npm scripts are available for direct operations:

-   **Type Checking**:
    ```bash
    npx tsc --noEmit
    ```
-   **Fetch recent posts from WordPress**:
    ```bash
    npm run wp:fetch -- [count]
    ```
-   **Publish a local article draft to WordPress**:
    ```bash
    npm run wp:publish -- <path/to/article.json>
    ```
-   **Update an existing WordPress post**:
    ```bash
    npm run wp:update -- <postId> <path/to/article.json>
    ```
-   **Upload media to WordPress**:
    ```bash
    npm run wp:upload-media -- <path/to/image> [alt-text]
    ```

## Development Conventions

-   **Technology**: The project is written in TypeScript and uses ES Modules (`"type": "module"` in `package.json`).
-   **Configuration**: All environment-specific settings (especially secrets like API keys and passwords) are managed through a `.env` file. No credentials should be hardcoded.
-   **Generality**: The core scripts and skills are designed to be generic and not tied to a specific WordPress theme. Theme-specific or site-specific configurations are handled via `.env` variables.
-   **Workflow**: The main development and content creation workflow is git-based, centered around Pull Requests for review. This ensures quality control before anything is published.
-   **AI Integration**: The project is architected around the concept of AI "skills" and "agents," showing a clear separation of concerns between the overall pipeline logic (skills) and reusable AI tasks (agents).
