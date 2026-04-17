# Step 1: Install IIS Modules

This step installs the required IIS modules for reverse proxying a Next.js SSR app.

## 1a. URL Rewrite Module

- Download and install: [IIS URL Rewrite 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)  
- Required for creating rewrite rules that send requests from IIS to Node.js.
## 1b. Application Request Routing (ARR)

- Download and install: [IIS ARR](https://www.iis.net/downloads/microsoft/application-request-routing)  
- Open IIS Manager → Click on the **server node** → **Application Request Routing Cache** → Right panel → **Server Proxy Settings** → Check **Enable proxy** → Apply

### Notes

- URL Rewrite allows IIS to forward requests to Node.js (port 3000).  
- ARR enables reverse proxy functionality.

# Step 2: Install PM2 Globally

This step installs **PM2**, a process manager for Node.js apps, which will keep your Next.js SSR app running on Windows.

## 2a. Open PowerShell as Administrator

- Press **Win + X → Windows PowerShell (Admin)**  
- Or search for PowerShell → Right-click → Run as Administrator

## 2b. Install PM2 globally

```powershell
npm install -g pm2
```

# Step 3: Prepare the Next.js App

This step covers setting up your Next.js SSR app, including environment variables, dependencies, and building the app.

## 3a. Create `.env.production`

- In your project root (e.g., `D:\GitHubRepos\foodorderapp`), create a file named `.env.production`.  
- Add your **production environment variables**, for example:

```json
    NODE_ENV=production
    NEXT_PUBLIC_API_URL=https://api.yourdomain.com

    DATABASE_URL=your_database_url_here
```

> **Note:** This file is used when running `npm run build` and `npm start` in production.

## 3b. Install dependencies
From your project root, run:

```powershell
npm install
```

## 3c. Build the app

```powershell
npm run build
```

This prepares your Next.js app for production SSR.

## 3d. Test locally

```powershell
npm start
```

Your app should now be accessible at http://localhost:3000.

## Notes

- .env.production must be present before building the app.
- You can use .env.production.example in your repo for reference, but never commit secrets.

# Step 4: Configure PM2

This step covers starting your Next.js SSR app using **PM2** and saving the process list for persistence.

## 4a. Start the app with PM2

From your project root (where your `ecosystem.config.js` exists), run:

```powershell
pm2 start ecosystem.config.js
pm2 list
```
- Verify that foodorderapp is online.

## 4b. Save PM2 process list

```powershell
pm2 save
```
# 5. Configure PM2 Startup on Windows

Since pm2 startup doesn’t work reliably on Windows, use Task Scheduler:
- Open Task Scheduler
Press Win + R → taskschd.msc → Enter
Right-click Task Scheduler Library → Create Task

- General Tab
Name: PM2 Startup
Run whether user is logged in or not
Check: Run with highest privileges

- Triggers Tab
New → Begin the task: At startup

- Actions Tab
Action: Start a program
Program/script:

```powershell
C:\Program Files\nodejs\node.exe
```

Add arguments:

```powershell
C:\Users\ss\AppData\Roaming\npm\node_modules\pm2\bin\pm2 resurrect
```

Start in:

```powershell
C:\Users\ss
```

- Test
Run task manually → PM2 should restore processes.
Reboot → PM2 should start automatically.

# 6. Configure IIS Site for SSR
- Create a New Application Pool (e.g., name as NextJSAppPool)
   Select 'No managed code' and "Integrated"
- Create a new IIS Site (e.g., pointing to D:\foodorderapp).
- Bind hostname / port (e.g., http://localhost:80).
- Place the following web.config in your project root [D:\foodorderapp\web.config]((D:\foodorderapp\web.config)):

```XML
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Reverse proxy all requests to Node.js (Next.js SSR app) -->
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <!-- Only rewrite if the file or directory does not exist -->
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>


    <!-- Forwarded headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Forwarded-For" value="{REMOTE_ADDR}" />
        <add name="X-Forwarded-Proto" value="{HTTPS}" />
      </customHeaders>
    </httpProtocol>


    <!-- Remove default static file handlers to prevent IIS 404 errors -->
    <handlers>
      <remove name="StaticFile" />
      <remove name="DefaultDocumentHandler" />
    </handlers>
  </system.webServer>
</configuration>
```

## Notes:
Requires URL Rewrite module.
All requests are proxied to Node.js (port 3000) → PM2 handles the app.
IIS does not serve static files directly.
Ensure Node/PM2 is running before accessing the site.

# 7. Verify Setup
Test Node directly: http://localhost:3000
Test IIS reverse proxy: http://localhost (or your domain)
Check PM2 logs:
```powershell
pm2 logs foodorderapp
```

# 8. Updating the App
Whenever you deploy changes:

```powershell
git pull
npm install
npm run build
pm2 restart foodorderapp
pm2 save
```