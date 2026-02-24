# Complete RobotPDF Installation Guide for AWS EC2 Ubuntu

This is a **full-stack application** with a React frontend, Node.js backend, Python microservices, and Supabase database. Here's a detailed step-by-step installation guide.

---

## **PHASE 1: EC2 INSTANCE SETUP & PREREQUISITES**

### **Step 1.1: Launch EC2 Instance**
- **Instance Type**: `t3.medium` or `t3.large` (minimum for this application)
- **Storage**: 100GB+ (for logs, temp files, tessdata)
- **OS**: Ubuntu 22.04 LTS (x86_64) or Ubuntu 20.04 LTS
- **Security Group**: Open ports 80, 443, 3000 (frontend), 5000 (backend), 8000 (Python services)

### **Step 1.2: Initial Server Setup**
```bash
# Connect to your EC2 instance via SSH
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y curl wget git build-essential
```

---

## **PHASE 2: RUNTIME ENVIRONMENTS INSTALLATION**

### **Step 2.1: Install Node.js (v18+)**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v22.x
npm --version   # Should be v10.x
```

### **Step 2.2: Install Python 3.10+**
```bash
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Verify installation
python3 --version  # Should be 3.10+
pip3 --version
```

### **Step 2.3: Install Redis (for caching & job queues)**
```bash
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return "PONG"
```

---

## **PHASE 3: SYSTEM DEPENDENCIES FOR PDF & OCR PROCESSING**

### **Step 3.1: Install Puppeteer Dependencies**
```bash
# Chromium and dependencies for Puppeteer (headless browser)
sudo apt install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdri2-1 \
    libexpat1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxft2 \
    libxinerama1 \
    libxrandr2 \
    libxrender1 \
    libxslt1.1
```

### **Step 3.2: Install Tesseract OCR**
```bash
sudo apt install -y tesseract-ocr tesseract-ocr-all

# Verify installation
tesseract --version

# Install ImageMagick (for image processing)
sudo apt install -y imagemagick
```

### **Step 3.3: Install LibreOffice & PDF Tools**
```bash
# For document conversion (Word, Excel, etc to PDF)
sudo apt install -y libreoffice libreoffice-writer

# PDF manipulation tools
sudo apt install -y poppler-utils ghostscript

# For image handling
sudo apt install -y libpng-dev libjpeg-dev librsvg2-dev
```

---

## **PHASE 4: CLONING & SETTING UP PROJECT FILES**

### **Step 4.1: Clone Repository**
```bash
cd /home/ubuntu
git clone https://github.com/your-repo/robotpdf.git
cd robotpdf
```

### **Step 4.2: Create Directory Structure**
```bash
# Create directories for temp files and uploads
mkdir -p backend/temp
mkdir -p backend/uploads
mkdir -p backend/tessdata

# Set proper permissions
chmod -R 755 backend/temp
chmod -R 755 backend/uploads
```

---

## **PHASE 5: BACKEND SETUP**

### **Step 5.1: Install Node Dependencies**
```bash
cd /home/ubuntu/robotpdf/backend

# Install dependencies
npm install

