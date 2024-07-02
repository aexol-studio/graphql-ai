import resolvers from './resolvers.js';
import { graphqlYogaAdapter } from '@aexol/axolotl-graphql-yoga';

graphqlYogaAdapter(resolvers).listen(4000, () => {
  console.log('listening');
});
