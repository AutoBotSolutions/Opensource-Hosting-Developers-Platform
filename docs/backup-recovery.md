# Backup and Recovery Guide

This comprehensive guide covers all backup and recovery procedures for the HostingCo system, including automated backups, disaster recovery, and data restoration.

## 💾 Backup System Overview

The HostingCo backup system provides comprehensive data protection through automated backups, point-in-time recovery, and disaster recovery procedures.

### Backup Components
- **Database Backups** - PostgreSQL database dumps and WAL archiving
- **File System Backups** - Application files, uploads, and configuration
- **Configuration Backups** - System settings and environment configurations
- **Application Backups** - Source code and deployment artifacts
- **Log Backups** - System and application logs for audit purposes

## Database Backup Procedures

### Automated Database Backups

#### PostgreSQL Backup Script
```bash
#!/bin/bash
# database-backup.sh

# Configuration
DB_NAME="hostingco"
DB_USER="hostingco"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hostingco_backup_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=== Database Backup - $(date) ==="

# Create database backup
echo "1. Creating database backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Database backup created successfully"
    
    # Compress backup
    echo "2. Compressing backup..."
    gzip "$BACKUP_FILE"
    
    # Verify compressed backup
    if [ -f "$COMPRESSED_FILE" ]; then
        echo "Backup compressed successfully"
        echo "Backup file: $COMPRESSED_FILE"
        
        # Get backup size
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo "Backup size: $BACKUP_SIZE"
        
        # Create backup metadata
        METADATA_FILE="${BACKUP_DIR}/backup_metadata_${DATE}.json"
        cat > "$METADATA_FILE" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "database": "$DB_NAME",
    "backup_file": "$(basename "$COMPRESSED_FILE")",
    "backup_size": "$BACKUP_SIZE",
    "backup_type": "full",
    "compression": "gzip"
}
EOF
        
        echo "Metadata file created: $METADATA_FILE"
        
        # Clean up old backups (keep 30 days)
        echo "3. Cleaning up old backups..."
        find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
        find "$BACKUP_DIR" -name "backup_metadata_*.json" -mtime +30 -delete
        
        echo "Old backups cleaned up"
        
    else
        echo "Backup compression failed"
        exit 1
    fi
else
    echo "Database backup failed"
    exit 1
fi

echo "=== Database Backup Complete ==="

# Send backup notification
if [ -n "$BACKUP_NOTIFICATION_EMAIL" ]; then
    echo "Sending backup notification to $BACKUP_NOTIFICATION_EMAIL"
    echo "Database backup completed successfully. File: $COMPRESSED_FILE, Size: $BACKUP_SIZE" | \
    mail -s "HostingCo Database Backup - $(date)" "$BACKUP_NOTIFICATION_EMAIL"
fi
```

#### WAL Archiving Setup
```bash
#!/bin/bash
# wal-archiving-setup.sh

echo "=== WAL Archiving Setup ==="

# Create WAL archive directory
WAL_ARCHIVE_DIR="/backups/wal_archive"
mkdir -p "$WAL_ARCHIVE_DIR"

# Configure PostgreSQL for WAL archiving
echo "1. Configuring PostgreSQL for WAL archiving..."

# Update postgresql.conf
cat >> /etc/postgresql/15/main/postgresql.conf << EOF

# WAL Archiving Configuration
wal_level = replica
archive_mode = on
archive_command = 'cp %p $WAL_ARCHIVE_DIR/%f'
archive_timeout = 1800
max_wal_senders = 3
wal_keep_segments = 32
EOF

# Create archive command script
cat > /usr/local/bin/archive-wal.sh << 'EOF'
#!/bin/bash
WAL_ARCHIVE_DIR="/backups/wal_archive"
DATE=$(date +%Y%m%d)
WAL_DATE_DIR="$WAL_ARCHIVE_DIR/$DATE"
mkdir -p "$WAL_DATE_DIR"
cp "$1" "$WAL_DATE_DIR/$2"
EOF

chmod +x /usr/local/bin/archive-wal.sh

# Update postgresql.conf with custom archive command
sed -i "s|archive_command = 'cp %p \$WAL_ARCHIVE_DIR/%f'|archive_command = '/usr/local/bin/archive-wal.sh %p %f'|" /etc/postgresql/15/main/postgresql.conf

# Restart PostgreSQL
echo "2. Restarting PostgreSQL..."
systemctl restart postgresql

# Verify WAL archiving
echo "3. Verifying WAL archiving..."
psql -U hostingco -d hostingco -c "SELECT pg_switch_wal();"

echo "=== WAL Archiving Setup Complete ==="
```

