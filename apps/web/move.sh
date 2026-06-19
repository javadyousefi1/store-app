rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.turbo' \
    /Users/javadyousefi/me/store-frontend \
    root@171.22.24.22:/opt/store/store-frontend
