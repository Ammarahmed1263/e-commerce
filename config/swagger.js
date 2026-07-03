import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Luxora API',
      version: '1.0.0',
      description: 'Production-Grade E-Commerce Backend API',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Current Environment'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./docs/*.js'], // Reads annotations from docs folder
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger docs available at /api/v1/docs');
  }
};

export default setupSwagger;