#### Point-in-Time Recovery Setup
```bash
#!/bin/bash
# pitr-setup.sh

echo "=== Point-in-Time Recovery Setup ==="

# Create recovery configuration
RECOVERY_DIR="/backups/recovery"
mkdir -p "$RECOVERY_DIR"

# Create recovery script
cat > /usr/local/bin/perform-pitr.sh << 'EOF'
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <recovery_time>"
    echo "Example: $0 '2026-05-08 15:30:00'"
    exit 1
fi

RECOVERY_TIME="$1"
RECOVERY_DIR="/backups/recovery"
WAL_ARCHIVE_DIR="/backups/wal_archive"
DB_NAME="hostingco"
DB_USER="hostingco"

echo "=== Point-in-Time Recovery ==="
echo "Recovery Time: $RECOVERY_TIME"

# Stop PostgreSQL
echo "1. Stopping PostgreSQL..."
systemctl stop postgresql

# Backup current data directory
echo "2. Backing up current data directory..."
if [ -d "/var/lib/postgresql/15/main" ]; then
    mv /var/lib/postgresql/15/main /var/lib/postgresql/15/main_backup_$(date +%Y%m%d_%H%M%S)
fi

# Create new data directory
echo "3. Creating new data directory..."
mkdir -p /var/lib/postgresql/15/main
chown postgres:postgres /var/lib/postgresql/15/main

# Find latest base backup
echo "4. Finding latest base backup..."
LATEST_BACKUP=$(ls -t /backups/database/hostingco_backup_*.sql.gz | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    echo "No base backup found"
    exit 1
fi

echo "Using base backup: $LATEST_BACKUP"

# Restore base backup
echo "5. Restoring base backup..."
gunzip -c "$LATEST_BACKUP" | psql -h localhost -U "$DB_USER" -d "$DB_NAME"

# Create recovery configuration
echo "6. Creating recovery configuration..."
cat > /var/lib/postgresql/15/main/recovery.conf << RECOVERY_CONF
restore_command = 'cp $WAL_ARCHIVE_DIR/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
RECOVERY_CONF

chown postgres:postgres /var/lib/postgresql/15/main/recovery.conf

# Start PostgreSQL
echo "7. Starting PostgreSQL..."
systemctl start postgresql

# Wait for recovery to complete
echo "8. Waiting for recovery to complete..."
sleep 30

# Check recovery status
echo "9. Checking recovery status..."
if pg_isready -h localhost -p 5432 -U "$DB_USER"; then
    echo "Recovery completed successfully"
    
    # Remove recovery configuration
    rm /var/lib/postgresql/15/main/recovery.conf
    
    # Verify data
    psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT count(*) FROM users;"
    
else
    echo "Recovery failed"
    exit 1
fi

echo "=== Point-in-Time Recovery Complete ==="
EOF

chmod +x /usr/local/bin/perform-pitr.sh

echo "=== Point-in-Time Recovery Setup Complete ==="
```

## 📁 File System Backup Procedures

### Application Files Backup

#### File System Backup Script
```bash
#!/bin/bash
# filesystem-backup.sh

# Configuration
SOURCE_DIR="/home/robbie/Desktop/HostingCo"
BACKUP_DIR="/backups/filesystem"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hostingco_files_${DATE}.tar.gz"
EXCLUDE_FILE="/tmp/backup_exclude.txt"

# Create exclude file
cat > "$EXCLUDE_FILE" << EOF
node_modules
.git
*.log
*.tmp
.env.local
.env.*.local
dist
build
.cache
.DS_Store
Thumbs.db
EOF

echo "=== File System Backup - $(date) ==="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create file system backup
echo "1. Creating file system backup..."
tar -czf "$BACKUP_FILE" -C "$(dirname "$SOURCE_DIR")" \
    --exclude-from="$EXCLUDE_FILE" \
    "$(basename "$SOURCE_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "File system backup created successfully"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Create backup metadata
    METADATA_FILE="${BACKUP_DIR}/files_backup_metadata_${DATE}.json"
    cat > "$METADATA_FILE" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "source_directory": "$SOURCE_DIR",
    "backup_file": "$(basename "$BACKUP_FILE")",
    "backup_size": "$BACKUP_SIZE",
    "backup_type": "filesystem",
    "compression": "gzip",
    "excluded_patterns": ["node_modules", ".git", "*.log", "*.tmp"]
}
EOF
    
    echo "Metadata file created: $METADATA_FILE"
    
    # Verify backup integrity
    echo "2. Verifying backup integrity..."
    if tar -tzf "$BACKUP_FILE" > /dev/null; then
        echo "Backup integrity verified"
    else
        echo "Backup integrity check failed"
        exit 1
    fi
    
    # Clean up old backups (keep 14 days)
    echo "3. Cleaning up old backups..."
    find "$BACKUP_DIR" -name "hostingco_files_*.tar.gz" -mtime +14 -delete
    find "$BACKUP_DIR" -name "files_backup_metadata_*.json" -mtime +14 -delete
    
    echo "Old backups cleaned up"
    
else
    echo "File system backup failed"
    exit 1
fi

# Clean up exclude file
rm -f "$EXCLUDE_FILE"

echo "=== File System Backup Complete ==="
```

