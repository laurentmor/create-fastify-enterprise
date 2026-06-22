# SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
# __SPDX_ID_LINE__
#
# Example Vault Agent configuration for __PROJECT_NAME__.
#
# This renders the secrets at `secret/data/__PROJECT_NAME__` into a flat
# env file the app sources before it starts — the same shape as .env, so
# src/config/env.ts needs zero awareness of where its values came from.
#
# Local smoke test:
#   vault server -dev -dev-root-token-id=root &
#   export VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root
#   vault kv put secret/__PROJECT_NAME__ MONGO_URI="mongodb://127.0.0.1:27017/__PROJECT_NAME__"
#   vault agent -config=.vault/agent-config.hcl
#   set -a && source /tmp/__PROJECT_NAME__/app.env && set +a
#
# In Kubernetes this same config typically runs as an `initContainer` or
# sidecar via the Vault Agent Injector, with `auto_auth.method` switched
# from "token_file" to "kubernetes".

pid_file = "/tmp/__PROJECT_NAME__/agent.pid"

vault {
  address = "VAULT_ADDR" # overridden by the VAULT_ADDR env var at runtime
}

auto_auth {
  method "token_file" {
    config = {
      # Dev-only auth method: reads a pre-existing token from disk.
      # Swap for "kubernetes", "approle" or "aws" in real environments —
      # never ship a method that requires a long-lived static token.
      token_file_path = "/tmp/__PROJECT_NAME__/vault-token"
    }
  }

  sink "file" {
    config = {
      path = "/tmp/__PROJECT_NAME__/agent-token"
    }
  }
}

template {
  source      = ".vault/app.env.tpl"
  destination = "/tmp/__PROJECT_NAME__/app.env"
  perms       = "0600"
  # Restart-on-change: re-render whenever the underlying secret rotates.
  command     = "echo 'secrets rendered, restart the app to pick up changes'"
}
