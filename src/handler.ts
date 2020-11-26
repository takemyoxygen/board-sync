import fs from 'fs';

export function handle(event: any) {
  console.log('Received a message of type', event.action?.type);
  fs.writeFileSync('./samples/sample.json', JSON.stringify(event, null, 2));
}