#### Configuration Backup Script
```bash
#!/bin/bash
# config-backup.sh

# Configuration
CONFIG_DIR="/etc/hostingco"
BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/config_backup_${DATE}.tar.gz"

echo "=== Configuration Backup - $(date) ==="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create configuration backup
echo "1. Creating configuration backup..."

# Create temporary directory for config files
TEMP_DIR="/tmp/config_backup_${DATE}"
mkdir -p "$TEMP_DIR"

# Copy configuration files
echo "2. Copying configuration files..."

# Application configuration
cp -r /home/robbie/Desktop/HostingCo/.env* "$TEMP_DIR/" 2>/dev/null || true
cp -r /home/robbie/Desktop/HostingCo/backend/.env* "$TEMP_DIR/" 2>/dev/null || true
cp -r /home/robbie/Desktop/HostingCo/frontend/.env* "$TEMP_DIR/" 2>/dev/null || true

# System configuration
mkdir -p "$TEMP_DIR/system"
cp /etc/nginx/sites-available/hostingco "$TEMP_DIR/system/" 2>/dev/null || true
cp /etc/postgresql/15/main/postgresql.conf "$TEMP_DIR/system/" 2>/dev/null || true
cp /etc/redis/redis.conf "$TEMP_DIR/system/" 2>/dev/null || true

# SSL certificates
if [ -d "/etc/ssl/certs" ]; then
    mkdir -p "$TEMP_DIR/ssl"
    cp -r /etc/ssl/certs/yourdomain.* "$TEMP_DIR/ssl/" 2>/dev/null || true
    cp -r /etc/ssl/private/yourdomain.key "$TEMP_DIR/ssl/" 2>/dev/null || true
fi

# Create backup archive
echo "3. Creating backup archive..."
tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Configuration backup created successfully"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Create backup metadata
    METADATA_FILE="${BACKUP_DIR}/config_backup_metadata_${DATE}.json"
    cat > "$METADATA_FILE" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "backup_file": "$(basename "$BACKUP_FILE")",
    "backup_size": "$BACKUP_SIZE",
    "backup_type": "configuration",
    "compression": "gzip",
    "includes": ["environment_files", "nginx_config", "postgresql_config", "redis_config", "ssl_certificates"]
}
EOF
    
    echo "Metadata file created: $METADATA_FILE"
    
    # Clean up old backups (keep 30 days)
    echo "4. Cleaning up old backups..."
    find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -mtime +30 -delete
    find "$BACKUP_DIR" -name "config_backup_metadata_*.json" -mtime +30 -delete
    
    echo "Old backups cleaned up"
    
else
    echo "Configuration backup failed"
    exit 1
fi

# Clean up temporary directory
rm -rf "$TEMP_DIR"

echo "=== Configuration Backup Complete ==="
```

## Automated Backup System

### Backup Automation Script
```bash
#!/bin/bash
# automated-backup.sh

# Configuration
BACKUP_LOG="/var/log/backup.log"
BACKUP_LOCK="/var/run/backup.lock"
BACKUP_TYPES=("database" "filesystem" "config")

echo "=== Automated Backup System - $(date) ===" | tee -a "$BACKUP_LOG"

# Check if backup is already running
if [ -f "$BACKUP_LOCK" ]; then
    echo "Backup already running, skipping" | tee -a "$BACKUP_LOG"
    exit 1
fi

# Create lock file
touch "$BACKUP_LOCK"

# Function to handle cleanup
cleanup() {
    rm -f "$BACKUP_LOCK"
    echo "=== Backup Cleanup Complete - $(date) ===" | tee -a "$BACKUP_LOG"
}

trap cleanup EXIT

# Function to send notification
send_notification() {
    local message="$1"
    local severity="$2"
    
    echo "$message" | tee -a "$BACKUP_LOG"
    
    # Send email notification
    if [ -n "$BACKUP_NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "HostingCo Backup Alert - $severity" "$BACKUP_NOTIFICATION_EMAIL"
    fi
    
    # Send webhook notification
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"message\":\"$message\",\"severity\":\"$severity\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# Run backups
for backup_type in "${BACKUP_TYPES[@]}"; do
    echo "Starting $backup_type backup..." | tee -a "$BACKUP_LOG"
    
    case "$backup_type" in
        "database")
            /usr/local/bin/database-backup.sh 2>&1 | tee -a "$BACKUP_LOG"
            ;;
        "filesystem")
            /usr/local/bin/filesystem-backup.sh 2>&1 | tee -a "$BACKUP_LOG"
            ;;
        "config")
            /usr/local/bin/config-backup.sh 2>&1 | tee -a "$BACKUP_LOG"
            ;;
    esac
    
    # Check if backup was successful
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "$backup_type backup completed successfully" | tee -a "$BACKUP_LOG"
    else
        error_message="$backup_type backup failed"
        echo "$error_message" | tee -a "$BACKUP_LOG"
        send_notification "$error_message" "error"
    fi
done

# Generate backup summary
echo "=== Backup Summary - $(date) ===" | tee -a "$BACKUP_LOG"

# Database backups
DB_BACKUP_COUNT=$(ls /backups/database/hostingco_backup_*.sql.gz 2>/dev/null | wc -l)
echo "Database backups: $DB_BACKUP_COUNT" | tee -a "$BACKUP_LOG"

# File system backups
FS_BACKUP_COUNT=$(ls /backups/filesystem/hostingco_files_*.tar.gz 2>/dev/null | wc -l)
echo "File system backups: $FS_BACKUP_COUNT" | tee -a "$BACKUP_LOG"

# Configuration backups
CONFIG_BACKUP_COUNT=$(ls /backups/config/config_backup_*.tar.gz 2>/dev/null | wc -l)
echo "Configuration backups: $CONFIG_BACKUP_COUNT" | tee -a "$BACKUP_LOG"

# Check backup storage space
BACKUP_SPACE=$(df -h /backups | awk 'NR==2{print $4}')
echo "Available backup space: $BACKUP_SPACE" | tee -a "$BACKUP_LOG"

# Send completion notification
send_notification "All scheduled backups completed successfully" "info"

echo "=== Automated Backup System Complete ===" | tee -a "$BACKUP_LOG"
```

