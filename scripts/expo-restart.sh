#!/usr/bin/env bash
# Reinicia Expo limpiando caché y procesos previos

killall node 2>/dev/null
sleep 1
cd "/Users/walter/Trabajos/menu-del-dia/mobile" || exit 1
npx expo start --clear