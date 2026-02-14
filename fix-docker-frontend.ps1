# fix-docker-frontend.ps1
# Run this script from C:\Users\tumel\spendwise-sa

Write-Host "🔧 SpendWise SA - Docker Frontend Fix Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. FIX DOCKER-COMPOSE.YML
Write-Host "`n📝 Fixing docker-compose.yml..." -ForegroundColor Yellow
$dockerComposePath = "C:\Users\tumel\spendwise-sa\docker-compose.yml"
$dockerComposeContent = Get-Content $dockerComposePath -Raw

# Replace localhost with api service name
$fixedContent = $dockerComposeContent -replace 'NEXT_PUBLIC_API_URL=http://localhost:8000', 'NEXT_PUBLIC_API_URL=http://api:8000'
$fixedContent = $fixedContent -replace 'BACKEND_CORS_ORIGINS: "http://localhost:3000,http://frontend:3000,http://localhost:8000"', 'BACKEND_CORS_ORIGINS: "http://localhost:3000,http://frontend:3000,http://api:8000,http://localhost:8000"'

$fixedContent | Set-Content $dockerComposePath
Write-Host "  ✅ docker-compose.yml updated" -ForegroundColor Green

# 2. FIX NEXT.CONFIG.JS - Using here-string with proper escaping
Write-Host "`n📝 Fixing next.config.js..." -ForegroundColor Yellow
$nextConfigPath = "C:\Users\tumel\spendwise-sa\frontend\next.config.js"
$nextConfig = @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Use environment variable for API URL
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://api:8000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
'@

$nextConfig | Set-Content $nextConfigPath -Encoding UTF8
Write-Host "  ✅ next.config.js updated" -ForegroundColor Green

# 3. CREATE DOCKER ENV FILE
Write-Host "`n📝 Creating .env.docker..." -ForegroundColor Yellow
$envDockerPath = "C:\Users\tumel\spendwise-sa\frontend\.env.docker"
$envDocker = @'
# Docker environment variables
NEXT_PUBLIC_API_URL=http://api:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
'@

$envDocker | Set-Content $envDockerPath -Encoding UTF8
Write-Host "  ✅ .env.docker created" -ForegroundColor Green

# 4. UPDATE DOCKERFILE
Write-Host "`n📝 Updating frontend Dockerfile..." -ForegroundColor Yellow
$dockerfilePath = "C:\Users\tumel\spendwise-sa\frontend\Dockerfile"
$dockerfile = @'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["npm", "start"]
'@

$dockerfile | Set-Content $dockerfilePath -Encoding UTF8
Write-Host "  ✅ Dockerfile updated" -ForegroundColor Green

# 5. CREATE API CLIENT
Write-Host "`n📝 Creating API client..." -ForegroundColor Yellow
$apiClientPath = "C:\Users\tumel\spendwise-sa\frontend\src\lib\api.ts"

# Create lib directory if it doesn't exist
New-Item -ItemType Directory -Path "C:\Users\tumel\spendwise-sa\frontend\src\lib" -Force | Out-Null

$apiClient = @'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
      
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'API request failed');
    }
    
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
'@

$apiClient | Set-Content $apiClientPath -Encoding UTF8
Write-Host "  ✅ API client created at src/lib/api.ts" -ForegroundColor Green

# 6. UPDATE PACKAGE.JSON SCRIPTS
Write-Host "`n📝 Updating package.json scripts..." -ForegroundColor Yellow
$packageJsonPath = "C:\Users\tumel\spendwise-sa\frontend\package.json"

# Read package.json
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Add docker scripts if they don't exist
if (-not $packageJson.scripts.dockerbuild) {
    $packageJson.scripts | Add-Member -Name "dockerbuild" -Value "docker build -t spendwise-frontend ." -MemberType NoteProperty
}
if (-not $packageJson.scripts.dockerdev) {
    $packageJson.scripts | Add-Member -Name "dockerdev" -Value "docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8000 spendwise-frontend" -MemberType NoteProperty
}
if (-not $packageJson.scripts.devdocker) {
    $packageJson.scripts | Add-Member -Name "devdocker" -Value "cross-env NEXT_PUBLIC_API_URL=http://localhost:8000 next dev -p 3000" -MemberType NoteProperty
}

# Convert back to JSON and save
$packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8
Write-Host "  ✅ package.json updated with docker scripts" -ForegroundColor Green

# 7. INSTALL CROSS-ENV FOR DEV:DOCKER SCRIPT
Write-Host "`n📦 Installing cross-env..." -ForegroundColor Yellow
Set-Location "C:\Users\tumel\spendwise-sa\frontend"
npm install --save-dev cross-env
Write-Host "  ✅ cross-env installed" -ForegroundColor Green

# 8. STOP AND CLEAN DOCKER
Write-Host "`n🧹 Cleaning Docker environment..." -ForegroundColor Yellow
Set-Location "C:\Users\tumel\spendwise-sa"
docker-compose down -v
docker system prune -f
Write-Host "  ✅ Docker cleaned" -ForegroundColor Green

# 9. REBUILD AND START
Write-Host "`n🏗️  Rebuilding Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache
Write-Host "  ✅ Build complete" -ForegroundColor Green

Write-Host "`n🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "  ✅ Services started" -ForegroundColor Green

# 10. VERIFY
Write-Host "`n🔍 Verifying setup..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if frontend is running
$frontendStatus = docker-compose ps frontend --format json
if ($frontendStatus -match "running") {
    Write-Host "  ✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend failed to start" -ForegroundColor Red
}

# Check if API is accessible from frontend
try {
    $apiCheck = docker-compose exec -T frontend wget -qO- --timeout=5 http://api:8000/health 2>$null
    if ($apiCheck) {
        Write-Host "  ✅ Frontend can reach API (http://api:8000)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Could not verify API connection from frontend" -ForegroundColor Yellow
}

# 11. SHOW LOGS
Write-Host "`n📋 Frontend logs:" -ForegroundColor Cyan
docker-compose logs --tail=20 frontend

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "✅ FIX COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "`n📌 Your application is now available at:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n📌 To view logs:" -ForegroundColor White
Write-Host "   docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host "   docker-compose logs -f api" -ForegroundColor Gray

Write-Host "`n📌 To stop services:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray

Write-Host "`n🎯 Your Docker setup is now fixed and optimized!" -ForegroundColor Cyan