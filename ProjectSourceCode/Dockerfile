# Use the official Node.js image from Docker Hub
FROM node:lts

# Set working directory inside the container
WORKDIR /home/node/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
