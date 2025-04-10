#!/bin/bash

# Build the application with production environment
echo "Building application with production environment..."
npm run build

# Deploy to your hosting provider
# Uncomment and modify the appropriate command for your hosting provider

# For Vercel
# vercel --prod

# For Netlify
# netlify deploy --prod

# For AWS Amplify
# amplify publish

echo "Deployment complete!"
