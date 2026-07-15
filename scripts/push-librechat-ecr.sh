#!/usr/bin/env bash
# ./scripts/push-librechat-ecr.sh [--no-cache] <image-tag>
# Example: ./scripts/push-librechat-ecr.sh --no-cache v0.8.6-rc1
set -euo pipefail

NO_CACHE_BUILD=0
[[ "${NO_CACHE:-}" == "1" ]] && NO_CACHE_BUILD=1

TAG=""
for arg in "$@"; do
  case "$arg" in
    --no-cache)
      NO_CACHE_BUILD=1
      ;;
    *)
      if [[ -n "$TAG" ]]; then
        echo "error: unexpected extra argument: $arg" >&2
        exit 1
      fi
      TAG="$arg"
      ;;
  esac
done

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 [--no-cache] <image-tag>" >&2
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-582763096612}"
ECR_REPO="${ECR_REPO:-dbaas-ss-chat/librechat-dev}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
PLATFORMS="${PLATFORMS:-linux/amd64}"

# ✅ Better repo detection
if [[ -n "${REPO_ROOT:-}" ]]; then
  REPO_ROOT="$REPO_ROOT"
elif git rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT="$(git rev-parse --show-toplevel)"
else
  echo "❌ Could not detect repo root. Set REPO_ROOT manually." >&2
  exit 1
fi

cd "$REPO_ROOT"

ECR_HOST="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_HOST}/${ECR_REPO}"

echo "ECR repository: ${IMAGE_URI}"
echo "Tag:            ${TAG}"
echo "Platforms:      ${PLATFORMS}"
echo "Build context:  ${REPO_ROOT}"
echo "Dockerfile:     ${DOCKERFILE}"
[[ "$NO_CACHE_BUILD" -eq 1 ]] && echo "Cache: disabled"

# ❗ Require buildx
if ! docker buildx version >/dev/null 2>&1; then
  echo "❌ docker buildx is required" >&2
  exit 1
fi

# ✅ Ensure builder exists
docker buildx create --use --name librechat-builder >/dev/null 2>&1 || true
docker buildx inspect --bootstrap

# ✅ Login
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$ECR_HOST"

# ✅ Build args
BUILD_ARGS=(
  buildx build
  --platform "$PLATFORMS"
  -f "$DOCKERFILE"
  -t "${IMAGE_URI}:${TAG}"
  --push
  --provenance=false
  --sbom=false
)

[[ "$NO_CACHE_BUILD" -eq 1 ]] && BUILD_ARGS+=(--no-cache)

echo "Building and pushing..."
docker "${BUILD_ARGS[@]}" .

echo
echo "✅ Done: ${IMAGE_URI}:${TAG}"

# ✅ Always show architecture (not optional anymore)
echo
echo "🔍 Image manifest:"
docker buildx imagetools inspect "${IMAGE_URI}:${TAG}"