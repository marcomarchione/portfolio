#!/bin/bash
# Railway Manual Deploy Script
# Run this if auto-deploy is not working

set -e

echo "🚂 Railway Manual Deployment Script"
echo "===================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "🔐 Login to Railway..."
echo "This will open your browser for authentication."
echo ""

railway login

echo ""
echo "🔗 Linking to Railway project..."
echo "If you have multiple projects, select 'portfolio'"
echo ""

railway link

echo ""
echo "📋 Available services to deploy:"
echo "  1. api    - Elysia REST API"
echo "  2. admin  - React Admin Panel"
echo "  3. web    - Astro Public Website"
echo "  4. all    - Deploy all services"
echo ""

read -p "Which service to deploy? (api/admin/web/all): " service

case $service in
  api)
    echo "🚀 Deploying API service..."
    railway up -s api
    ;;
  admin)
    echo "🚀 Deploying Admin service..."
    railway up -s admin
    ;;
  web)
    echo "🚀 Deploying Web service..."
    railway up -s web
    ;;
  all)
    echo "🚀 Deploying all services..."
    echo ""
    echo "Deploying API..."
    railway up -s api &
    API_PID=$!

    echo "Deploying Admin..."
    railway up -s admin &
    ADMIN_PID=$!

    echo "Deploying Web..."
    railway up -s web &
    WEB_PID=$!

    wait $API_PID
    wait $ADMIN_PID
    wait $WEB_PID
    ;;
  *)
    echo "❌ Invalid option. Use: api, admin, web, or all"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check deployment status:"
echo "   railway status"
echo ""
echo "📝 View logs:"
echo "   railway logs --service api"
echo "   railway logs --service admin"
echo "   railway logs --service web"
