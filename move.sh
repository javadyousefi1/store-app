rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.turbo' \
    --exclude='.next' \
    /Users/javadyousefi/me/store-app \
    ubuntu@185.206.94.230:/home/ubuntu/project
