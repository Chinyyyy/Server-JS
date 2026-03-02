# Imagen base ligera
FROM node:18-alpine

# Directorio dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el proyecto
COPY . .

# Exponer puerto
EXPOSE 3000

# Variable de entorno para JWT
ENV JWT_SECRET=mi_clave_secreta

# Comando para iniciar la app
CMD ["node", "server.js"]