### Backup Cron Jobs Setup
```bash
#!/bin/bash
# setup-backup-cron.sh

echo "=== Setting Up Backup Cron Jobs ==="

# Create backup cron jobs
echo "1. Creating backup cron jobs..."

# Daily backup at 2:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/automated-backup.sh") | crontab -

# Weekly backup verification on Sundays at 3:00 AM
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/verify-backups.sh") | crontab -

# Monthly backup cleanup on the 1st at 4:00 AM
(crontab -l 2>/dev/null; echo "0 4 1 * * /usr/local/bin/cleanup-old-backups.sh") | crontab -

# WAL archiving check every hour
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/check-wal-archiving.sh") | crontab -

echo "2. Listing current cron jobs:"
crontab -l

echo "=== Backup Cron Jobs Setup Complete ==="
```

## Recovery Procedures

### Database Recovery

#### Full Database Recovery
```bash
#!/bin/bash
# database-recovery.sh

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backups/database/hostingco_backup_20260508_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="hostingco"
DB_USER="hostingco"

echo "=== Database Recovery - $(date) ==="
echo "Backup file: $BACKUP_FILE"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify backup integrity
echo "1. Verifying backup integrity..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    if ! gzip -t "$BACKUP_FILE"; then
        echo "Backup file is corrupted"
        exit 1
    fi
else
    if ! head -n 1 "$BACKUP_FILE" | grep -q "PostgreSQL database dump"; then
        echo "Invalid backup file format"
        exit 1
    fi
fi

echo "Backup integrity verified"

# Stop application services
echo "2. Stopping application services..."
systemctl stop hostingco-backend || true

# Create recovery database
echo "3. Creating recovery database..."
psql -U postgres -c "DROP DATABASE IF EXISTS ${DB_NAME}_recovery;" 2>/dev/null || true
psql -U postgres -c "CREATE DATABASE ${DB_NAME}_recovery;"

# Restore backup
echo "4. Restoring database..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" -d "${DB_NAME}_recovery"
else
    psql -U "$DB_USER" -d "${DB_NAME}_recovery" < "$BACKUP_FILE"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Database restore completed successfully"
    
    # Verify restored data
    echo "5. Verifying restored data..."
    USER_COUNT=$(psql -U "$DB_USER" -d "${DB_NAME}_recovery" -t -c "SELECT count(*) FROM users;")
    echo "Restored users: $USER_COUNT"
    
    # Backup current database
    echo "6. Backing up current database..."
    CURRENT_BACKUP="/backups/database/pre_recovery_backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump -U "$DB_USER" -d "$DB_NAME" > "$CURRENT_BACKUP"
    echo "Current database backed up to: $CURRENT_BACKUP"
    
    # Replace current database
    echo "7. Replacing current database..."
    psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql -U postgres -c "ALTER DATABASE ${DB_NAME}_recovery RENAME TO $DB_NAME;"
    
    # Restart application services
    echo "8. Restarting application services..."
    systemctl start hostingco-backend
    
    # Verify database is accessible
    sleep 10
    if pg_isready -h localhost -p 5432 -U "$DB_USER"; then
        echo "Database is accessible"
        
        # Final verification
        FINAL_USER_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM users;")
        echo "Final user count: $FINAL_USER_COUNT"
        
        if [ "$USER_COUNT" -eq "$FINAL_USER_COUNT" ]; then
            echo "Database recovery completed successfully"
        else
            echo "User count mismatch: expected $USER_COUNT, got $FINAL_USER_COUNT"
        fi
    else
        echo "Database is not accessible after recovery"
        exit 1
    fi
else
    echo "Database restore failed"
    exit 1
fi

echo "=== Database Recovery Complete ==="
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# point-in-time-recovery.sh

if [ $# -ne 1 ]; then
    echo "Usage: $0 <recovery_time>"
    echo "Example: $0 '2026-05-08 15:30:00'"
    echo "Example: $0 '2026-05-08 15:30:00+00:00'"
    exit 1
fi

RECOVERY_TIME="$1"
DB_NAME="hostingco"
DB_USER="hostingco"

echo "=== Point-in-Time Recovery - $(date) ==="
echo "Recovery time: $RECOVERY_TIME"

# Validate recovery time format
if ! date -d "$RECOVERY_TIME" >/dev/null 2>&1; then
    echo "Invalid recovery time format"
    exit 1
fi

# Stop application services
echo "1. Stopping application services..."
systemctl stop hostingco-backend || true

# Stop PostgreSQL
echo "2. Stopping PostgreSQL..."
systemctl stop postgresql

# Backup current data directory
echo "3. Backing up current data directory..."
if [ -d "/var/lib/postgresql/15/main" ]; then
    BACKUP_DIR="/var/lib/postgresql/15/main_backup_$(date +%Y%m%d_%H%M%S)"
    mv /var/lib/postgresql/15/main "$BACKUP_DIR"
    echo "Current data backed up to: $BACKUP_DIR"
fi

# Create new data directory
echo "4. Creating new data directory..."
mkdir -p /var/lib/postgresql/15/main
chown postgres:postgres /var/lib/postgresql/15/main

# Find latest base backup
echo "5. Finding latest base backup..."
LATEST_BACKUP=$(ls -t /backups/database/hostingco_backup_*.sql.gz | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    echo "No base backup found"
    exit 1
fi

echo "Using base backup: $LATEST_BACKUP"

# Restore base backup
echo "6. Restoring base backup..."
gunzip -c "$LATEST_BACKUP" | psql -U "$DB_USER" -d "$DB_NAME"

# Create recovery configuration
echo "7. Creating recovery configuration..."
cat > /var/lib/postgresql/15/main/recovery.conf << EOF
restore_command = 'cp /backups/wal_archive/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
recovery_target_inclusive = true
EOF

chown postgres:postgres /var/lib/postgresql/15/main/recovery.conf

# Start PostgreSQL
echo "8. Starting PostgreSQL..."
systemctl start postgresql

# Wait for recovery to complete
echo "9. Waiting for recovery to complete..."
sleep 30

# Check recovery status
RECOVERY_ATTEMPTS=0
MAX_ATTEMPTS=60

while [ $RECOVERY_ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if pg_isready -h localhost -p 5432 -U "$DB_USER"; then
        echo "Recovery completed successfully"
        break
    fi
    
    echo "Waiting for recovery... ($RECOVERY_ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 10
    RECOVERY_ATTEMPTS=$((RECOVERY_ATTEMPTS + 1))
done

if [ $RECOVERY_ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "Recovery timed out"
    exit 1
fi

# Verify recovery
echo "10. Verifying recovery..."
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT count(*) FROM users;"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT max(created_at) FROM users;"

# Remove recovery configuration
echo "11. Removing recovery configuration..."
rm /var/lib/postgresql/15/main/recovery.conf

# Restart application services
echo "12. Restarting application services..."
systemctl start hostingco-backend

# Final verification
sleep 10
if curl -s http://localhost:3003/api/health > /dev/null; then
    echo "Application is responding"
else
    echo "Application is not responding"
    exit 1
fi

echo "=== Point-in-Time Recovery Complete ==="
```

