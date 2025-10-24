#!/bin/bash

# Photo Tagging App - Docker Test Script
# This script helps test the Docker container locally

echo "🐳 Photo Tagging App - Docker Test"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker stop phototag-test 2>/dev/null || true
docker rm phototag-test 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
if docker build -t phototag-app .; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Run the container
echo "🚀 Starting container..."
if docker run -d -p 3001:3000 --name phototag-test phototag-app; then
    print_status "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check if the application is responding
echo "🔍 Testing application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    print_status "Application is responding correctly"
    echo ""
    echo "🎉 SUCCESS! Your application is running at:"
    echo "   http://localhost:3001"
    echo ""
    echo "To stop the container, run:"
    echo "   docker stop phototag-test"
    echo "   docker rm phototag-test"
    echo ""
    echo "To view logs, run:"
    echo "   docker logs phototag-test"
else
    print_error "Application is not responding"
    echo "Container logs:"
    docker logs phototag-test
    exit 1
fi
