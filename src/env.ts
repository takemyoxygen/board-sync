import { str, cleanEnv, num, makeValidator } from 'envalid';

const commaSeparated = makeValidator((input) =>
  typeof input === 'string' ? input.split(',') : input
);

export default cleanEnv(process.env, {
  API_TOKEN: str(),
  API_KEY: str(),
  BOARDS: commaSeparated({ default: [] }),
  PORT: num({ default: 8093 })
});
