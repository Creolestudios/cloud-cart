# ============================================================
# Terraform — Dev Environment
# Orchestrates all modules for development
# ============================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cloudcart"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "db_password" {
  type      = string
  sensitive = true
  default   = "changeme_in_production"
}

# ── VPC ────────────────────────────────────────────────────
module "vpc" {
  source = "../../modules/vpc"

  project_name = "cloudcart"
  environment  = "dev"
  vpc_cidr     = "10.0.0.0/16"
}

# ── EKS ────────────────────────────────────────────────────
module "eks" {
  source = "../../modules/eks"

  project_name       = "cloudcart"
  environment        = "dev"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_types = ["t3.medium"]
  node_desired_size   = 2
  node_min_size       = 1
  node_max_size       = 4
}

# ── RDS (PostgreSQL) ──────────────────────────────────────
module "rds" {
  source = "../../modules/rds"

  project_name       = "cloudcart"
  environment        = "dev"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_instance_class  = "db.t3.micro"
  db_password        = var.db_password
}

# ── Outputs ───────────────────────────────────────────────
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value     = module.rds.db_endpoint
  sensitive = true
}
