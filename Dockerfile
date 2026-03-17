FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies separately to leverage Docker cache
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy all source code
COPY . .

# Build the frontend (React/Vite app)
RUN npm run build --prefix frontend

# Set the node environment to production
ENV NODE_ENV=production

# The port is defaulted to 5001 from backend server.js, exposing it
EXPOSE 5001

# Command to start the backend, which also serves the frontend dist
CMD ["npm", "start"]
