#!/bin/sh
# wait-for-it.sh script to wait for database to be ready

set -e

host="$1"
port="$2"
shift 2

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port to be ready..."
  sleep 1
done

echo "$host:$port is up - executing command"
exec "$@" 