# SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
# __SPDX_ID_LINE__
#
# Example least-privilege Vault policy for __PROJECT_NAME__.
# Attach this to the auth role/service-account the app authenticates as.
#
#   vault policy write __PROJECT_NAME__ .vault/policy.hcl
#   vault write auth/kubernetes/role/__PROJECT_NAME__ \
#     bound_service_account_names=__PROJECT_NAME__ \
#     bound_service_account_namespaces=default \
#     policies=__PROJECT_NAME__ \
#     ttl=1h

path "secret/data/__PROJECT_NAME__" {
  capabilities = ["read"]
}

path "secret/metadata/__PROJECT_NAME__" {
  capabilities = ["list", "read"]
}

# Allow the app to renew its own token without granting it broader access.
path "auth/token/renew-self" {
  capabilities = ["update"]
}
