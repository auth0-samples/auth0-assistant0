#!/bin/bash

# Script to update @auth0/ai packages to their latest versions
# Usage: ./update_packages.sh

set -e

# Define the versions
AUTH0_SPA_JS_VERSION="^2.9.0"
AUTH0_NEXTJS_VERSION="^4.13.0"
AUTH0_AI_VERSION="^5.1.1"
AUTH0_AI_VERCEL_VERSION="^4.1.0"
AUTH0_AI_LANGCHAIN_VERSION="^4.1.0"
AUTH0_AI_LLAMAINDEX_VERSION="^4.1.0"

REGISTRY="--registry https://registry.npmjs.org/"

echo "Starting package updates..."

# Function to update a package.json file and reinstall packages
update_package_json() {
    local file="$1"
    local updated=false

    echo "Checking $file..."

    if grep -q '"@auth0/auth0-spa-js"' "$file"; then
        echo "  Updating @auth0/auth0-spa-js to $AUTH0_SPA_JS_VERSION"
        sed -i '' 's/"@auth0\/auth0-spa-js": "[^"]*"/"@auth0\/auth0-spa-js": "'$AUTH0_SPA_JS_VERSION'"/g' "$file"
        updated=true
    fi

    if grep -q '"@auth0/nextjs-auth0"' "$file"; then
        echo "  Updating @auth0/nextjs-auth0 to $AUTH0_NEXTJS_VERSION"
        sed -i '' 's/"@auth0\/nextjs-auth0": "[^"]*"/"@auth0\/nextjs-auth0": "'$AUTH0_NEXTJS_VERSION'"/g' "$file"
        updated=true
    fi

    if grep -q '"@auth0/ai"' "$file"; then
        echo "  Updating @auth0/ai to $AUTH0_AI_VERSION"
        sed -i '' 's/"@auth0\/ai": "[^"]*"/"@auth0\/ai": "'$AUTH0_AI_VERSION'"/g' "$file"
        updated=true
    fi

    if grep -q '"@auth0/ai-vercel"' "$file"; then
        echo "  Updating @auth0/ai-vercel to $AUTH0_AI_VERCEL_VERSION"
        sed -i '' 's/"@auth0\/ai-vercel": "[^"]*"/"@auth0\/ai-vercel": "'$AUTH0_AI_VERCEL_VERSION'"/g' "$file"
        updated=true
    fi

    if grep -q '"@auth0/ai-langchain"' "$file"; then
        echo "  Updating @auth0/ai-langchain to $AUTH0_AI_LANGCHAIN_VERSION"
        sed -i '' 's/"@auth0\/ai-langchain": "[^"]*"/"@auth0\/ai-langchain": "'$AUTH0_AI_LANGCHAIN_VERSION'"/g' "$file"
        updated=true
    fi

    if grep -q '"@auth0/ai-llamaindex"' "$file"; then
        echo "  Updating @auth0/ai-llamaindex to $AUTH0_AI_LLAMAINDEX_VERSION"
        sed -i '' 's/"@auth0\/ai-llamaindex": "[^"]*"/"@auth0\/ai-llamaindex": "'$AUTH0_AI_LLAMAINDEX_VERSION'"/g' "$file"
        updated=true
    fi

    if [ "$updated" = true ]; then
        echo "  Updated $file"
        dir=$(dirname "$file")

        # Simple approach: collect all @auth0 packages, uninstall them, then reinstall
        packages_to_uninstall=""
        packages_to_reinstall=""

        if grep -q '"@auth0/auth0-spa-js":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/auth0-spa-js"
            packages_to_reinstall="$packages_to_reinstall @auth0/auth0-spa-js@$AUTH0_SPA_JS_VERSION"
        fi

        if grep -q '"@auth0/nextjs-auth0":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/nextjs-auth0"
            packages_to_reinstall="$packages_to_reinstall @auth0/nextjs-auth0@$AUTH0_NEXTJS_VERSION"
        fi

        if grep -q '"@auth0/ai":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/ai"
            packages_to_reinstall="$packages_to_reinstall @auth0/ai@$AUTH0_AI_VERSION"
        fi

        if grep -q '"@auth0/ai-vercel":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/ai-vercel"
            packages_to_reinstall="$packages_to_reinstall @auth0/ai-vercel@$AUTH0_AI_VERCEL_VERSION"
        fi

        if grep -q '"@auth0/ai-langchain":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/ai-langchain"
            packages_to_reinstall="$packages_to_reinstall @auth0/ai-langchain@$AUTH0_AI_LANGCHAIN_VERSION"
        fi

        if grep -q '"@auth0/ai-llamaindex":' "$file"; then
            packages_to_uninstall="$packages_to_uninstall @auth0/ai-llamaindex"
            packages_to_reinstall="$packages_to_reinstall @auth0/ai-llamaindex@$AUTH0_AI_LLAMAINDEX_VERSION"
        fi

        # Uninstall all @auth0 packages at once
        if [ -n "$packages_to_uninstall" ]; then
            echo "    Uninstalling:$packages_to_uninstall"
            (cd "$dir" && npm uninstall$packages_to_uninstall 2>/dev/null || true)
        fi

        # Reinstall all @auth0 packages at once
        if [ -n "$packages_to_reinstall" ]; then
            echo "    Reinstalling:$packages_to_reinstall"
            (cd "$dir" && npm install$packages_to_reinstall $REGISTRY)
        fi
    fi
}

# Find all package.json files and update them
find . -name "package.json" -type f -not -path "*/node_modules/*" | while read -r file; do
    if grep -q '@auth0/ai' "$file"; then
        update_package_json "$file"
    fi
done

echo "Package updates completed!"
