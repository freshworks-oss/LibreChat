#!/usr/bin/env bash
# Build LibreChat with Podman and push to ECR (multi-arch manifest, Geppetto-style).
#
# ECR:
#   582763096612.dkr.ecr.us-east-1.amazonaws.com/dbaas-ss-chat/librechat-dev:<tag>
#
# Usage (from anywhere; repo root is detected from this script's location):
#   ./scripts/push-librechat-ecr-podman.sh <tag>
#   ./scripts/push-librechat-ecr-podman.sh --no-cache v0.8.9-rc1-arm64
#
# Examples (MacBook Apple Silicon → Graviton EKS, arm64 only — fastest):
#   AWS_PROFILE=dbaas-app-staging aws sso login
#   PLATFORMS=linux/arm64 ./scripts/push-librechat-ecr-podman.sh --no-cache v0.8.9-rc1-arm64
#
# Multi-arch index (arm64 native on Mac; amd64 leg uses QEMU — slow on Mac):
#   PLATFORMS=linux/arm64,linux/amd64 ./scripts/push-librechat-ecr-podman.sh v0.8.9-rc1
#
# EC2 with instance role (no SSO profile):
#   unset AWS_PROFILE
#   PLATFORMS=linux/arm64 ./scripts/push-librechat-ecr-podman.sh v0.8.9-rc1-arm64
#
# Optional env: AWS_PROFILE, AWS_ACCOUNT, AWS_REGION, ECR_REPO, DOCKERFILE, PLATFORMS

set -euo pipefail

NO_CACHE_BUILD=0
TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cache)
      NO_CACHE_BUILD=1
      shift
      ;;
    -*)
      echo "✗ Unknown option: $1" >&2
      exit 1
      ;;
    *)
      if [[ -n "$TAG" ]]; then
        echo "✗ Unexpected extra argument: $1" >&2
        exit 1
      fi
      TAG="$1"
      shift
      ;;
  esac
done

[[ "${NO_CACHE:-}" == "1" ]] && NO_CACHE_BUILD=1

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 [--no-cache] <tag>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

AWS_PROFILE="${AWS_PROFILE:-dbaas-app-staging}"
AWS_ACCOUNT="${AWS_ACCOUNT:-582763096612}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-dbaas-ss-chat/librechat-dev}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
PLATFORMS="${PLATFORMS:-linux/arm64,linux/amd64}"

REGISTRY="${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${REGISTRY}/${ECR_REPO}"
MANIFEST="${ECR_IMAGE}:${TAG}"
BUILD_CONTEXT="${REPO_ROOT}"

note() { printf '▶ %s\n' "$*"; }
die() { echo "✗ $*" >&2; exit 1; }

require() {
  for cmd in "$@"; do
    command -v "$cmd" &>/dev/null || die "Required command not found: $cmd"
  done
}

[[ -f "${BUILD_CONTEXT}/${DOCKERFILE}" ]] || die "Dockerfile not found: ${BUILD_CONTEXT}/${DOCKERFILE}"
require podman

AWS_BIN=""
if command -v aws &>/dev/null; then
  AWS_BIN="aws"
elif command -v awsv2 &>/dev/null; then
  AWS_BIN="awsv2"
else
  die "Required command not found: aws (or awsv2)"
fi

AWS_ARGS=(--region "${AWS_REGION}")
if [[ -n "${AWS_PROFILE}" ]]; then
  AWS_ARGS+=(--profile "${AWS_PROFILE}")
fi

note "Building LibreChat → ${MANIFEST}"
note "Platforms: ${PLATFORMS}"
note "Context:   ${BUILD_CONTEXT}"
note "Dockerfile: ${DOCKERFILE}"
[[ -n "${AWS_PROFILE}" ]] && note "AWS profile: ${AWS_PROFILE} (${AWS_BIN})"
[[ "$NO_CACHE_BUILD" -eq 1 ]] && note "Cache: disabled"

note "Authenticating with ECR (${REGISTRY})"
PASSWORD="$("${AWS_BIN}" ecr get-login-password "${AWS_ARGS[@]}")" ||
  die "Failed to get ECR login password (try: ${AWS_BIN} sso login --profile ${AWS_PROFILE:-default})"
printf '%s' "${PASSWORD}" | podman login --username AWS --password-stdin "${REGISTRY}"

podman_build() {
  local platform="$1"
  local tag="$2"
  if [[ "$NO_CACHE_BUILD" -eq 1 ]]; then
    podman build --platform "${platform}" --no-cache --file "${BUILD_CONTEXT}/${DOCKERFILE}" --tag "${tag}" "${BUILD_CONTEXT}"
  else
    podman build --platform "${platform}" --file "${BUILD_CONTEXT}/${DOCKERFILE}" --tag "${tag}" "${BUILD_CONTEXT}"
  fi
}

arch_file="$(mktemp)"
trap 'rm -f "${arch_file}"' EXIT

rest="${PLATFORMS}"
while [[ -n "${rest}" ]]; do
  platform="${rest%%,*}"
  if [[ "${rest}" == *,* ]]; then
    rest="${rest#*,}"
  else
    rest=""
  fi
  arch="${platform#*/}"
  arch="${arch//\//-}"
  arch_image="${MANIFEST}-${arch}"

  note "Building ${arch_image} (${platform})"
  podman_build "${platform}" "${arch_image}"

  note "Pushing ${arch_image}"
  podman push "${arch_image}"
  printf '%s\n' "${arch_image}" >> "${arch_file}"
done

publish_index() {
  local dest="$1"
  note "Creating image index ${dest}"
  podman manifest rm "${dest}" 2>/dev/null || true
  podman manifest create "${dest}"
  while IFS= read -r arch_image; do
    [[ -n "${arch_image}" ]] || continue
    note "Adding ${arch_image}"
    podman manifest add "${dest}" "${arch_image}"
  done < "${arch_file}"
  note "Pushing image index ${dest}"
  podman manifest push --all "${dest}" "docker://${dest}"
  podman manifest rm "${dest}" 2>/dev/null || true
}

publish_index "${MANIFEST}"

note "Done."
note "  Image: ${MANIFEST}"
note "Verify: podman manifest inspect docker://${MANIFEST}"
