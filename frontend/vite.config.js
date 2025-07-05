export default {
  root: ".",
  server: {
    port: 3000,
    proxy: {
      "/tictactoe": "http://localhost:8000",
    },
  },
};
