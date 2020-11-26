import { str, cleanEnv, num } from 'envalid';

export default cleanEnv(process.env, {
  API_TOKEN: str(),
  API_KEY: str(),
  BOARD_ID: str(),
  PORT: num({ default: 8093 })
});
