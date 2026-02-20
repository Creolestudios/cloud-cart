# ============================================================
# API Gateway — Dockerfile
# Minimal Nginx image with custom configuration
# ============================================================

FROM nginx:1.25-alpine

# Add labels for metadata
LABEL maintainer="CloudCart Team"
LABEL description="API Gateway - Nginx Reverse Proxy"
LABEL version="1.0.0"

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for nginx
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