### File System Recovery

#### Application Files Recovery
```bash
#!/bin/bash
# filesystem-recovery.sh

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backups/filesystem/hostingco_files_20260508_020000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
TARGET_DIR="/home/robbie/Desktop/HostingCo"

echo "=== File System Recovery - $(date) ==="
echo "Backup file: $BACKUP_FILE"
echo "Target directory: $TARGET_DIR"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify backup integrity
echo "1. Verifying backup integrity..."
if ! tar -tzf "$BACKUP_FILE" > /dev/null; then
    echo "Backup file is corrupted"
    exit 1
fi

echo "Backup integrity verified"

# Stop application services
echo "2. Stopping application services..."
systemctl stop hostingco-backend || true

# Backup current directory
echo "3. Backing up current directory..."
if [ -d "$TARGET_DIR" ]; then
    CURRENT_BACKUP="/home/robbie/Desktop/HostingCo_backup_$(date +%Y%m%d_%H%M%S)"
    mv "$TARGET_DIR" "$CURRENT_BACKUP"
    echo "Current directory backed up to: $CURRENT_BACKUP"
fi

# Create target directory
echo "4. Creating target directory..."
mkdir -p "$TARGET_DIR"

# Restore files
echo "5. Restoring files..."
tar -xzf "$BACKUP_FILE" -C "$(dirname "$TARGET_DIR")"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "File system restore completed successfully"
    
    # Restore permissions
    echo "6. Restoring permissions..."
    chown -R $(whoami):$(whoami) "$TARGET_DIR"
    chmod -R 755 "$TARGET_DIR"
    
    # Restore environment files if they exist
    echo "7. Checking for environment files..."
    if [ -f "/home/robbie/Desktop/HostingCo_backup_$(date +%Y%m%d_%H%M%S)/.env" ]; then
        cp "/home/robbie/Desktop/HostingCo_backup_$(date +%Y%m%d_%H%M%S)/.env" "$TARGET_DIR/"
        echo "Environment file restored"
    fi
    
    # Reinstall dependencies
    echo "8. Reinstalling dependencies..."
    cd "$TARGET_DIR"
    npm run install:all
    
    # Restart application services
    echo "9. Restarting application services..."
    systemctl start hostingco-backend
    
    # Verify application
    sleep 10
    if curl -s http://localhost:3003/api/health > /dev/null; then
        echo "Application is responding"
    else
        echo "Application is not responding"
        exit 1
    fi
else
    echo "File system restore failed"
    exit 1
fi

echo "=== File System Recovery Complete ==="
```

## Disaster Recovery

### Disaster Recovery Plan

