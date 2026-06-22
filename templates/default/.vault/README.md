<!--
SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
__SPDX_ID_LINE__
-->

# Vault-ready secrets

__PROJECT_NAME__ doesn't talk to Vault directly — it just reads environment
variables (see `src/config/env.ts`). That's intentional: it keeps the app
simple and means the _same_ code runs unmodified whether secrets come from
a local `.env` file, a Vault Agent sidecar, or Kubernetes secrets.

This directory holds the pieces you need to put a [Vault
Agent](https://developer.hashicorp.com/vault/docs/agent-and-proxy/agent)
in front of it:

| File               | Purpose                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `agent-config.hcl` | Vault Agent config: auth method, sink, and the template that renders secrets to an env file                                |
| `app.env.tpl`      | [consul-template](https://github.com/hashicorp/consul-template) syntax describing which KV v2 fields become which env vars |
| `policy.hcl`       | Least-privilege Vault policy — read-only access to this app's own secret path                                              |

## Local smoke test

```bash
# 1. Start a throwaway dev Vault server (or use `docker compose up vault`)
vault server -dev -dev-root-token-id=root &
export VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root

# 2. Write the secrets the app expects
vault kv put secret/__PROJECT_NAME__ \
  MONGO_URI="mongodb://127.0.0.1:27017/__PROJECT_NAME__" \
  CORS_ORIGIN="*"

# 3. Apply the policy and drop a token Agent can read (dev-only auth method)
vault policy write __PROJECT_NAME__ .vault/policy.hcl
mkdir -p /tmp/__PROJECT_NAME__
echo "$VAULT_TOKEN" > /tmp/__PROJECT_NAME__/vault-token

# 4. Run the agent — it renders /tmp/__PROJECT_NAME__/app.env
vault agent -config=.vault/agent-config.hcl &

# 5. Source the rendered file and start the app
set -a && source /tmp/__PROJECT_NAME__/app.env && set +a
__RUN__ dev
```

## In production

Swap the `token_file` auth method in `agent-config.hcl` for whatever your
platform supports natively — `kubernetes` if you run on k8s (paired with
the [Vault Agent
Injector](https://developer.hashicorp.com/vault/docs/platform/k8s/injector)),
`aws`/`gcp`/`azure` for cloud IAM-based auth, or `approle` for everything
else. Never ship the `token_file` method past local development — it
relies on a static token with no automatic rotation.

If you'd rather not run a sidecar at all, swap this for the
[Vault Secrets Operator](https://developer.hashicorp.com/vault/docs/platform/k8s/vso)
or your platform's native secrets-manager integration — the app doesn't
care, as long as the same env vars land in `process.env` before
`src/server.ts` boots.

Didn't pick the Vault option when scaffolding? This whole directory is
just example config — delete it any time, nothing else in the app
references it directly.
