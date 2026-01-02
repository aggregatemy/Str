# Deployment Guide - Strażnik Prawa Medycznego Backend

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Linux/Unix environment (recommended)
- Port 3001 available (or configure custom port)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/aggregatemy/Str.git
cd Str/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_PATH=./data/straznik.db

# Cron
ENABLE_CRON=true
CRON_SCHEDULE=0 * * * *

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/backend.log

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Build

```bash
npm run build
```

This creates compiled JavaScript in `dist/` directory.

### 5. Run Migrations

Database migrations run automatically on first start. To run manually:

```bash
node dist/db/client.js
```

## Running

### Development

```bash
npm run dev
```

Server runs with hot reload on file changes.

### Production

```bash
npm start
```

Server runs from compiled `dist/` files.

## Process Management

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start application:
```bash
pm2 start dist/server.js --name straznik-backend
```

Configure auto-restart on system boot:
```bash
pm2 startup
pm2 save
```

Monitor:
```bash
pm2 status
pm2 logs straznik-backend
pm2 monit
```

Stop:
```bash
pm2 stop straznik-backend
pm2 delete straznik-backend
```

### Using systemd

Create service file `/etc/systemd/system/straznik-backend.service`:

```ini
[Unit]
Description=Straznik Prawa Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Str/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=straznik-backend

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable straznik-backend
sudo systemctl start straznik-backend
```

Check status:
```bash
sudo systemctl status straznik-backend
sudo journalctl -u straznik-backend -f
```

## Database

### Location

Default: `./data/straznik.db`

Ensure directory exists and has write permissions:
```bash
mkdir -p data
chmod 755 data
```

### Backup

```bash
# Backup database
cp data/straznik.db data/straznik.db.backup-$(date +%Y%m%d)

# Restore from backup
cp data/straznik.db.backup-YYYYMMDD data/straznik.db
```

### Maintenance

SQLite is low-maintenance. For optimization:

```bash
sqlite3 data/straznik.db "VACUUM;"
sqlite3 data/straznik.db "ANALYZE;"
```

## Logging

### Log Files

Default location: `./logs/backend.log`

Logs rotate automatically (5 files x 5MB each).

### Log Levels

- `error` - Errors only
- `warn` - Warnings and errors
- `info` - Normal operation (recommended)
- `debug` - Detailed debugging

Set in `.env`:
```env
LOG_LEVEL=info
```

### View Logs

```bash
# Tail logs
tail -f logs/backend.log

# Search logs
grep "ERROR" logs/backend.log

# View with timestamps
cat logs/backend.log | grep "2024-01-15"
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Cron Jobs

Check logs for cron execution:
```bash
grep "hourly sync" logs/backend.log
```

Disable cron for maintenance:
```env
ENABLE_CRON=false
```

### Metrics

Monitor:
- HTTP response times
- Database query performance
- Cron job execution time
- Memory usage
- CPU usage

Use PM2 monitoring or external tools (New Relic, Datadog, etc.)

## Scaling

### Horizontal Scaling

Backend is stateless. Can run multiple instances behind load balancer.

**Load Balancer Config** (nginx example):

```nginx
upstream straznik_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://straznik_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Note**: Only ONE instance should have cron enabled to avoid duplicate processing.

### Vertical Scaling

Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Security

### Firewall

Allow only necessary ports:
```bash
sudo ufw allow 3001/tcp
sudo ufw enable
```

### Reverse Proxy

Always use reverse proxy (nginx/Apache) in production:
- SSL/TLS termination
- Rate limiting
- DDoS protection
- Static file serving

### Environment Variables

Never commit `.env` to version control.

Use secret management tools:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### CORS

Restrict CORS to known origins:
```env
CORS_ORIGIN=https://your-frontend.com
```

For multiple origins, modify `src/app.ts`:
```typescript
const allowedOrigins = [
  'https://frontend1.com',
  'https://frontend2.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

## Updates

### Update Dependencies

```bash
npm update
npm audit fix
```

### Deploy New Version

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Restart service
pm2 restart straznik-backend
# or
sudo systemctl restart straznik-backend
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

Or change port in `.env`:
```env
PORT=3002
```

### Database Locked

SQLite can lock if multiple processes access it.

Solution:
- Ensure only one backend instance writes to database
- Use WAL mode (enabled by default in better-sqlite3)

### Memory Leaks

Monitor memory:
```bash
pm2 monit
```

If memory grows continuously:
- Check for unclosed database connections
- Review event listeners
- Use Node.js heap snapshot analysis

### Cron Jobs Not Running

Check logs:
```bash
grep "cron" logs/backend.log
```

Verify ENABLE_CRON=true in `.env`

Test manually:
```bash
curl -X POST http://localhost:3001/api/v1/admin/sync
```

(Note: Manual sync endpoint not implemented, add if needed)

## Backup Strategy

### Automated Backups

Create cron job for daily backups:

```bash
crontab -e
```

Add:
```
0 2 * * * /path/to/backup-script.sh
```

`backup-script.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backups/straznik"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
cp /path/to/Str/backend/data/straznik.db $BACKUP_DIR/straznik-$DATE.db
# Keep last 30 days
find $BACKUP_DIR -name "straznik-*.db" -mtime +30 -delete
```

### Cloud Backup

Sync to S3/Azure/GCS:
```bash
# AWS S3 example
aws s3 cp data/straznik.db s3://your-bucket/backups/straznik-$(date +%Y%m%d).db
```

## Performance Tuning

### Database Optimization

```sql
-- Run periodically
PRAGMA optimize;
PRAGMA wal_checkpoint(TRUNCATE);
```

### Node.js Tuning

```bash
# Increase file descriptor limit
ulimit -n 65536

# Set in systemd service
LimitNOFILE=65536
```

### Caching

Backend uses HTTP cache for external APIs (120s TTL).

Consider adding Redis for:
- API response caching
- Session storage
- Rate limiting

## Disaster Recovery

### Recovery Steps

1. Stop backend service
2. Restore database from backup
3. Verify data integrity
4. Start backend service
5. Monitor logs for errors

### Data Loss Prevention

- Regular automated backups
- Database replication (for critical deployments)
- Transaction logging
- Point-in-time recovery capability

## Support

For issues and questions:
- GitHub Issues: https://github.com/aggregatemy/Str/issues
- Documentation: `docs/` directory
- Logs: `logs/backend.log`

## Checklist

Pre-deployment checklist:

- [ ] Node.js >= 18.0.0 installed
- [ ] Dependencies installed (`npm install`)
- [ ] Environment configured (`.env`)
- [ ] CORS origin set correctly
- [ ] Database directory created and writable
- [ ] Logs directory created and writable
- [ ] Build completed (`npm run build`)
- [ ] Tests passed (`npm test`)
- [ ] Process manager configured (PM2/systemd)
- [ ] Firewall rules configured
- [ ] Reverse proxy configured (nginx/Apache)
- [ ] SSL/TLS certificates installed
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health check endpoint tested

Post-deployment verification:

- [ ] Health check returns 200 OK
- [ ] API endpoints respond correctly
- [ ] Cron jobs execute on schedule
- [ ] Logs are being written
- [ ] Database updates are persisted
- [ ] No errors in logs
- [ ] Memory usage stable
- [ ] CPU usage reasonable
