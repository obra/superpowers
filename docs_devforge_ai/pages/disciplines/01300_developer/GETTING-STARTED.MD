# Getting Started (0100)

## Module Resolution Systems

The project uses a webpack-based module resolution system for all components and modules.

### 1. Webpack Module Resolution

- Used for all components and modules in `client/src/`
- Configured through webpack aliases
- Handles module imports, assets, and styles
- Supports React components and modern JS features

```javascript
// webpack.config.js
resolve: {
  alias: {
    '@common': path.resolve(__dirname, '../src/common'),
    '@components': path.resolve(__dirname, '../src/components'),
    '@pages': path.resolve(__dirname, '../src/pages')
  }
}
```

Example usage:

```javascript
// Import using webpack aliases
import { Button } from '@components/Button';
import { useAuth } from '@common/hooks/useAuth';
import styles from '@pages/00100-home/css/00100-pages-style.css';
```

### Usage Guidelines

1. For all code in src/:

```javascript
// Use webpack aliases
import { Component } from '@components/Component';
import styles from './styles.module.css';
import logo from '@assets/images/logo.svg';
```

2. Path resolution rules:
   - Webpack aliases start with '@' (e.g., @components)
   - Webpack handles:
     - Module resolution
     - Asset bundling
     - CSS modules
     - Development/production builds

## Development Environment Setup

### Prerequisites

#### Required Software

- Node.js v18+ (LTS recommended)
- npm v9+ or pnpm v8+
- Git 2.40+
- Docker 24.0+ (for local database)
- webpack-cli (for build tools)

#### Recommended Tools

- VSCode 1.85+ with extensions:
  - ESLint
  - Prettier
  - GitLens
  - Docker
- Postman (API testing)
- pgAdmin (Database management)

#### Accounts Required

- Supabase account
- GitHub account (for repository access)
- Cloud provider account (AWS/GCP/Azure for deployment)

## Project Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/construct-ai/construct_AI.git
cd construct_AI

# Initialize git submodules
git submodule update --init --recursive

# Verify repository status
git status
```

### 2. Environment Configuration

1. Create environment files:

```bash
# Create main environment file
cp .env.example .env

# Create test environment file
cp .env.test.example .env.test

# Create development environment file
cp .env.development.example .env.development
```

2. Configure environment variables:

```env
# Core Configuration
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=construct_ai_dev
DB_USER=postgres
DB_PASSWORD=your_password

# Supabase Configuration
# These values should be retrieved from Render environment variables
SUPABASE_URL=${process.env.SUPABASE_URL}
SUPABASE_KEY=${process.env.SUPABASE_ANON_KEY}
SUPABASE_SECRET=${process.env.SUPABASE_SECRET_KEY}

# Authentication Configuration
# These values should be retrieved from Render environment variables
JWT_SECRET=${process.env.JWT_SECRET}
SESSION_SECRET=${process.env.SESSION_SECRET}
TOKEN_EXPIRY=24h

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${process.env.GOOGLE_REDIRECT_URI}

# Storage Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### Important Note on Environment Variables

Environment variables are primarily managed through Render's environment variable system. The .env files are only used for local development. When deploying to Render:

1. All sensitive credentials (Google OAuth, Supabase, etc.) should be configured in Render's environment variables
2. The middleware will automatically load these values from process.env
3. For local development, you can use .env files, but these should not contain production credentials
4. Never commit .env files to version control

### 3. Dependency Installation

1. Install server dependencies:

```bash
cd server
npm install
# OR using pnpm
pnpm install
```

2. Install client dependencies:

```bash
cd ../client
npm install
# OR using pnpm
pnpm install
```

3. Install webpack dependencies:

```bash
cd ../client
npm install --save-dev webpack webpack-cli webpack-dev-server
npm install --save-dev @babel/core @babel/preset-react @babel/preset-env
npm install --save-dev css-loader style-loader
```

### 4. Development Server Setup

To run the application locally, you need to start both the webpack development server and the backend server. A convenience script has been created to automate this process.

**Using the Startup Script:**

A script `scripts/start_servers.sh` is available to start both the client and server development servers automatically.

To use the script:

1. Make the script executable (if necessary):

   ```bash
   chmod +x scripts/start_servers.sh
   ```

2. Run the script from the project root directory:

   ```bash
   ./scripts/start_servers.sh
   ```

This will start both servers in the background.

### Rebuilding Client Assets and Restarting Servers

After making changes to client-side configuration files (like `webpack.config.js`) or adding/modifying certain assets, you need to rebuild the client assets and restart the development servers for the changes to take effect.

Here's the recommended process:

1. **Stop Running Servers:**
    - If you used the `start_servers.sh` script, you might need to find and terminate the processes manually or use `pkill`.
    - To stop the webpack development server:

        ```bash
        pkill -f "webpack-dev-server" || echo "Webpack dev server not running."
        ```

    - To stop the backend Node.js server:

        ```bash
        pkill -f "node server.js" || echo "Backend server not running."
        ```

    - Alternatively, if you ran them manually in separate terminal windows, simply close those terminal windows or use `Ctrl+C` in each terminal.

2. **Rebuild Client Assets:**
    - Navigate to the `client` directory:

        ```bash
        cd client
        ```

    - Run the build command:

        ```bash
        npm run build
        # OR using pnpm
        pnpm build
        ```

    - This command compiles and bundles the client-side code and assets into the `client/dist2` directory.

3. **Navigate back to the project root:**

    ```bash
    cd ..
    ```

4. **Restart Development Servers:**
    - **Using the Startup Script (Recommended):**

        ```bash
        ./scripts/start_servers.sh
        ```

The webpack dev server will be available with:

- Hot Module Replacement (HMR)
- Source maps for debugging
- Auto-reload on file changes

3. Install global tools:

```bash
npm install -g typescript@latest
npm install -g eslint@latest
npm install -g nodemon@latest
```

4. Verify installations:

```bash
# Check Node.js version
node -v

# Check npm version
npm -v

# Check TypeScript version
tsc -v

# Check Docker version
docker --version
```

### Accessing the Application

The application is a Single-Page Application (SPA) and is served from a single `index.html` file. All routing is handled client-side by React Router.

1. **Start Development Servers:**
   Ensure both the webpack development server and the backend server are running using the `scripts/start_servers.sh` script.

2. **Access the Application:**
   Open your web browser and navigate to the URL of the webpack development server. This will typically be `http://localhost:[port]/`, where `[port]` is the port number shown in your terminal output when you started the webpack dev server (e.g., `http://localhost:8093/`).

   React Router will then handle navigation to specific pages based on the URL path (e.g., `/home`, `/administration`, `/safety`). You do not need to access individual HTML files for each page.
