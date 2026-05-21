#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== unifymemfile manager ===${NC}\n"

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado.${NC}"
    exit 1
fi

# 2. Instalar dependencias si no existen o se solicita instalación
if [ "$1" != "--uninstall" ]; then
    echo -e "${GREEN}Verificando dependencias...${NC}"
    npm install --silent
    
    echo -e "${GREEN}Compilando el proyecto...${NC}"
    npm run build --silent
fi

# 3. Ejecutar el gestor interactivo
npm run install:ide

echo -e "\n${BLUE}Proceso finalizado.${NC}"