# If you face issues with Puppeteer, use:
npm install --no-save puppeteer
```

### **Step 5.2: Create Environment File (.env)**
```bash
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Supabase Configuration (Get from Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Database URL (if using external PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/robotpdf

# Redis Configuration
REDIS_URL=redis://localhost:6379

# File Upload Configuration
MAX_FILE_SIZE=104857600  # 100MB in bytes
MAX_FILES_BATCH=10
UPLOAD_TEMP_DIR=/home/ubuntu/robotpdf/backend/temp
UPLOAD_DIR=/home/ubuntu/robotpdf/backend/uploads

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_PRO=price_your_pro_price
STRIPE_PRICE_ID_DEVS=price_your_devs_price

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=live

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=sk-your_openai_key
OPENAI_MODEL=gpt-4-turbo

# CORS Configuration
CORS_ORIGIN=https://your-domain.com,http://localhost:3000
ALLOWED_ORIGINS=https://your-domain.com

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# OCR Configuration
OCR_SERVICE_URL=http://localhost:8000
OCR_ENABLED=true
OCR_LANGUAGES=eng,hin,fra,deu,spa,jpn,kor

# File Processing
COMPRESS_QUALITY=0.8
ENABLE_WATERMARK=false

# Application URLs
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com
EOF
```

### **Step 5.3: Download Tessdata (OCR Language Files)**
```bash
# Navigate to tessdata directory
cd /home/ubuntu/robotpdf/backend/tessdata

# Download language data files (already in your repo, verify they exist)
ls -la

# If missing, download them:
# wget https://github.com/UB-Mannheim/tesseract/wiki/Data-Files
```

---

## **PHASE 6: FRONTEND SETUP**

### **Step 6.1: Install Dependencies & Build**
```bash
cd /home/ubuntu/robotpdf/web

# Install npm dependencies
npm install

# Create .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://api.your-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_APP_ENV=production
EOF

# Build for production
npm run build

# Output will be in 'dist' directory
ls -la dist/
```

---

## **PHASE 7: PYTHON MICROSERVICES SETUP**

### **Step 7.1: Create Python Virtual Environment**
```bash
cd /home/ubuntu/robotpdf/backend/python_services

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

### **Step 7.2: Install Python Dependencies**
```bash
# With venv activated:
pip install -r requirements.txt

# Install additional dependencies for EasyOCR
pip install easyocr>=1.7.0
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# For PaddleOCR (optional, for better Asian language support)
pip install paddlepaddle paddleocr
```

### **Step 7.3: Verify Python Services**
```bash
python3 -c "import easyocr; print('EasyOCR installed successfully')"
python3 -c "import pdf2docx; print('pdf2docx installed successfully')"
python3 -c "import PyPDF2; print('PyPDF2 installed successfully')"
```

---

## **PHASE 8: DATABASE SETUP**

### **Step 8.1: Create Supabase Project** (Cloud-hosted option)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection details from **settings → database**
4. Update `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

### **Step 8.2: Initialize Database Schema**
```bash
# Connect to Supabase SQL Editor and run:
# backend/database/schema.sql
# Copy entire content and execute in Supabase SQL editor
```

### **Step 8.3: (Optional) Local PostgreSQL Setup**
```bash
# If using local PostgreSQL instead of Supabase
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create robotpdf database
sudo -u postgres createdb robotpdf

# Create user
sudo -u postgres createuser robotpdf_user
sudo -u postgres psql -c "ALTER USER robotpdf_user WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "ALTER DATABASE robotpdf OWNER TO robotpdf_user;"

# Run schema
sudo -u postgres psql robotpdf < /home/ubuntu/robotpdf/backend/database/schema.sql

# Connection string for .env:
# postgresql://robotpdf_user:your-secure-password@localhost:5432/robotpdf
```

---

## **PHASE 9: SYSTEMD SERVICE SETUP (Auto-restart on reboot)**

### **Step 9.1: Create Backend Service**
```bash
sudo tee /etc/systemd/system/robotpdf-backend.service > /dev/null << 'EOF'
[Unit]
Description=RobotPDF Backend API
After=network.target redis-server.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/robotpdf/backend
Environment="NODE_ENV=production"
EnvironmentFile=/home/ubuntu/robotpdf/backend/.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=robotpdf-backend

[Install]
WantedBy=multi-user.target
EOF
```

### **Step 9.2: Create OCR Service**
```bash
sudo tee /etc/systemd/system/robotpdf-ocr.service > /dev/null << 'EOF'
[Unit]
Description=RobotPDF OCR Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/robotpdf/backend/python_services
Environment="PYTHONUNBUFFERED=1"
EnvironmentFile=/home/ubuntu/robotpdf/backend/.env
ExecStart=/home/ubuntu/robotpdf/backend/python_services/venv/bin/python ocr_server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=robotpdf-ocr

[Install]
WantedBy=multi-user.target
EOF
```

### **Step 9.3: Enable and Start Services**
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services (auto-start on reboot)
sudo systemctl enable robotpdf-backend.service
sudo systemctl enable robotpdf-ocr.service

# Start services
sudo systemctl start robotpdf-backend.service
sudo systemctl start robotpdf-ocr.service

# Check status
sudo systemctl status robotpdf-backend.service
sudo systemctl status robotpdf-ocr.service

# View logs
sudo journalctl -u robotpdf-backend.service -n 50 -f
sudo journalctl -u robotpdf-ocr.service -n 50 -f
```

---

## **PHASE 10: NGINX REVERSE PROXY & SSL SETUP**

### **Step 10.1: Install Nginx**
```bash
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/robotpdf > /dev/null << 'EOF'
upstream backend {
    server localhost:5000;
}

upstream ocr_service {
    server localhost:8000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com api.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL certificates (get from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    
    # Frontend
    root /home/ubuntu/robotpdf/web/dist;
    location / {
        try_files $uri /index.html;
    }
    
    # Assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
        proxy_buffering off;
    }
    
    # OCR service route
    location /ocr/ {
        proxy_pass http://ocr_service/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
```

### **Step 10.2: Enable Nginx Site**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/robotpdf /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **Step 10.3: Setup SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Update domain in command below
sudo certbot certonly --standalone \
    -d your-domain.com \
    -d www.your-domain.com \
    -d api.your-domain.com \
    --email admin@your-domain.com \
    --agree-tos \
    --non-interactive

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## **PHASE 11: SECURITY HARDENING**

### **Step 11.1: Configure Firewall**
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny other ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check status
sudo ufw status
```

### **Step 11.2: Secure SSH**
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change to port 2222 (uncomment and modify):
# Port 2222

# Disable password auth (use key-only):
# PubkeyAuthentication yes
# PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd

# Update firewall
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

---

## **PHASE 12: MONITORING & MAINTENANCE**

### **Step 12.1: Setup Log Rotation**
```bash
sudo tee /etc/logrotate.d/robotpdf > /dev/null << 'EOF'
/home/ubuntu/robotpdf/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
EOF
```

### **Step 12.2: Monitor Services**
```bash
# Check all services status
sudo systemctl status robotpdf-backend.service robotpdf-ocr.service nginx redis-server postgresql

# Monitor in real-time
watch -n 5 'sudo systemctl status robotpdf-backend.service robotpdf-ocr.service'

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU load
uptime
```

### **Step 12.3: Backup Database**
```bash
# Create backup script
cat > /home/ubuntu/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/robotpdf/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup from Supabase (using pg_dump)
pg_dump "postgresql://user:password@db.supabase.co:5432/postgres" \
    > "$BACKUP_DIR/robotpdf_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/robotpdf_$DATE.sql"
EOF

chmod +x /home/ubuntu/backup_db.sh

# Schedule daily backups (cron)
crontab -e
# Add line: 0 2 * * * /home/ubuntu/backup_db.sh
```

---

## **PHASE 13: VERIFICATION & TESTING**

### **Step 13.1: Test All Services**
```bash
# Test backend API
curl -I http://localhost:5000/health

# Test via Nginx
curl -I https://api.your-domain.com/health

# Test frontend
curl -I https://your-domain.com

# Check service logs
sudo journalctl -u robotpdf-backend.service -n 20
sudo journalctl -u robotpdf-ocr.service -n 20

# Test Redis
redis-cli ping

# Test database connection
psql "postgresql://robotpdf_user:password@localhost:5432/robotpdf" -c "SELECT version();"
```

### **Step 13.2: Performance Testing**
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Load test
ab -n 100 -c 10 https://your-domain.com/
ab -n 100 -c 10 https://api.your-domain.com/health
```

---

## **PHASE 14: PRODUCTION CHECKLIST**

- [ ] Update all environment variables in `.env` files
- [ ] Configure Stripe, PayPal, Razorpay keys
- [ ] Configure OpenAI API key
- [ ] Setup SMTP for email sending
- [ ] Configure Supabase database and storage
- [ ] Update CORS origins in backend config
- [ ] Update allowed domains in Nginx
- [ ] Setup SSL certificates with Let's Encrypt
- [ ] Enable firewall and restrict access
- [ ] Configure backups and retention policies
- [ ] Setup monitoring and alerts
- [ ] Test all payment integrations
- [ ] Test file upload/download
- [ ] Test OCR functionality
- [ ] Load test the application
- [ ] Setup error tracking (Sentry optional)

---

## **QUICK TROUBLESHOOTING**

```bash
# Clear port if already in use
sudo lsof -i :5000
sudo kill -9 <PID>

# Check Nginx errors
sudo tail -f /var/log/nginx/error.log

# Restart all services
sudo systemctl restart robotpdf-backend robotpdf-ocr nginx

# Check application logs
sudo journalctl -u robotpdf-backend.service -f
```

---

This guide provides a complete production-ready setup for your RobotPDF application on AWS EC2 Ubuntu. Adjust domain names, API keys, and resource allocation based on your specific requirements!
