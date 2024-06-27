cd /var/www/my-tasks-ai-proxy;
git pull;
yarn build;
pm2 restart 0;
cd;