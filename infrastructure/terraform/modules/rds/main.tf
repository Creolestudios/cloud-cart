# ============================================================
# Terraform — RDS Module (PostgreSQL)
# ============================================================

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_name" {
  type    = string
  default = "cloudcart_products"
}

variable "db_username" {
  type    = string
  default = "cloudcart"
}

variable "db_password" {
  type      = string
  sensitive = true
}

# ── Subnet Group ─────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet"
    Environment = var.environment
  }
}

# ── Security Group ────────────────────────────────────────
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment}-rds-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # VPC CIDR
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

# ── RDS Instance ─────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-postgres"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.environment == "prod" ? true : false
  backup_retention_period = var.environment == "prod" ? 7 : 1
  deletion_protection     = var.environment == "prod" ? true : false
  skip_final_snapshot     = var.environment != "prod"

  performance_insights_enabled = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Outputs ──────────────────────────────────────────────
output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_name" {
  value = aws_db_instance.main.db_name
}
