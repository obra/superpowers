# PlantUML Server Deployment Guide for Render

## Overview
This guide explains how to deploy a PlantUML server on Render.com to use with your ConstructAI application.

## What You Need

You need to deploy the **plantuml-server** project (not the core plantuml library). The plantuml-server is a web application that provides HTTP endpoints for rendering PlantUML diagrams.

## Deployment Options

### Option 1: Use Official PlantUML Server Docker Image (Recommended)

The easiest way is to deploy the official PlantUML server Docker image.

#### Steps for Render Deployment:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Configure Docker Deployment**
   - Select "Deploy an existing image from a registry"
   - Image URL: `plantuml/plantuml-server:jetty`
   - Or use: `plantuml/plantuml-server:tomcat` (alternative)

3. **Service Configuration**
   - **Name**: `plantuml-server` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Instance Type**: Starter (free tier) or Standard
   - **Port**: `8080` (default for PlantUML server)

4. **Environment Variables** (Optional)
   - `PLANTUML_LIMIT_SIZE`: `4096` (max diagram size)
   - `BASE_URL`: `/plantuml` (if using a custom base path)

5. **Health Check Path**
   - Set to: `/`
   - The server provides a simple UI at the root

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-5 minutes)

7. **Get Your Server URL**
   - After deployment, you'll receive a URL like:
   - `https://your-service-name.onrender.com`

### Option 2: Deploy from GitHub Repository

If you want more control, you can deploy the plantuml-server source code.

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/plantuml/plantuml-server.git
   ```

2. **Push to Your GitHub**
   - Create a new repository in your GitHub account
   - Push the plantuml-server code to your repo

3. **Deploy on Render**
   - Connect your GitHub repository
   - Render will auto-detect the Dockerfile
   - Configure as described in Option 1

## Using Your PlantUML Server

Once deployed, you'll have a server URL like:
```
https://your-plantuml-server.onrender.com
```

### Available Endpoints:

- **SVG**: `https://your-server.onrender.com/svg/{encoded-diagram}`
- **PNG**: `https://your-server.onrender.com/png/{encoded-diagram}`
- **TXT**: `https://your-server.onrender.com/txt/{encoded-diagram}`

### Encoding Format

PlantUML servers use a specific text encoding format. The diagram code must be:
1. Compressed with DEFLATE
2. Encoded in base64
3. Modified to use `-` instead of `+` and `_` instead of `/`
4. Prefixed with `~1` or `~0` depending on compression

## Integration with ConstructAI

After deployment, update your PlantUML page configuration:

```javascript
// Replace the server URL in your code
const serverUrl = 'https://your-plantuml-server.onrender.com';
const diagramUrl = `${serverUrl}/svg/${encodedDiagram}`;
```

## Testing Your Server

Once deployed, test with a simple diagram:

1. **Visit**: `https://your-server.onrender.com`
2. **You should see**: PlantUML server welcome page
3. **Test endpoint**: 
   ```
   https://your-server.onrender.com/png/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
   ```
   This should render a simple "Bob -> Alice: hello" diagram

## Render-Specific Configuration

### render.yaml (Optional)

Create a `render.yaml` in your repository for infrastructure as code:

```yaml
services:
  - type: web
    name: plantuml-server
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: starter # or 'free' for hobby tier
    region: oregon # or your preferred region
    healthCheckPath: /
    envVars:
      - key: PLANTUML_LIMIT_SIZE
        value: 4096
      - key: BASE_URL
        value: /
```

## Cost Considerations

- **Free Tier**: Suitable for personal/development use
  - Spins down after 15 minutes of inactivity
  - First request after spin-down may be slow (cold start)

- **Starter ($7/month)**: Better for production
  - No spin-down
  - Faster response times

## Troubleshooting

### Server Not Responding
- Check Render logs for errors
- Verify port is set to 8080
- Ensure health check path is correct

### Diagrams Not Rendering
- Verify encoding is correct (see encoding format above)
- Check server logs for errors
- Test with simple diagram first

### Slow Performance
- Consider upgrading from free to paid tier
- Check if Graphviz is properly installed in container
- Review diagram complexity

## Security Considerations

- PlantUML servers can execute certain commands
- Consider implementing rate limiting
- For production, use authentication/API keys
- Monitor usage to prevent abuse

## Alternative: Use Public Server

If you don't want to deploy your own server, you can continue using the public PlantUML server:
- `https://www.plantuml.com/plantuml/`
- Note: Public server has rate limits and should not be used for production

## Support

- PlantUML Server GitHub: https://github.com/plantuml/plantuml-server
- PlantUML Documentation: https://plantuml.com/
- Render Documentation: https://render.com/docs
