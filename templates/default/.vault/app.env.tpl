# SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
# __SPDX_ID_LINE__
{{- with secret "secret/data/__PROJECT_NAME__" -}}
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info
MONGO_URI={{ .Data.data.MONGO_URI }}
CORS_ORIGIN={{ .Data.data.CORS_ORIGIN | or "*" }}
{{- end }}
