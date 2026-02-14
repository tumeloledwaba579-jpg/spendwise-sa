FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Use docker environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://backend:8000

# Start the application
CMD ["npm", "start"]
