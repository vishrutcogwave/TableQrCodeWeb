module.exports = {
  apps: [
    {
      name: "foodorderapp",
      cwd: "D:/GitHubRepos/hotel360-restaurant-order",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