#### Disaster Recovery Script
```bash
#!/bin/bash
# disaster-recovery.sh

echo "=== Disaster Recovery Plan - $(date) ==="

# Configuration
DISASTER_RECOVERY_DIR="/backups/disaster_recovery"
DATE=$(date +%Y%m%d_%H%M%S)
RECOVERY_LOG="/var/log/disaster_recovery.log"

# Create recovery directory
mkdir -p "$DISASTER_RECOVERY_DIR"

# Function to log recovery steps
log_recovery() {
    echo "[$(date)] $1" | tee -a "$RECOVERY_LOG"
}

# Function to send emergency notification
send_emergency_notification() {
    local message="$1"
    
    echo "$message" | tee -a "$RECOVERY_LOG"
    
    # Send emergency notification
    if [ -n "$EMERGENCY_NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "DISASTER RECOVERY ALERT" "$EMERGENCY_NOTIFICATION_EMAIL"
    fi
    
    # Send webhook notification
    if [ -n "$EMERGENCY_WEBHOOK_URL" ]; then
        curl -X POST "$EMERGENCY_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"message\":\"$message\",\"severity\":\"critical\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# Step 1: Assess damage
log_recovery "Step 1: Assessing system damage"

# Check system status
SYSTEM_STATUS="unknown"
if [ -f "/proc/uptime" ]; then
    SYSTEM_STATUS="running"
    log_recovery "System is running"
else
    SYSTEM_STATUS="down"
    log_recovery "System is down"
    send_emergency_notification "System is down - initiating disaster recovery"
fi

# Check database status
DB_STATUS="unknown"
if pg_isready -h localhost -p 5432 -U hostingco 2>/dev/null; then
    DB_STATUS="running"
    log_recovery "Database is running"
else
    DB_STATUS="down"
    log_recovery "Database is down"
fi

# Check application status
APP_STATUS="unknown"
if curl -s http://localhost:3003/api/health > /dev/null 2>&1; then
    APP_STATUS="running"
    log_recovery "Application is running"
else
    APP_STATUS="down"
    log_recovery "Application is down"
fi

# Step 2: Identify latest available backups
log_recovery "Step 2: Identifying latest available backups"

LATEST_DB_BACKUP=$(ls -t /backups/database/hostingco_backup_*.sql.gz 2>/dev/null | head -1)
LATEST_FS_BACKUP=$(ls -t /backups/filesystem/hostingco_files_*.tar.gz 2>/dev/null | head -1)
LATEST_CONFIG_BACKUP=$(ls -t /backups/config/config_backup_*.tar.gz 2>/dev/null | head -1)

if [ -n "$LATEST_DB_BACKUP" ]; then
    log_recovery "Latest database backup: $LATEST_DB_BACKUP"
else
    log_recovery "No database backup found"
    send_emergency_notification "No database backup available - CRITICAL"
fi

if [ -n "$LATEST_FS_BACKUP" ]; then
    log_recovery "Latest filesystem backup: $LATEST_FS_BACKUP"
else
    log_recovery "No filesystem backup found"
    send_emergency_notification "No filesystem backup available - CRITICAL"
fi

if [ -n "$LATEST_CONFIG_BACKUP" ]; then
    log_recovery "Latest config backup: $LATEST_CONFIG_BACKUP"
else
    log_recovery "No configuration backup found"
fi

# Step 3: Begin recovery process
log_recovery "Step 3: Beginning recovery process"

# Recover filesystem first
if [ -n "$LATEST_FS_BACKUP" ] && [ "$APP_STATUS" = "down" ]; then
    log_recovery "Recovering filesystem..."
    /usr/local/bin/filesystem-recovery.sh "$LATEST_FS_BACKUP" 2>&1 | tee -a "$RECOVERY_LOG"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_recovery "Filesystem recovery completed"
        APP_STATUS="recovered"
    else
        log_recovery "Filesystem recovery failed"
        send_emergency_notification "Filesystem recovery failed - MANUAL INTERVENTION REQUIRED"
    fi
fi

# Recover database
if [ -n "$LATEST_DB_BACKUP" ] && [ "$DB_STATUS" = "down" ]; then
    log_recovery "Recovering database..."
    /usr/local/bin/database-recovery.sh "$LATEST_DB_BACKUP" 2>&1 | tee -a "$RECOVERY_LOG"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_recovery "Database recovery completed"
        DB_STATUS="recovered"
    else
        log_recovery "Database recovery failed"
        send_emergency_notification "Database recovery failed - MANUAL INTERVENTION REQUIRED"
    fi
fi

# Recover configuration
if [ -n "$LATEST_CONFIG_BACKUP" ]; then
    log_recovery "Recovering configuration..."
    tar -xzf "$LATEST_CONFIG_BACKUP" -C /
    log_recovery "Configuration recovery completed"
fi

# Step 4: Verify recovery
log_recovery "Step 4: Verifying recovery"

# Verify all services are running
RECOVERY_SUCCESS=true

# Check database
if pg_isready -h localhost -p 5432 -U hostingco 2>/dev/null; then
    log_recovery "Database is running"
else
    log_recovery "Database is not running"
    RECOVERY_SUCCESS=false
fi

# Check application
if curl -s http://localhost:3003/api/health > /dev/null 2>&1; then
    log_recovery "Application is running"
else
    log_recovery "Application is not running"
    RECOVERY_SUCCESS=false
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_recovery "Frontend is running"
else
    log_recovery "Frontend is not running"
    RECOVERY_SUCCESS=false
fi

# Step 5: Generate recovery report
log_recovery "Step 5: Generating recovery report"

RECOVERY_REPORT="${DISASTER_RECOVERY_DIR}/disaster_recovery_report_${DATE}.json"

cat > "$RECOVERY_REPORT" << EOF
{
    "recovery_date": "$(date -Iseconds)",
    "initial_status": {
        "system": "$SYSTEM_STATUS",
        "database": "$DB_STATUS",
        "application": "$APP_STATUS"
    },
    "backups_used": {
        "database": "$(basename "$LATEST_DB_BACKUP" 2>/dev/null || echo "none")",
        "filesystem": "$(basename "$LATEST_FS_BACKUP" 2>/dev/null || echo "none")",
        "configuration": "$(basename "$LATEST_CONFIG_BACKUP" 2>/dev/null || echo "none")"
    },
    "recovery_steps": [
        "Damage assessment",
        "Backup identification",
        "Filesystem recovery",
        "Database recovery",
        "Configuration recovery",
        "Recovery verification"
    ],
    "final_status": {
        "system": "$(if [ -f "/proc/uptime" ]; then echo "running"; else echo "down"; fi)",
        "database": "$(if pg_isready -h localhost -p 5432 -U hostingco 2>/dev/null; then echo "running"; else echo "down"; fi)",
        "application": "$(if curl -s http://localhost:3003/api/health > /dev/null 2>&1; then echo "running"; else echo "down"; fi)",
        "frontend": "$(if curl -s http://localhost:3000 > /dev/null 2>&1; then echo "running"; else echo "down"; fi)"
    },
    "success": $RECOVERY_SUCCESS,
    "log_file": "$RECOVERY_LOG"
}
EOF

log_recovery "Recovery report generated: $RECOVERY_REPORT"

# Step 6: Send final notification
if [ "$RECOVERY_SUCCESS" = true ]; then
    log_recovery "Disaster recovery completed successfully"
    send_emergency_notification "Disaster recovery completed successfully - All services restored"
else
    log_recovery "Disaster recovery failed - Manual intervention required"
    send_emergency_notification "Disaster recovery failed - MANUAL INTERVENTION REQUIRED"
fi

echo "=== Disaster Recovery Complete ===" | tee -a "$RECOVERY_LOG"
```

