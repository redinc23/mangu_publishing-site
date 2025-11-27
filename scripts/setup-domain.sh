#!/bin/bash

# setup-domain.sh - Interactive script to set up domain DNS and SSL
# Supports AWS Route53, Cloudflare, and generic DNS providers

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[LOG]${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }

# Check dependencies
check_deps() {
    local missing=()
    for cmd in aws curl dig; do
        command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing[*]}"
        exit 1
    fi
}

# AWS Route53 setup
setup_route53() {
    log "Setting up AWS Route53..."
    
    read -p "Enter your domain name (e.g., example.com): " DOMAIN
    read -p "Enter your server IP or ALB DNS name: " TARGET
    
    # Check if hosted zone exists
    local zone_id
    zone_id=$(aws route53 list-hosted-zones-by-name \
        --dns-name "$DOMAIN" \
        --query 'HostedZones[0].Id' \
        --output text 2>/dev/null | cut -d'/' -f3 || echo "")
    
    if [ -z "$zone_id" ] || [ "$zone_id" = "None" ]; then
        log "Creating hosted zone for $DOMAIN..."
        zone_id=$(aws route53 create-hosted-zone \
            --name "$DOMAIN" \
            --caller-reference "$(date +%s)" \
            --query 'HostedZone.Id' \
            --output text | cut -d'/' -f3)
        success "Created hosted zone: $zone_id"
    else
        success "Using existing hosted zone: $zone_id"
    fi
    
    # Get nameservers
    local nameservers
    nameservers=$(aws route53 get-hosted-zone \
        --id "$zone_id" \
        --query 'DelegationSet.NameServers' \
        --output text)
    
    echo ""
    warn "Update your domain registrar with these nameservers:"
    echo "$nameservers" | tr '\t' '\n'
    echo ""
    read -p "Press Enter after updating nameservers..."
    
    # Create A record
    log "Creating A record..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$zone_id" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$DOMAIN\",
                    \"Type\": \"A\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [{\"Value\": \"$TARGET\"}]
                }
            }]
        }" > /dev/null
    
    success "A record created for $DOMAIN"
    
    # Create CNAME for www
    log "Creating CNAME record for www..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$zone_id" \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"www.$DOMAIN\",
                    \"Type\": \"CNAME\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [{\"Value\": \"$DOMAIN\"}]
                }
            }]
        }" > /dev/null
    
    success "CNAME record created for www.$DOMAIN"
    
    echo ""
    success "Route53 setup complete!"
    log "DNS propagation may take 24-48 hours"
}

# SSL Certificate setup with ACM
setup_acm_certificate() {
    log "Setting up SSL certificate with AWS Certificate Manager..."
    
    read -p "Enter your domain name: " DOMAIN
    read -p "Enter email for certificate notifications: " EMAIL
    
    # Request certificate
    log "Requesting certificate..."
    local cert_arn
    cert_arn=$(aws acm request-certificate \
        --domain-name "$DOMAIN" \
        --subject-alternative-names "www.$DOMAIN" \
        --validation-method DNS \
        --region us-east-1 \
        --query 'CertificateArn' \
        --output text)
    
    success "Certificate requested: $cert_arn"
    
    # Wait for validation records
    log "Waiting for validation records..."
    sleep 5
    
    # Get validation records
    local validation_records
    validation_records=$(aws acm describe-certificate \
        --certificate-arn "$cert_arn" \
        --region us-east-1 \
        --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value,ResourceRecord.Type]' \
        --output text)
    
    echo ""
    warn "Add these DNS validation records to Route53:"
    echo "$validation_records" | while read -r domain name value type; do
        echo "  $type: $name -> $value"
    done
    echo ""
    
    read -p "Press Enter after adding validation records..."
    
    # Wait for validation
    log "Waiting for certificate validation (this may take 5-30 minutes)..."
    aws acm wait certificate-validated \
        --certificate-arn "$cert_arn" \
        --region us-east-1 \
        --max-attempts 60 \
        --delay 30 || warn "Validation timeout - check manually"
    
    success "Certificate validated!"
    echo ""
    log "Certificate ARN: $cert_arn"
    log "Attach this certificate to your load balancer or CloudFront distribution"
}

# Generic DNS instructions
show_generic_dns() {
    log "Generic DNS Setup Instructions"
    echo ""
    read -p "Enter your domain name: " DOMAIN
    read -p "Enter your server IP address: " IP
    
    echo ""
    echo "Add these DNS records at your domain registrar:"
    echo ""
    echo "Type: A"
    echo "Name: @ (or blank)"
    echo "Value: $IP"
    echo "TTL: 300"
    echo ""
    echo "Type: CNAME"
    echo "Name: www"
    echo "Value: $DOMAIN"
    echo "TTL: 300"
    echo ""
    read -p "Press Enter after adding DNS records..."
    
    # Test DNS
    log "Testing DNS resolution..."
    sleep 5
    
    local resolved_ip
    resolved_ip=$(dig +short "$DOMAIN" | head -n1 || echo "")
    
    if [ -n "$resolved_ip" ]; then
        if [ "$resolved_ip" = "$IP" ]; then
            success "DNS is resolving correctly!"
        else
            warn "DNS resolved to $resolved_ip (expected $IP)"
            warn "DNS may still be propagating"
        fi
    else
        warn "DNS not yet resolving - may take 24-48 hours"
    fi
}

# Let's Encrypt setup
setup_letsencrypt() {
    log "Setting up Let's Encrypt SSL certificate..."
    
    if ! command -v certbot >/dev/null 2>&1; then
        error "Certbot not installed"
        echo "Install with: sudo apt-get install certbot (Ubuntu/Debian)"
        echo "            or: sudo yum install certbot (Amazon Linux/CentOS)"
        exit 1
    fi
    
    read -p "Enter your domain name: " DOMAIN
    read -p "Enter your email: " EMAIL
    
    log "Obtaining certificate..."
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
    
    success "Certificate obtained!"
    log "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
    
    # Setup auto-renewal
    log "Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -
    success "Auto-renewal configured"
}

# Main menu
main() {
    echo ""
    echo "=========================================="
    echo "🌐 Domain Setup Wizard"
    echo "=========================================="
    echo ""
    echo "1. AWS Route53 DNS Setup"
    echo "2. AWS ACM SSL Certificate"
    echo "3. Generic DNS Setup (Instructions)"
    echo "4. Let's Encrypt SSL Certificate"
    echo "5. Exit"
    echo ""
    
    read -p "Select option (1-5): " choice
    
    case $choice in
        1)
            check_deps
            setup_route53
            ;;
        2)
            check_deps
            setup_acm_certificate
            ;;
        3)
            show_generic_dns
            ;;
        4)
            setup_letsencrypt
            ;;
        5)
            exit 0
            ;;
        *)
            error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    success "Setup complete!"
    log "Next steps:"
    log "1. Wait for DNS propagation (24-48 hours)"
    log "2. Run: ./verify-tool.sh"
    log "3. Test SSL: openssl s_client -connect $DOMAIN:443"
    echo ""
}

main "$@"



