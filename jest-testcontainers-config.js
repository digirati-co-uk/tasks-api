module.exports = {
  postgres: {
    image: 'postgres',
    tag: '13.1-alpine',
    ports: [5432],
    env: {
      POSTGRES_PASSWORD: 'postgres',
    },
    wait: {
      type: 'text',
      text: 'server started',
    },
  },
};
