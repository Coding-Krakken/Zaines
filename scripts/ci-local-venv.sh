#!/bin/bash
set -e  # Exit on any error

echo "========================================="
echo "🔍 Running CI Validation Locally"
echo "========================================="
echo ""

# Determine project root (assuming script is in scripts/ subdirectory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Working directory: $PROJECT_ROOT"
echo ""

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed"
    exit 1
fi

echo "✅ pnpm found: $(pnpm --version)"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/6: Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2/6: Generating Prisma Client..."
pnpm run prisma:generate
echo "✅ Prisma Client generated"
echo ""

# Step 3: TypeScript type checking
echo "🔍 Step 3/6: Running TypeScript type checking..."
pnpm run typecheck
echo "✅ Type checking passed"
echo ""

# Step 4: Linting
echo "🧹 Step 4/6: Running linter..."
pnpm run lint
echo "✅ Linting passed"
echo ""

# Step 5: Tests
echo "🧪 Step 5/6: Running tests..."
pnpm test
echo "✅ Tests passed"
echo ""

# Step 6: Build
echo "🏗️  Step 6/6: Building application..."
pnpm run build
echo "✅ Build successful"
echo ""

echo "========================================="
echo "✅ All CI checks passed locally!"
echo "========================================="