## Backup Monitoring and Verification

### Backup Verification Script
```bash
#!/bin/bash
# verify-backups.sh

echo "=== Backup Verification - $(date) ==="

# Configuration
BACKUP_DIR="/backups"
VERIFICATION_LOG="/var/log/backup_verification.log"

# Function to log verification
log_verification() {
    echo "[$(date)] $1" | tee -a "$VERIFICATION_LOG"
}

# Verify database backups
log_verification "1. Verifying database backups"

DB_BACKUP_COUNT=0
DB_BACKUP_VALID=0

for backup in /backups/database/hostingco_backup_*.sql.gz; do
    if [ -f "$backup" ]; then
        DB_BACKUP_COUNT=$((DB_BACKUP_COUNT + 1))
        
        # Check backup integrity
        if gzip -t "$backup" 2>/dev/null; then
            DB_BACKUP_VALID=$((DB_BACKUP_VALID + 1))
            log_verification "Database backup $(basename "$backup") is valid"
        else
            log_verification "Database backup $(basename "$backup") is corrupted"
        fi
    fi
done

log_verification "Database backups: $DB_BACKUP_VALID/$DB_BACKUP_COUNT valid"

# Verify filesystem backups
log_verification "2. Verifying filesystem backups"

FS_BACKUP_COUNT=0
FS_BACKUP_VALID=0

for backup in /backups/filesystem/hostingco_files_*.tar.gz; do
    if [ -f "$backup" ]; then
        FS_BACKUP_COUNT=$((FS_BACKUP_COUNT + 1))
        
        # Check backup integrity
        if tar -tzf "$backup" > /dev/null 2>&1; then
            FS_BACKUP_VALID=$((FS_BACKUP_VALID + 1))
            log_verification "Filesystem backup $(basename "$backup") is valid"
        else
            log_verification "Filesystem backup $(basename "$backup") is corrupted"
        fi
    fi
done

log_verification "Filesystem backups: $FS_BACKUP_VALID/$FS_BACKUP_COUNT valid"

# Verify configuration backups
log_verification "3. Verifying configuration backups"

CONFIG_BACKUP_COUNT=0
CONFIG_BACKUP_VALID=0

for backup in /backups/config/config_backup_*.tar.gz; do
    if [ -f "$backup" ]; then
        CONFIG_BACKUP_COUNT=$((CONFIG_BACKUP_COUNT + 1))
        
        # Check backup integrity
        if tar -tzf "$backup" > /dev/null 2>&1; then
            CONFIG_BACKUP_VALID=$((CONFIG_BACKUP_VALID + 1))
            log_verification "Configuration backup $(basename "$backup") is valid"
        else
            log_verification "Configuration backup $(basename "$backup") is corrupted"
        fi
    fi
done

log_verification "Configuration backups: $CONFIG_BACKUP_VALID/$CONFIG_BACKUP_COUNT valid"

# Check backup ages
log_verification "4. Checking backup ages"

# Find oldest backup
OLDEST_DB_BACKUP=$(ls -t /backups/database/hostingco_backup_*.sql.gz | tail -1)
if [ -n "$OLDEST_DB_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$OLDEST_DB_BACKUP")) / 86400 ))
    log_verification "Oldest database backup is $BACKUP_AGE days old"
    
    if [ $BACKUP_AGE -gt 30 ]; then
        log_verification "Database backup is older than 30 days"
    fi
fi

# Check storage space
log_verification "5. Checking backup storage space"

BACKUP_SPACE=$(df -h /backups | awk 'NR==2{print $5}' | sed 's/%//')
log_verification "Backup storage usage: $BACKUP_SPACE%"

if [ $BACKUP_SPACE -gt 80 ]; then
    log_verification "Backup storage usage is above 80%"
fi

# Generate verification report
VERIFICATION_REPORT="/var/log/backup_verification_report_$(date +%Y%m%d).json"

cat > "$VERIFICATION_REPORT" << EOF
{
    "verification_date": "$(date -Iseconds)",
    "database_backups": {
        "total": $DB_BACKUP_COUNT,
        "valid": $DB_BACKUP_VALID,
        "invalid": $((DB_BACKUP_COUNT - DB_BACKUP_VALID))
    },
    "filesystem_backups": {
        "total": $FS_BACKUP_COUNT,
        "valid": $FS_BACKUP_VALID,
        "invalid": $((FS_BACKUP_COUNT - FS_BACKUP_VALID))
    },
    "configuration_backups": {
        "total": $CONFIG_BACKUP_COUNT,
        "valid": $CONFIG_BACKUP_VALID,
        "invalid": $((CONFIG_BACKUP_COUNT - CONFIG_BACKUP_VALID))
    },
    "storage_usage": "$BACKUP_SPACE%",
    "oldest_backup_age": "$BACKUP_AGE days"
}
EOF

log_verification "Verification report generated: $VERIFICATION_REPORT"

# Send notification if issues found
TOTAL_INVALID=$(( (DB_BACKUP_COUNT - DB_BACKUP_VALID) + (FS_BACKUP_COUNT - FS_BACKUP_VALID) + (CONFIG_BACKUP_COUNT - CONFIG_BACKUP_VALID) ))

if [ $TOTAL_INVALID -gt 0 ] || [ $BACKUP_SPACE -gt 80 ]; then
    log_verification "Backup issues detected - Sending notification"
    
    if [ -n "$BACKUP_NOTIFICATION_EMAIL" ]; then
        echo "Backup verification found $TOTAL_INVALID invalid backups and $BACKUP_SPACE% storage usage" | \
        mail -s "Backup Verification Alert" "$BACKUP_NOTIFICATION_EMAIL"
    fi
fi

echo "=== Backup Verification Complete ===" | tee -a "$VERIFICATION_LOG"
```

