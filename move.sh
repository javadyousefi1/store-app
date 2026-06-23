rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.turbo' \
    --exclude='.next' \
    /Users/javadyousefi/me/store-app \
    ubuntu@37.32.23.3:/home/ubuntu/project