## Backup and Recovery Procedures Checklist

### Daily Checklist
- [ ] Verify automated backups completed successfully
- [ ] Check backup integrity
- [ ] Monitor backup storage space
- [ ] Review backup logs for errors
- [ ] Verify WAL archiving is working
- [ ] Check backup notification delivery

### Weekly Checklist
- [ ] Run full backup verification
- [ ] Test restore procedures on test system
- [ ] Review backup retention policies
- [ ] Check backup performance metrics
- [ ] Update backup documentation
- [ ] Verify offsite backup synchronization

### Monthly Checklist
- [ ] Perform full disaster recovery drill
- [ ] Test point-in-time recovery
- [ ] Review backup storage capacity
- [ ] Update backup and recovery procedures
- [ ] Train staff on recovery procedures
- [ ] Review and update contact information

### Quarterly Checklist
- [ ] Comprehensive backup system audit
- [ ] Test disaster recovery plan
- [ ] Review backup compliance requirements
- [ ] Update backup technology and tools
- [ ] Perform backup performance optimization
- [ ] Review and update disaster recovery documentation

## Emergency Procedures

### When to Initiate Recovery

#### Critical Scenarios
- Complete system failure
- Database corruption
- Ransomware attack
- Natural disaster
- Hardware failure
- Data breach requiring system rebuild

### Emergency Contacts
- **Primary Contact**: +1-555-EMERGENCY
- **Technical Lead**: +1-555-TECH-LEAD
- **System Administrator**: +1-555-SYS-ADMIN
- **Database Administrator**: +1-555-DB-ADMIN

### Emergency Response Steps
1. **Assess Situation** - Determine scope and impact
2. **Notify Team** - Alert all relevant personnel
3. **Initiate Recovery** - Begin disaster recovery procedures
4. **Communicate Status** - Keep stakeholders informed
5. **Document Everything** - Log all actions and decisions

---

*Last updated: $(date)*
